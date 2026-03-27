"use client";

import React from "react";
import stockBulkService, { IStockBulkResult } from "@/app/api/inventory/stockBulkService";
import StockBulkUploader, { StockFieldDef } from "./StockBulkUploader";

const TRANSFER_FIELDS: StockFieldDef[] = [
  { key: "sku",                label: "SKU",               required: true,  description: "Código único del artículo" },
  { key: "fromWarehouseCode",  label: "Almacén origen",    required: true,  description: "Código del almacén origen (ej: WH01)" },
  { key: "toWarehouseCode",    label: "Almacén destino",   required: true,  description: "Código del almacén destino (ej: WH02)" },
  { key: "quantity",           label: "Cantidad",           required: true,  description: "Cantidad a transferir (número positivo)" },
  { key: "notes",              label: "Notas",              required: false, description: "Notas adicionales" },
];

interface Props {
  onComplete?: (result: IStockBulkResult) => void;
}

/** Render the origin → destination arrow in preview */
const previewCellBody = (row: any, fieldKey: string) => {
  const raw = String(row[fieldKey] ?? "");
  const display = raw.substring(0, 30) + (raw.length > 30 ? "…" : "");
  if (fieldKey === "fromWarehouseCode") {
    return <span className="text-orange-600 text-sm font-semibold">{display}</span>;
  }
  if (fieldKey === "toWarehouseCode") {
    return <span className="text-green-600 text-sm font-semibold">{display}</span>;
  }
  if (fieldKey === "quantity") {
    return <span className="text-blue-600 text-sm font-semibold">{display}</span>;
  }
  return <span className="text-600 text-sm">{display}</span>;
};

export const StockBulkTransfer = ({ onComplete }: Props) => {
  const handleProcess = (csvContent: string, fileName: string) =>
    stockBulkService.transferStockFromContent(csvContent, fileName);

  return (
    <StockBulkUploader
      title="Transferencias Masivas de Stock"
      description="Columnas: sku, fromWarehouseCode, toWarehouseCode, quantity, notes"
      fields={TRANSFER_FIELDS}
      onProcess={handleProcess}
      templateCSV={stockBulkService.getTemplateCSV("transfer")}
      templateFileName="plantilla-transferencia-stock.csv"
      submitLabel="Aplicar Transferencias"
      submitIcon="pi pi-arrow-right-arrow-left"
      onComplete={onComplete}
      previewCellBody={previewCellBody}
    />
  );
};

export default StockBulkTransfer;
