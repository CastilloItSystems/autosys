"use client";
import React from "react";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputNumber } from "primereact/inputnumber";
import { IPricingTier } from "@/app/api/inventory/itemService";

interface PricingTiersTabProps {
  tiers: IPricingTier[];
  onTiersChange: (tiers: IPricingTier[]) => void;
  salePrice: number;
}

export default function PricingTiersTab({
  tiers,
  onTiersChange,
  salePrice,
}: PricingTiersTabProps) {
  const updateTier = (index: number, patch: Partial<IPricingTier>) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], ...patch };
    onTiersChange(updated);
  };

  return (
    <div className="p-4">
      <div className="mb-3 flex justify-content-between align-items-center">
        <h3 className="text-xl font-bold text-900">Precios por Cantidad</h3>
        <Button
          type="button"
          label="+ Agregar Tier"
          icon="pi pi-plus"
          onClick={() =>
            onTiersChange([
              ...tiers,
              {
                minQuantity: tiers.length > 0 ? (tiers[tiers.length - 1].maxQuantity || 0) + 1 : 1,
                maxQuantity: null,
                tierPrice: salePrice,
                discountPercentage: null,
              },
            ])
          }
          size="small"
        />
      </div>

      {tiers.length === 0 ? (
        <div className="text-center p-4 bg-surface-50 rounded border-1 border-surface-200">
          <p className="text-surface-500">Sin precios escalonados configurados</p>
        </div>
      ) : (
        <DataTable value={tiers} responsiveLayout="scroll">
          <Column
            field="minQuantity"
            header="Cantidad Mínima"
            body={(row, { rowIndex }) => (
              <InputNumber
                value={row.minQuantity}
                onValueChange={(e) => updateTier(rowIndex, { minQuantity: e.value || 1 })}
                min={1}
              />
            )}
          />
          <Column
            field="maxQuantity"
            header="Cantidad Máxima"
            body={(row, { rowIndex }) => (
              <InputNumber
                value={row.maxQuantity}
                onValueChange={(e) => updateTier(rowIndex, { maxQuantity: e.value })}
                min={0}
                placeholder="Sin límite"
              />
            )}
          />
          <Column
            field="tierPrice"
            header="Precio"
            body={(row, { rowIndex }) => (
              <InputNumber
                value={row.tierPrice}
                onValueChange={(e) => updateTier(rowIndex, { tierPrice: e.value || 0 })}
                mode="currency"
                currency="USD"
                locale="en-US"
              />
            )}
          />
          <Column
            field="discountPercentage"
            header="Descuento %"
            body={(row, { rowIndex }) => (
              <InputNumber
                value={row.discountPercentage}
                onValueChange={(e) => updateTier(rowIndex, { discountPercentage: e.value })}
                min={0}
                max={100}
              />
            )}
          />
          <Column
            header="Acciones"
            body={(row, { rowIndex }) => (
              <Button
                type="button"
                icon="pi pi-trash"
                severity="danger"
                rounded
                text
                onClick={() => onTiersChange(tiers.filter((_, i) => i !== rowIndex))}
              />
            )}
            style={{ width: "4rem" }}
          />
        </DataTable>
      )}
    </div>
  );
}
