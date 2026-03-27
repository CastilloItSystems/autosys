"use client";

import React, { useState } from "react";
import { Checkbox } from "primereact/checkbox";
import stockBulkService, { IStockBulkResult } from "@/app/api/inventory/stockBulkService";
import StockBulkUploader, { StockFieldDef } from "./StockBulkUploader";

const IMPORT_FIELDS: StockFieldDef[] = [
  { key: "sku",           label: "SKU",           required: true,  description: "Código único del artículo" },
  { key: "warehouseCode", label: "Código almacén", required: true,  description: "Código del almacén (ej: WH01)" },
  { key: "quantity",      label: "Cantidad",       required: true,  description: "Cantidad a cargar (número positivo)" },
  { key: "unitCost",      label: "Costo unitario", required: false, description: "Costo unitario para costo promedio" },
  { key: "location",      label: "Ubicación",      required: false, description: "Ubicación en almacén (ej: A1-R01-D01)" },
  { key: "notes",         label: "Notas",          required: false, description: "Notas adicionales" },
];

interface Props {
  onComplete?: (result: IStockBulkResult) => void;
}

export const StockBulkImport = ({ onComplete }: Props) => {
  const [updateExisting, setUpdateExisting] = useState(false);

  const handleProcess = (csvContent: string, fileName: string) =>
    stockBulkService.importStockFromContent(csvContent, fileName, { updateExisting });

  return (
    <StockBulkUploader
      title="Carga Masiva de Stock"
      description="Columnas CSV: sku, warehouseCode, quantity, unitCost, location, notes"
      fields={IMPORT_FIELDS}
      onProcess={handleProcess}
      templateCSV={stockBulkService.getTemplateCSV("import")}
      templateFileName="plantilla-carga-stock.csv"
      submitLabel="Cargar Stock"
      submitIcon="pi pi-upload"
      onComplete={onComplete}
      extraOptions={
        <div className="flex align-items-center gap-2">
          <Checkbox
            inputId="updateExisting"
            checked={updateExisting}
            onChange={(e) => setUpdateExisting(e.checked ?? false)}
          />
          <label htmlFor="updateExisting" className="text-sm cursor-pointer">
            Actualizar stock existente (suma cantidades)
          </label>
        </div>
      }
    />
  );
};

export default StockBulkImport;
