"use client";

import React, { useState, useRef } from "react";
import {
  FileUpload,
  FileUploadSelectEvent,
  FileUploadUploaderEvent,
} from "primereact/fileupload";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressBar } from "primereact/progressbar";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { Card } from "primereact/card";
import * as bulkService from "@/app/api/inventory/bulkService";
import type {
  IBulkValidationError,
  IBulkOperation,
} from "@/app/api/inventory/bulkService";

// CSV column headers to match backend
const EXPECTED_HEADERS = [
  "sku",
  "name",
  "costPrice",
  "salePrice",
  "description",
  "categoryId",
  "unitId",
  "brandId",
  "wholesalePrice",
  "minStock",
  "barcode",
];

interface PreviewRow {
  [key: string]: any;
}

export const BulkImport = () => {
  const toast = useRef<Toast>(null);
  const fileUploadRef = useRef<any>(null);

  // State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>("");
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(
    {},
  );

  const [updateExisting, setUpdateExisting] = useState(false);
  const [validateOnly, setValidateOnly] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [operationResult, setOperationResult] = useState<IBulkOperation | null>(
    null,
  );
  const [showResult, setShowResult] = useState(false);

  // Parse CSV
  const parseCSV = (content: string) => {
    const lines = content.trim().split("\n");
    if (lines.length === 0) return { headers: [], rows: [] };

    const headerLine = lines[0];
    const parsedHeaders = headerLine.split(",").map((h) => h.trim());
    setHeaders(parsedHeaders);

    const rows: PreviewRow[] = [];
    for (let i = 1; i < Math.min(lines.length, 11); i++) {
      const values = lines[i].split(",");
      const row: PreviewRow = {};
      parsedHeaders.forEach((header, idx) => {
        row[header] = values[idx]?.trim() || "";
      });
      rows.push(row);
    }

    setPreviewRows(rows);
    return { headers: parsedHeaders, rows };
  };

  // Handle file select
  const handleFileSelect = async (e: FileUploadSelectEvent) => {
    const file = e.files[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.current?.show({
        severity: "warn",
        summary: "Invalid file",
        detail: "Please select a .csv file",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvFile(file);
      setCsvContent(content);
      parseCSV(content);

      toast.current?.show({
        severity: "success",
        summary: "File loaded",
        detail: `${file.name} (${previewRows.length} rows)`,
      });
    };
    reader.readAsText(file);
  };

  // Submit import
  const handleSubmitImport = async () => {
    if (!csvContent) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No file loaded",
      });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await bulkService.importItems({
        fileName: csvFile?.name || "import.csv",
        fileContent: csvContent,
        mapping:
          Object.keys(columnMapping).length > 0 ? columnMapping : undefined,
        options: {
          skipHeaderRow: true,
          updateExisting,
          validateOnly,
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      setOperationResult(result as IBulkOperation);
      setShowResult(true);

      toast.current?.show({
        severity: "success",
        summary: "Import complete",
        detail: `${result.successCount || 0} items imported, ${
          result.failureCount || 0
        } errors`,
      });
    } catch (error: any) {
      toast.current?.show({
        severity: "error",
        summary: "Import failed",
        detail: error.message || "Unknown error",
      });
    } finally {
      setUploading(false);
    }
  };

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      const blob = await bulkService.downloadTemplate();
      bulkService.downloadBlob(blob, "items-import-template.csv");
      toast.current?.show({
        severity: "success",
        summary: "Downloaded",
        detail: "CSV template downloaded",
      });
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to download template",
      });
    }
  };

  // Reset
  const handleReset = () => {
    setCsvFile(null);
    setCsvContent("");
    setPreviewRows([]);
    setHeaders([]);
    setColumnMapping({});
    setOperationResult(null);
    fileUploadRef.current?.clear();
  };

  return (
    <div className="flex flex-column gap-4">
      <Toast ref={toast} />

      {/* Upload Section */}
      <Card>
        <template slot="header">
          <h3 className="m-0">Subir archivo CSV</h3>
        </template>

        <div className="flex flex-column gap-4">
          <FileUpload
            ref={fileUploadRef}
            name="csvFile[]"
            accept=".csv"
            maxFileSize={10000000} // 10MB
            onSelect={handleFileSelect}
            auto={false}
            chooseLabel="Seleccionar archivo"
            cancelLabel="Limpiar"
            customUpload
            emptyTemplate={
              <p className="m-0">
                Arrastra un archivo CSV aquí o haz click para seleccionar
              </p>
            }
          />

          {csvFile && (
            <div className="bg-blue-50 p-4 border-round border-left-4 border-blue-500">
              <div className="flex align-items-center justify-content-between">
                <div>
                  <strong>{csvFile.name}</strong>
                  <div className="text-600 text-sm">
                    {previewRows.length} filas para importar
                  </div>
                </div>
                <Button
                  label="Cambiar archivo"
                  icon="pi pi-refresh"
                  severity="secondary"
                  size="small"
                  onClick={() => fileUploadRef.current?.clear()}
                />
              </div>
            </div>
          )}

          {previewRows.length > 0 && (
            <div className="flex gap-3">
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

          <div className="flex gap-2">
            <Button
              label="Descargar plantilla"
              icon="pi pi-download"
              onClick={handleDownloadTemplate}
              severity="info"
            />
            {previewRows.length > 0 && (
              <>
                <Button
                  label="Importar"
                  icon="pi pi-upload"
                  onClick={handleSubmitImport}
                  loading={uploading}
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

          {uploading && (
            <ProgressBar value={uploadProgress} showValue></ProgressBar>
          )}
        </div>
      </Card>

      {/* Preview Section */}
      {previewRows.length > 0 && !uploading && (
        <Card>
          <template slot="header">
            <h3 className="m-0">Vista previa (primeras 10 filas)</h3>
          </template>

          <div className="overflow-x-auto">
            <DataTable value={previewRows} scrollable size="small">
              {headers.map((header) => (
                <Column
                  key={header}
                  field={header}
                  header={header}
                  style={{ width: "120px", minWidth: "120px" }}
                  body={(rowData) => (
                    <span className="text-600 text-sm">
                      {String(rowData[header]).substring(0, 30)}
                      {String(rowData[header]).length > 30 ? "..." : ""}
                    </span>
                  )}
                />
              ))}
            </DataTable>
          </div>
        </Card>
      )}

      {/* Result Dialog */}
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
            {/* Summary Cards */}
            <div className="grid">
              <div className="col-12 md:col-3">
                <Card className="bg-green-50">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">
                      {operationResult.successCount || 0}
                    </div>
                    <div className="text-600 mt-2">Exitosos</div>
                  </div>
                </Card>
              </div>
              <div className="col-12 md:col-3">
                <Card className="bg-red-50">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-600">
                      {operationResult.failureCount || 0}
                    </div>
                    <div className="text-600 mt-2">Errores</div>
                  </div>
                </Card>
              </div>
              <div className="col-12 md:col-3">
                <Card className="bg-yellow-50">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-yellow-600">
                      {operationResult.skippedCount || 0}
                    </div>
                    <div className="text-600 mt-2">Omitidos</div>
                  </div>
                </Card>
              </div>
              <div className="col-12 md:col-3">
                <Card className="bg-blue-50">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600">
                      {operationResult.totalRecords || 0}
                    </div>
                    <div className="text-600 mt-2">Total</div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Error Details */}
            {operationResult.errorDetails &&
              operationResult.errorDetails.length > 0 && (
                <div>
                  <h4 className="mt-0">Detalles de errores</h4>
                  <DataTable
                    value={operationResult.errorDetails}
                    scrollable
                    size="small"
                  >
                    <Column
                      field="row"
                      header="Fila"
                      style={{ width: "60px" }}
                    />
                    <Column
                      field="field"
                      header="Campo"
                      style={{ width: "100px" }}
                    />
                    <Column field="message" header="Mensaje" flex={1} />
                    <Column
                      field="value"
                      header="Valor"
                      style={{ width: "150px" }}
                      body={(rowData: IBulkValidationError) => (
                        <code className="text-600 text-sm">
                          {String(rowData.value).substring(0, 30)}
                        </code>
                      )}
                    />
                  </DataTable>
                </div>
              )}

            <div className="flex justify-content-end gap-2">
              <Button label="Cerrar" onClick={() => setShowResult(false)} />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default BulkImport;
