"use client";

import React from "react";
import stockBulkService, { IStockBulkResult } from "@/app/api/inventory/stockBulkService";
import StockBulkUploader, { StockFieldDef } from "./StockBulkUploader";

const ADJUST_FIELDS: StockFieldDef[] = [
  { key: "sku",           label: "SKU",            required: true,  description: "Código único del artículo" },
  { key: "warehouseCode", label: "Código almacén", required: true,  description: "Código del almacén (ej: WH01)" },
  { key: "quantity",      label: "Cantidad",        required: true,  description: "Positivo = entrada, negativo = salida" },
  { key: "movementType",  label: "Tipo movimiento", required: false, description: "ADJUSTMENT_IN, ADJUSTMENT_OUT, PURCHASE, SUPPLIER_RETURN… (auto si omite)" },
  { key: "reference",     label: "Referencia",      required: false, description: "Referencia externa (ej: CONT-2026-01)" },
  { key: "notes",         label: "Notas",           required: false, description: "Notas adicionales" },
];

interface Props {
  onComplete?: (result: IStockBulkResult) => void;
}

/** Color-code the quantity cell: green for positive, red for negative */
const previewCellBody = (row: any, fieldKey: string) => {
  const raw = String(row[fieldKey] ?? "");
  const display = raw.substring(0, 30) + (raw.length > 30 ? "…" : "");
  if (fieldKey === "quantity") {
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      return (
        <span className={`text-sm font-semibold ${num >= 0 ? "text-green-600" : "text-red-600"}`}>
          {num >= 0 ? "+" : ""}{display}
        </span>
      );
    }
  }
  return <span className="text-600 text-sm">{display}</span>;
};

export const StockBulkAdjust = ({ onComplete }: Props) => {
  const handleProcess = (csvContent: string, fileName: string) =>
    stockBulkService.adjustStockFromContent(csvContent, fileName);

  return (
    <StockBulkUploader
      title="Ajustes Masivos de Stock"
      description="Cantidad positiva = entrada · Cantidad negativa = salida. Columnas: sku, warehouseCode, quantity, movementType, reference, notes"
      fields={ADJUST_FIELDS}
      onProcess={handleProcess}
      templateCSV={stockBulkService.getTemplateCSV("adjust")}
      templateFileName="plantilla-ajuste-stock.csv"
      submitLabel="Aplicar Ajustes"
      submitIcon="pi pi-sync"
      onComplete={onComplete}
      previewCellBody={previewCellBody}
    />
  );
};

export default StockBulkAdjust;
