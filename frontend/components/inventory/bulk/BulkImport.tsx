"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileUpload,
  FileUploadSelectEvent,
} from "primereact/fileupload";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressBar } from "primereact/progressbar";
import { Toast } from "primereact/toast";
import { Checkbox } from "primereact/checkbox";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import * as XLSX from "xlsx";
import bulkService from "@/app/api/inventory/bulkService";
import type {
  IBulkValidationError,
} from "@/app/api/inventory/bulkService";

// ============================================================================
// CONSTANTS
// ============================================================================

interface FieldDef {
  key: string;
  label: string;
  required: boolean;
  description: string;
}

const SYSTEM_FIELDS: FieldDef[] = [
  { key: "sku",            label: "SKU",              required: false, description: "Código único del artículo (se genera si está vacío)" },
  { key: "name",           label: "Nombre",            required: true,  description: "Nombre del artículo" },
  { key: "category",       label: "Categoría",         required: true,  description: "Nombre de la categoría" },
  { key: "brand",          label: "Marca",             required: true,  description: "Nombre de la marca" },
  { key: "unit",           label: "Unidad",            required: true,  description: "Unidad de medida (ej: pieza, litro)" },
  { key: "costPrice",      label: "Precio de costo",   required: true,  description: "Precio de costo (número)" },
  { key: "salePrice",      label: "Precio de venta",   required: true,  description: "Precio de venta (número)" },
  { key: "wholesalePrice", label: "Precio mayoreo",    required: false, description: "Precio de mayoreo (número)" },
  { key: "minStock",       label: "Stock mínimo",      required: false, description: "Cantidad mínima en stock" },
  { key: "barcode",        label: "Código de barras",  required: false, description: "EAN/UPC/QR" },
  { key: "identity",       label: "Identidad",         required: false, description: "Identidad del artículo" },
  { key: "location",       label: "Ubicación",         required: false, description: "M1-R01-D03" },
  { key: "description",    label: "Descripción",       required: false, description: "Descripción del artículo" },
  { key: "model",          label: "Modelo",            required: false, description: "Número o nombre de modelo" },
  { key: "isActive",       label: "Activo",            required: false, description: "true/false" },
];

const REQUIRED_FIELD_KEYS = SYSTEM_FIELDS.filter((f) => f.required).map((f) => f.key);
const SKIP_VALUE = "__skip__";

// ============================================================================
// TYPES
// ============================================================================

interface PreviewRow {
  [key: string]: string;
}

// mapping: { systemField -> fileColumn }  (user-selected)
type FieldMapping = Record<string, string>;

// ============================================================================
// HELPERS
// ============================================================================

type UploadStage = "idle" | "converting" | "processing";

const LARGE_FILE_THRESHOLD = 500; // rows
const CHUNK_SIZE = 500;            // rows per import request

/** Format seconds as mm:ss */
function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/**
 * Split a CSV string into logical row strings, correctly handling RFC 4180
 * quoted fields that may contain embedded newlines (e.g. Excel Alt+Enter
 * line breaks inside a description cell).  A naive split("\n") would break
 * those rows in half — this parser tracks the in-quotes state so embedded
 * newlines are never treated as row boundaries.
 */
function csvToLogicalLines(csv: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (ch === '"') {
      if (inQuotes && csv[i + 1] === '"') { // escaped "" inside a quoted field
        current += '""';
        i++;
      } else {
        inQuotes = !inQuotes;
        current += ch;
      }
    } else if ((ch === "\n" || (ch === "\r" && csv[i + 1] === "\n")) && !inQuotes) {
      if (ch === "\r") i++; // consume the \n of the \r\n pair
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

/**
 * Split a mapped CSV (header + N data rows) into chunks of `size` rows.
 * Each chunk includes the header line so the backend parses it independently.
 */
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

/** Parse a CSV string into headers + rows (handles RFC 4180 quoting) */
function parseCSVString(content: string): { headers: string[]; rows: PreviewRow[]; totalRows: number } {
  const parseField = (line: string, start: number): { value: string; end: number } => {
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
  };

  const parseLine = (line: string): string[] => {
    const fields: string[] = [];
    let pos = 0;
    while (pos <= line.length) {
      const { value, end } = parseField(line, pos);
      fields.push(value);
      if (end >= line.length) break;
      pos = end;
    }
    return fields;
  };

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

/** Parse an Excel file buffer and return headers + preview rows */
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

/** Convert Excel buffer → CSV string (applying column mapping) */
function excelBufferToCSV(buffer: ArrayBuffer, mapping: FieldMapping): string {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return "";

  const allRows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  if (allRows.length < 2) return "";

  const fileHeaders = (allRows[0] as string[]).map((h) => String(h).trim());

  // Build reverse map: fileColumn → systemField
  const colToField: Record<string, string> = {};
  for (const [field, col] of Object.entries(mapping)) {
    if (col && col !== SKIP_VALUE) colToField[col] = field;
  }

  // Also keep unmapped file columns as-is
  const outputHeaders: string[] = fileHeaders.map((col) => colToField[col] ?? col);

  const escapeCsvField = (v: string): string => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const csvLines: string[] = [outputHeaders.map(escapeCsvField).join(",")];
  for (let i = 1; i < allRows.length; i++) {
    const row = allRows[i] as string[];
    if (row.every((c) => !String(c).trim())) continue; // skip blank rows
    csvLines.push(fileHeaders.map((_, idx) => escapeCsvField(String(row[idx] ?? ""))).join(","));
  }
  return csvLines.join("\n");
}

/** Build a CSV string from the original CSV content applying the mapping (renaming headers) */
function applyMappingToCSV(original: string, mapping: FieldMapping): string {
  const lines = original.trim().split(/\r?\n/);
  if (lines.length < 1) return original;

  // Simple header rename — split first line on comma (headers shouldn't have commas)
  const fileHeaders = lines[0].split(",").map((h) => h.trim());

  // Build reverse: fileColumn → systemField
  const colToField: Record<string, string> = {};
  for (const [field, col] of Object.entries(mapping)) {
    if (col && col !== SKIP_VALUE) colToField[col] = field;
  }

  const newHeaders = fileHeaders.map((col) => colToField[col] ?? col);
  return [newHeaders.join(","), ...lines.slice(1)].join("\n");
}

/** Detect which system fields are already matched by the file headers (case-insensitive) */
function detectAutoMapping(fileHeaders: string[]): FieldMapping {
  const mapping: FieldMapping = {};
  const normalizedHeaders = fileHeaders.map((h) => h.toLowerCase().trim());

  for (const field of SYSTEM_FIELDS) {
    const idx = normalizedHeaders.indexOf(field.key.toLowerCase());
    if (idx !== -1) {
      mapping[field.key] = fileHeaders[idx];
    }
  }
  return mapping;
}

/** Check if all required fields are mapped */
function getMissingRequired(mapping: FieldMapping): string[] {
  return REQUIRED_FIELD_KEYS.filter(
    (key) => !mapping[key] || mapping[key] === SKIP_VALUE
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

interface BulkImportProps {
  onComplete?: () => void;
  onGoToHistory?: () => void;
}

export const BulkImport = ({ onComplete, onGoToHistory }: BulkImportProps) => {
  const toast = useRef<Toast>(null);
  const fileUploadRef = useRef<any>(null);

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"csv" | "xlsx" | null>(null);
  const [csvContent, setCsvContent] = useState<string>("");          // raw CSV
  const [xlsxBuffer, setXlsxBuffer] = useState<ArrayBuffer | null>(null); // raw Excel

  // Parsed preview
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);

  // Column mapping
  const [mapping, setMapping] = useState<FieldMapping>({});         // systemField → fileColumn
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [needsMapping, setNeedsMapping] = useState(false);

  // Options
  const [updateExisting, setUpdateExisting] = useState(false);
  const [validateOnly, setValidateOnly] = useState(false);

  // Total rows (actual count, not just preview)
  const [totalRows, setTotalRows] = useState(0);

  // Upload state
  const [uploadStage, setUploadStage] = useState<UploadStage>("idle");
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Result
  const [operationResult, setOperationResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  // Elapsed timer — starts when processing begins
  useEffect(() => {
    if (uploadStage === "processing") {
      setElapsedSeconds(0);
      elapsedRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (elapsedRef.current) {
        clearInterval(elapsedRef.current);
        elapsedRef.current = null;
      }
    }
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [uploadStage]);

  // ---- File handling -------------------------------------------------------

  const handleFileSelect = async (e: FileUploadSelectEvent) => {
    const selected = e.files[0];
    if (!selected) return;

    const isXlsx = selected.name.endsWith(".xlsx") || selected.name.endsWith(".xls");
    const isCsv = selected.name.endsWith(".csv");

    if (!isXlsx && !isCsv) {
      toast.current?.show({
        severity: "warn",
        summary: "Archivo no válido",
        detail: "Por favor selecciona un archivo .csv o .xlsx",
      });
      return;
    }

    setFile(selected);
    setFileType(isXlsx ? "xlsx" : "csv");
    setCsvContent("");
    setXlsxBuffer(null);
    setMapping({});
    setNeedsMapping(false);

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
    const autoMap = detectAutoMapping(headers);
    setMapping(autoMap);

    const missing = getMissingRequired(autoMap);
    const hasMismatch = missing.length > 0;

    setNeedsMapping(hasMismatch);

    if (hasMismatch) {
      setShowMappingDialog(true);
      toast.current?.show({
        severity: "info",
        summary: "Mapeo de columnas requerido",
        detail: `${missing.length} campo(s) requerido(s) no encontrado(s) en el archivo`,
        life: 5000,
      });
    } else {
      toast.current?.show({
        severity: "success",
        summary: "Archivo cargado",
        detail: `${fileName} — ${rowCount} fila(s) detectada(s)`,
      });
    }
  };

  // ---- Mapping dialog helpers ----------------------------------------------

  const fileColumnOptions = [
    { label: "— Omitir campo —", value: SKIP_VALUE },
    ...fileHeaders.map((h) => ({ label: h, value: h })),
  ];

  const handleMappingChange = (systemField: string, fileColumn: string) => {
    setMapping((prev) => ({ ...prev, [systemField]: fileColumn }));
  };

  const handleMappingConfirm = () => {
    const missing = getMissingRequired(mapping);
    if (missing.length > 0) {
      const labels = missing.map(
        (k) => SYSTEM_FIELDS.find((f) => f.key === k)?.label ?? k
      );
      toast.current?.show({
        severity: "warn",
        summary: "Campos requeridos sin mapear",
        detail: `Por favor asigna: ${labels.join(", ")}`,
        life: 6000,
      });
      return;
    }
    setNeedsMapping(false);
    setShowMappingDialog(false);
    toast.current?.show({
      severity: "success",
      summary: "Mapeo confirmado",
      detail: "Puedes proceder con la importación",
    });
  };

  // ---- Import --------------------------------------------------------------

  const buildFinalCSV = (): string => {
    if (fileType === "xlsx" && xlsxBuffer) {
      return excelBufferToCSV(xlsxBuffer, mapping);
    }
    return applyMappingToCSV(csvContent, mapping);
  };

  const handleSubmitImport = async () => {
    if (!file) {
      toast.current?.show({ severity: "error", summary: "Error", detail: "No hay archivo cargado" });
      return;
    }
    if (needsMapping) {
      setShowMappingDialog(true);
      return;
    }

    try {
      // Stage 1: convert + split into chunks
      setUploadStage("converting");
      const finalCSV = buildFinalCSV();
      const chunks = splitCSVIntoChunks(finalCSV, CHUNK_SIZE);
      const finalFileName = fileType === "xlsx"
        ? file.name.replace(/\.xlsx?$/, ".csv")
        : file.name;

      setTotalChunks(chunks.length);
      setCurrentChunk(0);

      // Stage 2: send each chunk sequentially
      setUploadStage("processing");

      let totalImported = 0;
      let totalUpdated  = 0;
      let totalFailed   = 0;
      const allErrors: any[] = [];

      for (let i = 0; i < chunks.length; i++) {
        setCurrentChunk(i + 1);

        const result = await bulkService.importItems({
          fileName: finalFileName,
          fileContent: chunks[i],
          options: { skipHeaderRow: true, updateExisting, validateOnly },
        });

        totalImported += result.imported || 0;
        totalUpdated  += result.updated  || 0;
        totalFailed   += result.failed   || 0;
        if (result.errors?.length) allErrors.push(...result.errors);
      }

      setUploadStage("idle");
      setOperationResult({ imported: totalImported, updated: totalUpdated, failed: totalFailed, errors: allErrors });
      setShowResult(true);

      const processed = totalImported + totalUpdated;
      toast.current?.show({
        severity: totalFailed > 0 ? "warn" : "success",
        summary: "Importación completada",
        detail: `${processed.toLocaleString()} procesados, ${totalFailed.toLocaleString()} error(es)`,
        life: 8000,
      });

      if (onComplete) onComplete();
    } catch (error: any) {
      setUploadStage("idle");
      toast.current?.show({
        severity: "error",
        summary: "Error al importar",
        detail: error.message || "Error desconocido",
        life: 8000,
      });
    }
  };

  // ---- Template download ---------------------------------------------------

  const handleDownloadTemplate = async () => {
    try {
      const blob = await bulkService.downloadTemplate();
      bulkService.downloadBlob(blob, "items-import-template.csv");
      toast.current?.show({ severity: "success", summary: "Descargado", detail: "Plantilla CSV descargada" });
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "No se pudo descargar la plantilla" });
    }
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
    setOperationResult(null);
    setUploadStage("idle");
    setCurrentChunk(0);
    setTotalChunks(0);
    setElapsedSeconds(0);
    fileUploadRef.current?.clear();
  };

  // ---- Render --------------------------------------------------------------

  const isUploading = uploadStage !== "idle";
  const missingRequired = getMissingRequired(mapping);
  const canImport = file !== null && !needsMapping && missingRequired.length === 0;
  const isLargeFile = totalRows >= LARGE_FILE_THRESHOLD;

  return (
    <div className="flex flex-column gap-4">
      <Toast ref={toast} />

      {/* ── Upload Section ─────────────────────────────────────────────── */}
      <Card header={<h3 className="m-0 p-3">Subir archivo CSV o Excel</h3>}>
        <div className="flex flex-column gap-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <FileUpload
            ref={fileUploadRef}
            name="importFile[]"
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
            <div
              className={`p-4 border-round border-left-4 ${
                needsMapping
                  ? "bg-yellow-50 border-yellow-500"
                  : "bg-blue-50 border-blue-500"
              }`}
            >
              <div className="flex align-items-center justify-content-between">
                <div>
                  <div className="flex align-items-center gap-2">
                    <i
                      className={`pi ${
                        fileType === "xlsx"
                          ? "pi-file-excel text-green-600"
                          : "pi-file text-blue-600"
                      } text-xl`}
                    />
                    <strong>{file.name}</strong>
                    <Tag
                      value={fileType?.toUpperCase() ?? ""}
                      severity={fileType === "xlsx" ? "success" : "info"}
                    />
                  </div>
                  <div className="text-600 text-sm mt-1">
                    <strong>{totalRows.toLocaleString()}</strong> artículo(s) detectado(s)
                    {needsMapping && (
                      <span className="text-yellow-700 ml-2">
                        · Mapeo de columnas requerido
                      </span>
                    )}
                  </div>
                  {isLargeFile && !needsMapping && (
                    <div className="text-orange-600 text-sm mt-1">
                      <i className="pi pi-clock mr-1" />
                      Archivo grande — la importación puede tardar varios minutos
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {needsMapping && (
                    <Button
                      label="Mapear columnas"
                      icon="pi pi-sliders-h"
                      severity="warning"
                      size="small"
                      onClick={() => setShowMappingDialog(true)}
                    />
                  )}
                  <Button
                    label="Cambiar"
                    icon="pi pi-refresh"
                    severity="secondary"
                    size="small"
                    onClick={handleReset}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Options */}
          {file && !isUploading && (
            <div className="flex gap-4 flex-wrap">
              <div className="flex align-items-center gap-2">
                <Checkbox
                  inputId="updateExisting"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.checked || false)}
                />
                <label htmlFor="updateExisting">Actualizar existentes</label>
              </div>
              <div className="flex align-items-center gap-2">
                <Checkbox
                  inputId="validateOnly"
                  checked={validateOnly}
                  onChange={(e) => setValidateOnly(e.checked || false)}
                />
                <label htmlFor="validateOnly">Solo validar (no importar)</label>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!isUploading && (
            <div className="flex gap-2 flex-wrap">
              <Button
                label="Descargar plantilla"
                icon="pi pi-download"
                onClick={handleDownloadTemplate}
                severity="info"
                outlined
              />
              {file && !needsMapping && (
                <Button
                  label="Mapear columnas"
                  icon="pi pi-sliders-h"
                  severity="secondary"
                  onClick={() => setShowMappingDialog(true)}
                />
              )}
              {file && (
                <>
                  <Button
                    label={validateOnly ? "Validar" : "Importar"}
                    icon="pi pi-upload"
                    onClick={handleSubmitImport}
                    disabled={!canImport}
                  />
                  <Button
                    label="Limpiar"
                    icon="pi pi-trash"
                    severity="secondary"
                    onClick={handleReset}
                  />
                </>
              )}
            </div>
          )}

          {/* ── Upload progress panel ────────────────────────────────── */}
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
                        Procesando lote{" "}
                        <strong>{currentChunk}</strong> de{" "}
                        <strong>{totalChunks}</strong>
                        {totalChunks > 1 && (
                          <span className="text-blue-600 font-normal ml-2">
                            (~{Math.min(currentChunk * CHUNK_SIZE, totalRows).toLocaleString()} / {totalRows.toLocaleString()} artículos)
                          </span>
                        )}
                      </div>
                      {elapsedSeconds > 0 && (
                        <div className="text-sm text-blue-500 mt-1">
                          {formatElapsed(elapsedSeconds)} transcurrido(s)
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <ProgressBar
                value={
                  uploadStage === "converting"
                    ? 5
                    : totalChunks > 0
                    ? Math.round((currentChunk / totalChunks) * 100)
                    : 0
                }
                showValue={uploadStage === "processing"}
              />
              <div className="text-xs text-blue-500 mt-2">
                <i className="pi pi-info-circle mr-1" />
                No cierres esta pestaña mientras se importa.
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ── Preview Table ──────────────────────────────────────────────── */}
      {previewRows.length > 0 && !isUploading && (
        <Card header={<h3 className="m-0 p-3">Vista previa del archivo (primeras 10 filas)</h3>}>
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
                        const fieldDef = SYSTEM_FIELDS.find((f) => f.key === mapped[0]);
                        return (
                          <div className="text-xs text-primary mt-1">
                            → {fieldDef?.label ?? mapped[0]}
                          </div>
                        );
                      })()}
                    </div>
                  }
                  style={{ width: "140px", minWidth: "120px" }}
                  body={(row) => (
                    <span className="text-600 text-sm">
                      {String(row[header]).substring(0, 30)}
                      {String(row[header]).length > 30 ? "…" : ""}
                    </span>
                  )}
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
            <Button
              label="Cancelar"
              severity="secondary"
              onClick={() => setShowMappingDialog(false)}
            />
            <Button
              label="Confirmar mapeo"
              icon="pi pi-check"
              onClick={handleMappingConfirm}
              disabled={getMissingRequired(mapping).length > 0}
            />
          </div>
        }
      >
        <div className="flex flex-column gap-3">
          <p className="m-0 text-600 text-sm">
            Asigna cada campo del sistema a la columna correspondiente de tu archivo.
            Los campos con <Tag value="Requerido" severity="danger" className="text-xs" /> deben estar mapeados.
          </p>

          <div className="flex flex-column gap-3">
            {SYSTEM_FIELDS.map((field) => {
              const currentMapping = mapping[field.key];
              const isMapped = currentMapping && currentMapping !== SKIP_VALUE;
              const isAutoDetected =
                isMapped &&
                fileHeaders.some(
                  (h) => h.toLowerCase() === field.key.toLowerCase()
                );

              return (
                <div
                  key={field.key}
                  className={`p-3 border-round border-1 ${
                    field.required && !isMapped
                      ? "border-red-300 bg-red-50"
                      : isMapped
                      ? "border-green-300 bg-green-50"
                      : "border-200"
                  }`}
                >
                  <div className="flex align-items-center justify-content-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex align-items-center gap-2">
                        <strong className="text-sm">{field.label}</strong>
                        {field.required ? (
                          <Tag value="Requerido" severity="danger" className="text-xs" />
                        ) : (
                          <Tag value="Opcional" severity="secondary" className="text-xs" />
                        )}
                        {isAutoDetected && (
                          <Tag value="Auto-detectado" severity="success" className="text-xs" />
                        )}
                      </div>
                      <div className="text-xs text-500 mt-1">{field.description}</div>
                    </div>
                    <div style={{ minWidth: "200px" }}>
                      <Dropdown
                        value={currentMapping ?? SKIP_VALUE}
                        options={fileColumnOptions}
                        onChange={(e) => handleMappingChange(field.key, e.value)}
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

          {getMissingRequired(mapping).length > 0 && (
            <div className="p-3 bg-red-50 border-round border-1 border-red-300">
              <div className="flex align-items-center gap-2 text-red-700 text-sm">
                <i className="pi pi-exclamation-triangle" />
                <span>
                  Campos requeridos sin mapear:{" "}
                  {getMissingRequired(mapping)
                    .map((k) => SYSTEM_FIELDS.find((f) => f.key === k)?.label ?? k)
                    .join(", ")}
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
        header="Resultado de importación"
        modal
        style={{ width: "90vw" }}
        maximizable
      >
        {operationResult && (
          <div className="flex flex-column gap-4">
            <div className="grid">
              <div className="col-12 md:col-4">
                <Card className="bg-green-50">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">
                      {(operationResult.imported || 0) + (operationResult.updated || 0)}
                    </div>
                    <div className="text-600 mt-2">Procesados</div>
                  </div>
                </Card>
              </div>
              <div className="col-12 md:col-4">
                <Card className="bg-red-50">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-600">
                      {operationResult.failed || 0}
                    </div>
                    <div className="text-600 mt-2">Errores</div>
                  </div>
                </Card>
              </div>
              <div className="col-12 md:col-4">
                <Card className="bg-blue-50">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600">
                      {(operationResult.imported || 0) +
                        (operationResult.updated || 0) +
                        (operationResult.failed || 0)}
                    </div>
                    <div className="text-600 mt-2">Total</div>
                  </div>
                </Card>
              </div>
            </div>

            {(() => {
              let errors: IBulkValidationError[] = [];
              const raw = (operationResult as any).errors || operationResult.errorDetails;
              if (typeof raw === "string") {
                try { errors = JSON.parse(raw); } catch { /* noop */ }
              } else if (Array.isArray(raw)) {
                errors = raw;
              }

              if (errors.length === 0) return null;

              return (
                <div>
                  <h4 className="mt-0">Detalles de errores</h4>
                  <DataTable value={errors} scrollable size="small">
                    <Column field="rowNumber" header="Fila" style={{ width: "60px" }} />
                    <Column field="field" header="Campo" style={{ width: "120px" }} />
                    <Column field="error" header="Mensaje" style={{ minWidth: "200px" }} />
                    <Column
                      field="value"
                      header="Valor"
                      style={{ width: "150px" }}
                      body={(row: IBulkValidationError) => (
                        <code className="text-600 text-sm">
                          {String(row.value).substring(0, 30)}
                        </code>
                      )}
                    />
                  </DataTable>
                </div>
              );
            })()}

            <div className="flex justify-content-between align-items-center flex-wrap gap-2">
              {onGoToHistory && (
                <Button
                  label="Ver en historial"
                  icon="pi pi-history"
                  severity="info"
                  outlined
                  onClick={() => { setShowResult(false); onGoToHistory(); }}
                />
              )}
              <div className="flex gap-2 ml-auto">
                <Button label="Cerrar" severity="secondary" outlined onClick={() => setShowResult(false)} />
                {!validateOnly && (
                  <Button
                    label="Nueva importación"
                    icon="pi pi-refresh"
                    onClick={() => { setShowResult(false); handleReset(); }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default BulkImport;
