"use client";
import React from "react";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";

interface Spec {
  label: string;
  value: string;
}

interface SpecificationsTabProps {
  specs: Spec[];
  onSpecsChange: (specs: Spec[]) => void;
}

export default function SpecificationsTab({ specs, onSpecsChange }: SpecificationsTabProps) {
  const updateSpec = (index: number, patch: Partial<Spec>) => {
    const updated = [...specs];
    updated[index] = { ...updated[index], ...patch };
    onSpecsChange(updated);
  };

  return (
    <div className="p-4">
      <div className="mb-3 flex justify-content-between align-items-center">
        <h3 className="text-xl font-bold text-900">Especificaciones Técnicas</h3>
        <Button
          type="button"
          label="+ Añadir Especificación"
          icon="pi pi-plus"
          onClick={() => onSpecsChange([...specs, { label: "", value: "" }])}
          size="small"
        />
      </div>

      {specs.length === 0 ? (
        <div className="text-center p-4 bg-surface-50 rounded border-1 border-surface-200">
          <p className="text-surface-500">No hay especificaciones técnicas añadidas</p>
        </div>
      ) : (
        <DataTable value={specs} responsiveLayout="scroll">
          <Column
            header="Nombre (Label)"
            body={(row, { rowIndex }) => (
              <InputText
                value={row.label}
                onChange={(e) => updateSpec(rowIndex, { label: e.target.value })}
                placeholder="Ej: Voltaje, Material, Peso"
                className="w-full"
              />
            )}
          />
          <Column
            header="Valor"
            body={(row, { rowIndex }) => (
              <InputText
                value={row.value}
                onChange={(e) => updateSpec(rowIndex, { value: e.target.value })}
                placeholder="Ej: 110V, Aluminio, 2kg"
                className="w-full"
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
                onClick={() => onSpecsChange(specs.filter((_, i) => i !== rowIndex))}
              />
            )}
            style={{ width: "4rem" }}
          />
        </DataTable>
      )}
    </div>
  );
}
