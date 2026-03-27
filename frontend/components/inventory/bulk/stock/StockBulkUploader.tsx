"use client";

import React, { useState, useRef, useEffect } from "react";
import { FileUpload, FileUploadSelectEvent } from "primereact/fileupload";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressBar } from "primereact/progressbar";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import * as XLSX from "xlsx";
import { IStockBulkResult } from "@/app/api/inventory/stockBulkService";

// ============================================================================
// TYPES
// ============================================================================

export interface StockFieldDef {
  key: string;
  label: string;
  required: boolean;
  description: string;
}

interface PreviewRow {
  [key: string]: string;
}

type FieldMapping = Record<string, string>;
type UploadStage = "idle" | "converting" | "processing";

const SKIP_VALUE = "__skip__";
const CHUNK_SIZE = 500;
const LARGE_FILE_THRESHOLD = 500;

// ============================================================================
// HELPERS
// ============================================================================

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function csvToLogicalLines(csv: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (ch === '"') {
      if (inQuotes && csv[i + 1] === '"') {
        current += '""';
        i++;
      } else {
        inQuotes = !inQuotes;
        current += ch;
      }
    } else if ((ch === "\n" || (ch === "\r" && csv[i + 1] === "\n")) && !inQuotes) {
      if (ch === "\r") i++;
      lines.push(current);
      current = "";
    } else if (ch === "\r" && !inQuotes) {
      lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);
  return lines;
}

function splitCSVIntoChunks(csv: string, size: number): string[] {
  const logicalLines = csvToLogicalLines(csv);
  if (logicalLines.length < 2) return [csv];
  const header = logicalLines[0];
  const dataLines = logicalLines.slice(1).filter((l) => l.trim() !== "");
  if (dataLines.length === 0) return [csv];
  const chunks: string[] = [];
  for (let i = 0; i < dataLines.length; i += size) {
    chunks.push([header, ...dataLines.slice(i, i + size)].join("\n"));
  }
  return chunks;
}

function parseField(line: string, start: number): { value: string; end: number } {
  if (line[start] === '"') {
    let value = "";
    let i = start + 1;
    while (i < line.length) {
      if (line[i] === '"' && line[i + 1] === '"') {
        value += '"';
        i += 2;
      } else if (line[i] === '"') {
        i++;
        break;
      } else {
        value += line[i++];
      }
    }
    return { value, end: i + (line[i] === "," ? 1 : 0) };
  }
  const comma = line.indexOf(",", start);
  if (comma === -1) return { value: line.slice(start).trim(), end: line.length };
  return { value: line.slice(start, comma).trim(), end: comma + 1 };
}

function parseLine(line: string): string[] {
  const fields: string[] = [];
  let pos = 0;
  while (pos <= line.length) {
    const { value, end } = parseField(line, pos);
    fields.push(value);
    if (end >= line.length) break;
    pos = end;
  }
  return fields;
}

function parseCSVString(content: string): { headers: string[]; rows: PreviewRow[]; totalRows: number } {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [], totalRows: 0 };
  const headers = parseLine(lines[0]).map((h) => h.trim());
  const rows: PreviewRow[] = [];
  for (let i = 1; i < Math.min(lines.length, 11); i++) {
    const values = parseLine(lines[i]);
    const row: PreviewRow = {};
    headers.forEach((h, idx) => { row[h] = values[idx]?.trim() ?? ""; });
    rows.push(row);
  }
  return { headers, rows, totalRows: lines.length - 1 };
}

function parseExcelBuffer(buffer: ArrayBuffer): { headers: string[]; rows: PreviewRow[]; totalRows: number } {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return { headers: [], rows: [], totalRows: 0 };
  const data: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  if (data.length < 2) return { headers: [], rows: [], totalRows: 0 };
  const headers = (data[0] as string[]).map((h) => String(h).trim());
  const rows: PreviewRow[] = data.slice(1, 11).map((rowArr) => {
    const row: PreviewRow = {};
    headers.forEach((h, idx) => { row[h] = String((rowArr as string[])[idx] ?? "").trim(); });
    return row;
  });
  return { headers, rows, totalRows: data.length - 1 };
}

function excelBufferToCSV(buffer: ArrayBuffer, mapping: FieldMapping): string {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return "";
  const allRows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  if (allRows.length < 2) return "";
  const fileHeaders = (allRows[0] as string[]).map((h) => String(h).trim());
  const colToField: Record<string, string> = {};
  for (const [field, col] of Object.entries(mapping)) {
    if (col && col !== SKIP_VALUE) colToField[col] = field;
  }
  const outputHeaders: string[] = fileHeaders.map((col) => colToField[col] ?? col);
  const escapeCsvField = (v: string): string => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csvLines: string[] = [outputHeaders.map(escapeCsvField).join(",")];
  for (let i = 1; i < allRows.length; i++) {
    const row = allRows[i] as string[];
    if (row.every((c) => !String(c).trim())) continue;
    csvLines.push(fileHeaders.map((_, idx) => escapeCsvField(String(row[idx] ?? ""))).join(","));
  }
  return csvLines.join("\n");
}

function applyMappingToCSV(original: string, mapping: FieldMapping): string {
  const lines = original.trim().split(/\r?\n/);
  if (lines.length < 1) return original;
  const fileHeaders = lines[0].split(",").map((h) => h.trim());
  const colToField: Record<string, string> = {};
  for (const [field, col] of Object.entries(mapping)) {
    if (col && col !== SKIP_VALUE) colToField[col] = field;
  }
  const newHeaders = fileHeaders.map((col) => colToField[col] ?? col);
  return [newHeaders.join(","), ...lines.slice(1)].join("\n");
}

function detectAutoMapping(fileHeaders: string[], fields: StockFieldDef[]): FieldMapping {
  const mapping: FieldMapping = {};
  const normalizedHeaders = fileHeaders.map((h) => h.toLowerCase().trim());
  for (const field of fields) {
    const idx = normalizedHeaders.indexOf(field.key.toLowerCase());
    if (idx !== -1) mapping[field.key] = fileHeaders[idx];
  }
  return mapping;
}

function getMissingRequired(mapping: FieldMapping, fields: StockFieldDef[]): string[] {
  return fields
    .filter((f) => f.required)
    .map((f) => f.key)
    .filter((key) => !mapping[key] || mapping[key] === SKIP_VALUE);
}

// ============================================================================
// PROPS
// ============================================================================

export interface StockBulkUploaderProps {
  /** Label shown in the Card header */
  title: string;
  /** Short description shown under the title */
  description?: string;
  /** Field definitions for this operation */
  fields: StockFieldDef[];
  /** Called with final CSV content + file name — should call the API and return result */
  onProcess: (csvContent: string, fileName: string) => Promise<IStockBulkResult>;
  /** Template CSV string for download */
  templateCSV: string;
  templateFileName: string;
  /** Extra options rendered below the file info bar (e.g. updateExisting checkbox) */
  extraOptions?: React.ReactNode;
  /** Custom body renderer for preview cells — receives (row, fieldKey) */
  previewCellBody?: (row: PreviewRow, fieldKey: string) => React.ReactNode;
  /** Action label on the submit button */
  submitLabel?: string;
  submitIcon?: string;
  onComplete?: (result: IStockBulkResult) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const StockBulkUploader = ({
  title,
  description,
  fields,
  onProcess,
  templateCSV,
  templateFileName,
  extraOptions,
  previewCellBody,
  submitLabel = "Procesar",
  submitIcon = "pi pi-upload",
  onComplete,
}: StockBulkUploaderProps) => {
  const toast = useRef<Toast>(null);
  const fileUploadRef = useRef<any>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"csv" | "xlsx" | null>(null);
  const [csvContent, setCsvContent] = useState<string>("");
  const [xlsxBuffer, setXlsxBuffer] = useState<ArrayBuffer | null>(null);

  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);

  const [mapping, setMapping] = useState<FieldMapping>({});
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [needsMapping, setNeedsMapping] = useState(false);

  const [uploadStage, setUploadStage] = useState<UploadStage>("idle");
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [result, setResult] = useState<IStockBulkResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (uploadStage === "processing") {
      setElapsedSeconds(0);
      elapsedRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } else {
      if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null; }
    }
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
  }, [uploadStage]);

  // ---- File handling -------------------------------------------------------

  const handleFileSelect = async (e: FileUploadSelectEvent) => {
    const selected = e.files[0];
    if (!selected) return;
    const isXlsx = selected.name.endsWith(".xlsx") || selected.name.endsWith(".xls");
    const isCsv = selected.name.endsWith(".csv");
    if (!isXlsx && !isCsv) {
      toast.current?.show({ severity: "warn", summary: "Archivo no válido", detail: "Selecciona un .csv o .xlsx" });
      return;
    }
    setFile(selected);
    setFileType(isXlsx ? "xlsx" : "csv");
    setCsvContent("");
    setXlsxBuffer(null);
    setMapping({});
    setNeedsMapping(false);
    setResult(null);

    const reader = new FileReader();
    if (isXlsx) {
      reader.onload = (ev) => {
        const buf = ev.target?.result as ArrayBuffer;
        setXlsxBuffer(buf);
        const { headers, rows, totalRows: total } = parseExcelBuffer(buf);
        setFileHeaders(headers);
        setPreviewRows(rows);
        setTotalRows(total);
        initMapping(headers, selected.name, total);
      };
      reader.readAsArrayBuffer(selected);
    } else {
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        setCsvContent(content);
        const { headers, rows, totalRows: total } = parseCSVString(content);
        setFileHeaders(headers);
        setPreviewRows(rows);
        setTotalRows(total);
        initMapping(headers, selected.name, total);
      };
      reader.readAsText(selected);
    }
  };

  const initMapping = (headers: string[], fileName: string, rowCount: number) => {
    const autoMap = detectAutoMapping(headers, fields);
    setMapping(autoMap);
    const missing = getMissingRequired(autoMap, fields);
    const hasMismatch = missing.length > 0;
    setNeedsMapping(hasMismatch);
    if (hasMismatch) {
      setShowMappingDialog(true);
      toast.current?.show({
        severity: "info",
        summary: "Mapeo de columnas requerido",
        detail: `${missing.length} campo(s) requerido(s) no encontrado(s)`,
        life: 5000,
      });
    } else {
      toast.current?.show({ severity: "success", summary: "Archivo cargado", detail: `${fileName} — ${rowCount} fila(s)` });
    }
  };

  // ---- Mapping dialog ------------------------------------------------------

  const fileColumnOptions = [
    { label: "— Omitir campo —", value: SKIP_VALUE },
    ...fileHeaders.map((h) => ({ label: h, value: h })),
  ];

  const handleMappingConfirm = () => {
    const missing = getMissingRequired(mapping, fields);
    if (missing.length > 0) {
      const labels = missing.map((k) => fields.find((f) => f.key === k)?.label ?? k);
      toast.current?.show({ severity: "warn", summary: "Campos requeridos sin mapear", detail: `Asigna: ${labels.join(", ")}`, life: 6000 });
      return;
    }
    setNeedsMapping(false);
    setShowMappingDialog(false);
    toast.current?.show({ severity: "success", summary: "Mapeo confirmado", detail: "Puedes proceder" });
  };

  // ---- Submit --------------------------------------------------------------

  const buildFinalCSV = (): string => {
    if (fileType === "xlsx" && xlsxBuffer) return excelBufferToCSV(xlsxBuffer, mapping);
    return applyMappingToCSV(csvContent, mapping);
  };

  const handleSubmit = async () => {
    if (!file) { toast.current?.show({ severity: "error", summary: "Error", detail: "No hay archivo cargado" }); return; }
    if (needsMapping) { setShowMappingDialog(true); return; }
    try {
      setUploadStage("converting");
      const finalCSV = buildFinalCSV();
      const chunks = splitCSVIntoChunks(finalCSV, CHUNK_SIZE);
      const finalFileName = fileType === "xlsx" ? file.name.replace(/\.xlsx?$/, ".csv") : file.name;
      setTotalChunks(chunks.length);
      setCurrentChunk(0);
      setUploadStage("processing");

      let totalProcessed = 0;
      let totalFailed = 0;
      const allErrors: IStockBulkResult["errors"] = [];

      for (let i = 0; i < chunks.length; i++) {
        setCurrentChunk(i + 1);
        const res = await onProcess(chunks[i], finalFileName);
        totalProcessed += res.processed ?? 0;
        totalFailed += res.failed ?? 0;
        if (res.errors?.length) allErrors.push(...res.errors);
      }

      const combinedResult: IStockBulkResult = {
        operationId: "",
        processed: totalProcessed,
        failed: totalFailed,
        errors: allErrors,
      };

      setUploadStage("idle");
      setResult(combinedResult);
      setShowResult(true);
      toast.current?.show({
        severity: totalFailed > 0 ? "warn" : "success",
        summary: "Operación completada",
        detail: `${totalProcessed.toLocaleString()} procesados, ${totalFailed.toLocaleString()} error(es)`,
        life: 8000,
      });
      onComplete?.(combinedResult);
    } catch (error: any) {
      setUploadStage("idle");
      toast.current?.show({ severity: "error", summary: "Error al procesar", detail: error.message || "Error desconocido", life: 8000 });
    }
  };

  // ---- Template download ---------------------------------------------------

  const handleDownloadTemplate = () => {
    const blob = new Blob([templateCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = templateFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- Reset ---------------------------------------------------------------

  const handleReset = () => {
    setFile(null);
    setFileType(null);
    setCsvContent("");
    setXlsxBuffer(null);
    setPreviewRows([]);
    setFileHeaders([]);
    setTotalRows(0);
    setMapping({});
    setNeedsMapping(false);
    setResult(null);
    setUploadStage("idle");
    setCurrentChunk(0);
    setTotalChunks(0);
    setElapsedSeconds(0);
    fileUploadRef.current?.clear();
  };

  // ---- Derived state -------------------------------------------------------

  const isUploading = uploadStage !== "idle";
  const missingRequired = getMissingRequired(mapping, fields);
  const canProcess = file !== null && !needsMapping && missingRequired.length === 0;
  const isLargeFile = totalRows >= LARGE_FILE_THRESHOLD;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex flex-column gap-4">
      <Toast ref={toast} />

      {/* ── Upload Section ─────────────────────────────────────────────── */}
      <Card
        header={
          <div className="flex align-items-center justify-content-between p-3">
            <div>
              <h3 className="m-0">{title}</h3>
              {description && <p className="text-600 text-sm m-0 mt-1">{description}</p>}
            </div>
          </div>
        }
      >
        <div className="flex flex-column gap-4">
          <FileUpload
            ref={fileUploadRef}
            name="stockFile[]"
            accept=".csv,.xlsx,.xls"
            maxFileSize={10_000_000}
            onSelect={handleFileSelect}
            auto={false}
            chooseLabel="Seleccionar archivo"
            customUpload
            uploadHandler={() => {}}
            {...({ showUploadButton: false, showCancelButton: false } as any)}
            emptyTemplate={
              <p className="m-0 text-600">
                Arrastra un archivo <strong>.csv</strong> o <strong>.xlsx</strong> aquí, o haz clic para seleccionar
              </p>
            }
          />

          {/* File info bar */}
          {file && !isUploading && (
            <div className={`p-4 border-round border-left-4 ${needsMapping ? "bg-yellow-50 border-yellow-500" : "bg-blue-50 border-blue-500"}`}>
              <div className="flex align-items-center justify-content-between">
                <div>
                  <div className="flex align-items-center gap-2">
                    <i className={`pi ${fileType === "xlsx" ? "pi-file-excel text-green-600" : "pi-file text-blue-600"} text-xl`} />
                    <strong>{file.name}</strong>
                    <Tag value={fileType?.toUpperCase() ?? ""} severity={fileType === "xlsx" ? "success" : "info"} />
                  </div>
                  <div className="text-600 text-sm mt-1">
                    <strong>{totalRows.toLocaleString()}</strong> fila(s) detectada(s)
                    {needsMapping && <span className="text-yellow-700 ml-2">· Mapeo de columnas requerido</span>}
                  </div>
                  {isLargeFile && !needsMapping && (
                    <div className="text-orange-600 text-sm mt-1">
                      <i className="pi pi-clock mr-1" />
                      Archivo grande — la operación puede tardar varios minutos
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {needsMapping && (
                    <Button label="Mapear columnas" icon="pi pi-sliders-h" severity="warning" size="small" onClick={() => setShowMappingDialog(true)} />
                  )}
                  <Button label="Cambiar" icon="pi pi-refresh" severity="secondary" size="small" onClick={handleReset} />
                </div>
              </div>
            </div>
          )}

          {/* Extra options slot */}
          {file && !isUploading && extraOptions && (
            <div>{extraOptions}</div>
          )}

          {/* Action buttons */}
          {!isUploading && (
            <div className="flex gap-2 flex-wrap">
              <Button label="Descargar plantilla" icon="pi pi-download" onClick={handleDownloadTemplate} severity="info" outlined />
              {file && !needsMapping && (
                <Button label="Mapear columnas" icon="pi pi-sliders-h" severity="secondary" onClick={() => setShowMappingDialog(true)} />
              )}
              {file && (
                <>
                  <Button label={submitLabel} icon={submitIcon} onClick={handleSubmit} disabled={!canProcess} />
                  <Button label="Limpiar" icon="pi pi-trash" severity="secondary" onClick={handleReset} />
                </>
              )}
            </div>
          )}

          {/* Progress panel */}
          {isUploading && (
            <div className="p-4 border-round border-1 border-blue-300 bg-blue-50">
              <div className="flex align-items-center gap-3 mb-3">
                <i className="pi pi-spin pi-spinner text-blue-600 text-2xl" />
                <div className="flex-1">
                  {uploadStage === "converting" ? (
                    <div className="font-semibold text-blue-800">Preparando datos...</div>
                  ) : (
                    <>
                      <div className="font-semibold text-blue-800">
                        Procesando lote <strong>{currentChunk}</strong> de <strong>{totalChunks}</strong>
                        {totalChunks > 1 && (
                          <span className="text-blue-600 font-normal ml-2">
                            (~{Math.min(currentChunk * CHUNK_SIZE, totalRows).toLocaleString()} / {totalRows.toLocaleString()} filas)
                          </span>
                        )}
                      </div>
                      {elapsedSeconds > 0 && (
                        <div className="text-sm text-blue-500 mt-1">{formatElapsed(elapsedSeconds)} transcurrido(s)</div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <ProgressBar
                value={uploadStage === "converting" ? 5 : totalChunks > 0 ? Math.round((currentChunk / totalChunks) * 100) : 0}
                showValue={uploadStage === "processing"}
              />
              <div className="text-xs text-blue-500 mt-2">
                <i className="pi pi-info-circle mr-1" />
                No cierres esta pestaña mientras se procesa.
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ── Preview Table ──────────────────────────────────────────────── */}
      {previewRows.length > 0 && !isUploading && (
        <Card header={<h3 className="m-0 p-3">Vista previa (primeras 10 filas)</h3>}>
          <div className="overflow-x-auto">
            <DataTable value={previewRows} scrollable size="small">
              {fileHeaders.map((header) => (
                <Column
                  key={header}
                  field={header}
                  header={
                    <div>
                      <div>{header}</div>
                      {(() => {
                        const mapped = Object.entries(mapping).find(([, col]) => col === header);
                        if (!mapped) return null;
                        const fieldDef = fields.find((f) => f.key === mapped[0]);
                        return <div className="text-xs text-primary mt-1">→ {fieldDef?.label ?? mapped[0]}</div>;
                      })()}
                    </div>
                  }
                  style={{ width: "140px", minWidth: "100px" }}
                  body={(row) =>
                    previewCellBody ? (
                      previewCellBody(row, header)
                    ) : (
                      <span className="text-600 text-sm">
                        {String(row[header] ?? "").substring(0, 30)}
                        {String(row[header] ?? "").length > 30 ? "…" : ""}
                      </span>
                    )
                  }
                />
              ))}
            </DataTable>
          </div>
        </Card>
      )}

      {/* ── Column Mapping Dialog ──────────────────────────────────────── */}
      <Dialog
        visible={showMappingDialog}
        onHide={() => setShowMappingDialog(false)}
        header="Mapear columnas del archivo"
        modal
        style={{ width: "min(90vw, 720px)" }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" severity="secondary" onClick={() => setShowMappingDialog(false)} />
            <Button
              label="Confirmar mapeo"
              icon="pi pi-check"
              onClick={handleMappingConfirm}
              disabled={getMissingRequired(mapping, fields).length > 0}
            />
          </div>
        }
      >
        <div className="flex flex-column gap-3">
          <p className="m-0 text-600 text-sm">
            Asigna cada campo del sistema a la columna del archivo.
            Los campos con <Tag value="Requerido" severity="danger" className="text-xs" /> deben estar mapeados.
          </p>
          <div className="flex flex-column gap-3">
            {fields.map((field) => {
              const currentMapping = mapping[field.key];
              const isMapped = currentMapping && currentMapping !== SKIP_VALUE;
              const isAutoDetected = isMapped && fileHeaders.some((h) => h.toLowerCase() === field.key.toLowerCase());
              return (
                <div
                  key={field.key}
                  className={`p-3 border-round border-1 ${
                    field.required && !isMapped ? "border-red-300 bg-red-50" : isMapped ? "border-green-300 bg-green-50" : "border-200"
                  }`}
                >
                  <div className="flex align-items-center justify-content-between gap-3">
                    <div className="flex-1">
                      <div className="flex align-items-center gap-2">
                        <strong className="text-sm">{field.label}</strong>
                        {field.required ? (
                          <Tag value="Requerido" severity="danger" className="text-xs" />
                        ) : (
                          <Tag value="Opcional" severity="secondary" className="text-xs" />
                        )}
                        {isAutoDetected && <Tag value="Auto-detectado" severity="success" className="text-xs" />}
                      </div>
                      <div className="text-xs text-500 mt-1">{field.description}</div>
                    </div>
                    <div style={{ minWidth: "200px" }}>
                      <Dropdown
                        value={currentMapping ?? SKIP_VALUE}
                        options={fileColumnOptions}
                        onChange={(e) => setMapping((prev) => ({ ...prev, [field.key]: e.value }))}
                        optionLabel="label"
                        optionValue="value"
                        className="w-full"
                        placeholder="— Omitir campo —"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {getMissingRequired(mapping, fields).length > 0 && (
            <div className="p-3 bg-red-50 border-round border-1 border-red-300">
              <div className="flex align-items-center gap-2 text-red-700 text-sm">
                <i className="pi pi-exclamation-triangle" />
                <span>
                  Campos requeridos sin mapear:{" "}
                  {getMissingRequired(mapping, fields).map((k) => fields.find((f) => f.key === k)?.label ?? k).join(", ")}
                </span>
              </div>
            </div>
          )}
        </div>
      </Dialog>

      {/* ── Result Dialog ──────────────────────────────────────────────── */}
      <Dialog
        visible={showResult}
        onHide={() => setShowResult(false)}
        header="Resultado de la operación"
        modal
        style={{ width: "min(90vw, 800px)" }}
        maximizable
      >
        {result && (
          <div className="flex flex-column gap-4">
            <div className="grid">
              <div className="col-12 md:col-6">
                <Card className="bg-green-50 mb-0">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">{result.processed ?? 0}</div>
                    <div className="text-600 mt-2">Procesados</div>
                  </div>
                </Card>
              </div>
              <div className="col-12 md:col-6">
                <Card className="bg-red-50 mb-0">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-600">{result.failed ?? 0}</div>
                    <div className="text-600 mt-2">Errores</div>
                  </div>
                </Card>
              </div>
            </div>
            {result.errors?.length > 0 && (
              <div>
                <h5 className="m-0 mb-3">Errores ({result.errors.length})</h5>
                <DataTable value={result.errors} size="small" scrollable scrollHeight="300px">
                  <Column field="rowNumber" header="Fila" style={{ width: "70px" }} />
                  <Column field="sku" header="SKU" style={{ width: "120px" }} body={(r) => r.sku || "-"} />
                  <Column field="warehouseCode" header="Almacén" style={{ width: "100px" }} body={(r) => r.warehouseCode || "-"} />
                  <Column field="error" header="Error" />
                </DataTable>
              </div>
            )}
            <div className="flex justify-content-end">
              <Button label="Cerrar" onClick={() => setShowResult(false)} />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default StockBulkUploader;
