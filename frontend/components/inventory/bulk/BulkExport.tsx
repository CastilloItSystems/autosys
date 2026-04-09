"use client";

import React, { useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { MultiSelect, MultiSelectChangeEvent } from "primereact/multiselect";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import bulkService from "@/app/api/inventory/bulkService";
import type { IBulkExportRequest } from "@/app/api/inventory/bulkService";
import { useRef } from "react";

const EXPORT_FORMATS = [
  { label: "CSV", value: "csv" },
  { label: "JSON", value: "json" },
  { label: "Excel", value: "xlsx" },
];

const ALL_COLUMNS = [
  "sku",
  "code",
  "name",
  "description",
  "category",
  "brand",
  "model",
  "costPrice",
  "salePrice",
  "wholesalePrice",
  "minStock",
  "maxStock",
  "barcode",
  "identity",
  "location",
  "unit",
  "status",
  "createdAt",
  "updatedAt",
];

interface ExportStats {
  totalItems: number;
  categories: number;
  brands: number;
  dateRange: string;
}

interface BulkExportProps {
  onComplete?: () => void;
}

export const BulkExport = ({ onComplete }: BulkExportProps) => {
  const toast = useRef<Toast>(null);

  // State
  const [format, setFormat] = useState<"csv" | "json" | "xlsx">("csv");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "sku",
    "code",
    "name",
    "category",
    "brand",
    "model",
    "costPrice",
    "salePrice",
    "minStock",
    "barcode",
    "unit",
    "status",
  ]);

  const [isActive, setIsActive] = useState(true);
  const [inStock, setInStock] = useState(false);

  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  const [exporting, setExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [exportStats, setExportStats] = useState<ExportStats | null>(null);

  // Handle preview
  const handlePreview = async () => {
    if (selectedColumns.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Aviso",
        detail: "Selecciona al menos una columna",
      });
      return;
    }

    try {
      setExporting(true);

      const exportRequest: IBulkExportRequest = {
        format: "json",
        columns: selectedColumns,
        filters: {
          isActive: isActive ? true : undefined,
          inStock: inStock ? true : undefined,
          minPrice: minPrice !== null ? minPrice : undefined,
          maxPrice: maxPrice !== null ? maxPrice : undefined,
          categoryId: selectedCategory || undefined,
          brandId: selectedBrand || undefined,
        },
      };

      const blob = await bulkService.exportItems(exportRequest);
      const text = await blob.text();
      let data: any[];
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Respuesta inválida del servidor");
      }

      setPreviewData(data.slice(0, 20));
      setShowPreview(true);
    } catch (error: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al cargar la vista previa",
      });
    } finally {
      setExporting(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Aviso",
        detail: "Selecciona al menos una columna",
      });
      return;
    }

    try {
      setExporting(true);

      const exportRequest: IBulkExportRequest = {
        format: format,
        columns: selectedColumns,
        filters: {
          isActive: isActive ? true : undefined,
          inStock: inStock ? true : undefined,
          minPrice: minPrice !== null ? minPrice : undefined,
          maxPrice: maxPrice !== null ? maxPrice : undefined,
          categoryId: selectedCategory || undefined,
          brandId: selectedBrand || undefined,
        },
      };

      const blob = await bulkService.exportItems(exportRequest);

      // Determine filename extension
      const extension = format === "xlsx" ? "xlsx" : format;
      const filename = `items-export-${
        new Date().toISOString().split("T")[0]
      }.${extension}`;

      bulkService.downloadBlob(blob, filename);

      toast.current?.show({
        severity: "success",
        summary: "Exportado",
        detail: `Archivo ${filename} descargado`,
      });
      if (onComplete) setTimeout(onComplete, 1500);
    } catch (error: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al exportar",
      });
    } finally {
      setExporting(false);
    }
  };

  // Toggle column selection
  const toggleAllColumns = () => {
    if (selectedColumns.length === ALL_COLUMNS.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns([...ALL_COLUMNS]);
    }
  };

  const columnOptions = ALL_COLUMNS.map((col) => ({
    label: col.charAt(0).toUpperCase() + col.slice(1),
    value: col,
  }));

  return (
    <div className="flex flex-column gap-4">
      <Toast ref={toast} />

      {/* Export Options */}
      <Card title="Exportar artículos">
        <div className="grid gap-4">
          {/* Format Selection */}
          <div className="col-12 md:col-6 lg:col-3">
            <label className="block mb-2 font-semibold">
              Formato de exportación
            </label>
            <Dropdown
              value={format}
              onChange={(e: DropdownChangeEvent) => setFormat(e.value)}
              options={EXPORT_FORMATS}
              optionLabel="label"
              optionValue="value"
              className="w-full"
            />
          </div>

          {/* Column Selection */}
          <div className="col-12">
            <label className="block mb-2 font-semibold">
              Columnas ({selectedColumns.length}/{ALL_COLUMNS.length})
            </label>
            <MultiSelect
              value={selectedColumns}
              onChange={(e: MultiSelectChangeEvent) =>
                setSelectedColumns(e.value)
              }
              options={columnOptions}
              optionLabel="label"
              optionValue="value"
              placeholder="Selecciona columnas"
              className="w-full"
              maxSelectedLabels={3}
              emptyMessage="No hay columnas disponibles"
              selectAll
            />
            <Button
              label={
                selectedColumns.length === ALL_COLUMNS.length
                  ? "Deseleccionar todo"
                  : "Seleccionar todo"
              }
              size="small"
              severity="secondary"
              className="mt-2"
              onClick={toggleAllColumns}
            />
          </div>

          {/* Filters */}
          <div className="col-12 md:col-6">
            <div className="flex align-items-center gap-2">
              <InputSwitch
                inputId="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.value || false)}
              />
              <label htmlFor="isActive">Solo artículos activos</label>
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="flex align-items-center gap-2">
              <InputSwitch
                inputId="inStock"
                checked={inStock}
                onChange={(e) => setInStock(e.value || false)}
              />
              <label htmlFor="inStock">
                Solo con existencias (Stock &gt; 0)
              </label>
            </div>
          </div>

          {/* Price Range */}
          <div className="col-12 md:col-6">
            <label className="block mb-2 text-sm">Precio mínimo</label>
            <input
              type="number"
              value={minPrice || ""}
              onChange={(e) =>
                setMinPrice(e.target.value ? parseFloat(e.target.value) : null)
              }
              placeholder="Cualquier precio"
              className="w-full p-2 border border-300 border-round"
            />
          </div>

          <div className="col-12 md:col-6">
            <label className="block mb-2 text-sm">Precio máximo</label>
            <input
              type="number"
              value={maxPrice || ""}
              onChange={(e) =>
                setMaxPrice(e.target.value ? parseFloat(e.target.value) : null)
              }
              placeholder="Cualquier precio"
              className="w-full p-2 border border-300 border-round"
            />
          </div>

          {/* Action Buttons */}
          <div className="col-12">
            <div className="flex gap-2">
              <Button
                label="Exportar"
                icon="pi pi-download"
                onClick={handleExport}
                loading={exporting}
                disabled={selectedColumns.length === 0}
              />
              <Button
                label="Vista previa"
                icon="pi pi-eye"
                severity="info"
                onClick={handlePreview}
                loading={exporting}
                disabled={selectedColumns.length === 0}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Format Info */}
      <Card className="bg-blue-50 border-left-4 border-blue-500">
        <div>
          <strong>Ayuda:</strong>
          <ul className="mt-2 ml-3">
            <li>
              <strong>CSV</strong> - Compatible con Excel, importable nuevamente
            </li>
            <li>
              <strong>JSON</strong> - Formato estructurado para procesamiento
            </li>
            <li>
              <strong>Excel</strong> - Archivo .xlsx con formato y estilos
            </li>
          </ul>
        </div>
      </Card>

      {/* Preview Dialog */}
      <Dialog
        visible={showPreview}
        onHide={() => setShowPreview(false)}
        header="Vista previa de exportación"
        modal
        style={{ width: "90vw" }}
        maximizable
      >
        <div className="text-sm text-600 mb-3">
          Mostrando primeras 20 filas con columnas seleccionadas
        </div>
        <DataTable value={previewData} scrollable size="small">
          {selectedColumns.map((col) => (
            <Column
              key={col}
              field={col}
              header={col}
              style={{ width: "120px", minWidth: "120px" }}
            />
          ))}
        </DataTable>
      </Dialog>
    </div>
  );
};

export default BulkExport;
