"use client";

import React, { useState, useRef } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { InputNumber } from "primereact/inputnumber";
import { Checkbox } from "primereact/checkbox";
import stockBulkService from "@/app/api/inventory/stockBulkService";

const FORMAT_OPTIONS = [
  { label: "CSV", value: "csv" },
  { label: "JSON", value: "json" },
  { label: "Excel (XLSX)", value: "xlsx" },
];

const COLUMN_OPTIONS = [
  { label: "SKU", value: "sku" },
  { label: "Nombre artículo", value: "itemName" },
  { label: "Categoría", value: "category" },
  { label: "Código almacén", value: "warehouseCode" },
  { label: "Nombre almacén", value: "warehouseName" },
  { label: "Cantidad real", value: "quantityReal" },
  { label: "Cantidad reservada", value: "quantityReserved" },
  { label: "Cantidad disponible", value: "quantityAvailable" },
  { label: "Costo promedio", value: "averageCost" },
  { label: "Ubicación", value: "location" },
  { label: "Último movimiento", value: "lastMovementAt" },
];

const DEFAULT_COLUMNS = COLUMN_OPTIONS.map((c) => c.value);

interface Props {
  warehouseOptions?: { label: string; value: string }[];
  onComplete?: () => void;
}

export const StockBulkExport = ({ warehouseOptions = [], onComplete }: Props) => {
  const toast = useRef<Toast>(null);
  const [format, setFormat] = useState<"csv" | "json" | "xlsx">("csv");
  const [columns, setColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [minQuantity, setMinQuantity] = useState<number | null>(null);
  const [maxQuantity, setMaxQuantity] = useState<number | null>(null);
  const [lowStock, setLowStock] = useState(false);
  const [outOfStock, setOutOfStock] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const blob = await stockBulkService.exportStock({
        format,
        columns,
        filters: {
          ...(warehouseId ? { warehouseId } : {}),
          ...(minQuantity !== null ? { minQuantity } : {}),
          ...(maxQuantity !== null ? { maxQuantity } : {}),
          ...(lowStock ? { lowStock } : {}),
          ...(outOfStock ? { outOfStock } : {}),
        },
      });

      const ext = format === "xlsx" ? "xlsx" : format === "json" ? "json" : "csv";
      stockBulkService.downloadBlob(blob, `stock_export_${Date.now()}.${ext}`);
      onComplete?.();
      toast.current?.show({ severity: "success", summary: "Exportación completada" });
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Error al exportar", detail: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-column gap-3">
      <Toast ref={toast} />

      <Card title="Exportar Niveles de Stock">
        <div className="grid">
          <div className="col-12 md:col-6">
            <label className="block mb-1 text-sm font-medium">Formato</label>
            <Dropdown
              value={format}
              options={FORMAT_OPTIONS}
              onChange={(e) => setFormat(e.value)}
              className="w-full"
            />
          </div>

          {warehouseOptions.length > 0 && (
            <div className="col-12 md:col-6">
              <label className="block mb-1 text-sm font-medium">Almacén (opcional)</label>
              <Dropdown
                value={warehouseId}
                options={[{ label: "Todos los almacenes", value: null }, ...warehouseOptions]}
                onChange={(e) => setWarehouseId(e.value)}
                className="w-full"
                placeholder="Todos los almacenes"
              />
            </div>
          )}

          <div className="col-12 md:col-6">
            <label className="block mb-1 text-sm font-medium">Cantidad mínima disponible</label>
            <InputNumber
              value={minQuantity}
              onValueChange={(e) => setMinQuantity(e.value ?? null)}
              placeholder="Sin límite"
              className="w-full"
              min={0}
            />
          </div>

          <div className="col-12 md:col-6">
            <label className="block mb-1 text-sm font-medium">Cantidad máxima disponible</label>
            <InputNumber
              value={maxQuantity}
              onValueChange={(e) => setMaxQuantity(e.value ?? null)}
              placeholder="Sin límite"
              className="w-full"
              min={0}
            />
          </div>

          <div className="col-12 flex gap-4 align-items-center">
            <div className="flex align-items-center gap-2">
              <Checkbox
                inputId="lowStock"
                checked={lowStock}
                onChange={(e) => { setLowStock(e.checked ?? false); if (e.checked) setOutOfStock(false); }}
              />
              <label htmlFor="lowStock" className="text-sm">Solo bajo stock (&lt; 10)</label>
            </div>
            <div className="flex align-items-center gap-2">
              <Checkbox
                inputId="outOfStock"
                checked={outOfStock}
                onChange={(e) => { setOutOfStock(e.checked ?? false); if (e.checked) setLowStock(false); }}
              />
              <label htmlFor="outOfStock" className="text-sm">Solo sin stock (= 0)</label>
            </div>
          </div>

          <div className="col-12">
            <label className="block mb-1 text-sm font-medium">Columnas a exportar</label>
            <MultiSelect
              value={columns}
              options={COLUMN_OPTIONS}
              onChange={(e) => setColumns(e.value)}
              display="chip"
              className="w-full"
              placeholder="Seleccionar columnas"
              showSelectAll
            />
          </div>
        </div>

        <div className="mt-4 flex justify-content-end">
          <Button
            label="Exportar Stock"
            icon="pi pi-file-export"
            loading={loading}
            onClick={handleExport}
          />
        </div>
      </Card>
    </div>
  );
};

export default StockBulkExport;
