"use client";
import React, { useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { diagnosisService } from "@/app/api/workshop";
import { handleFormError } from "@/utils/errorHandlers";
import type { DiagnosisSuggestedOp } from "@/libs/interfaces/workshop";

interface Props {
  diagnosisId: string;
  operations: DiagnosisSuggestedOp[];
  onRefresh: () => void;
  toast: React.RefObject<any>;
}

const EMPTY = { description: "", estimatedMins: 0, estimatedPrice: 0 };

export default function DiagnosisOperationsTab({ diagnosisId, operations, onRefresh, toast }: Props) {
  const [addDialog, setAddDialog] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!form.description.trim()) return;
    setAdding(true);
    try {
      await diagnosisService.addSuggestedOp(diagnosisId, {
        description: form.description.trim(),
        estimatedMins: form.estimatedMins || undefined,
        estimatedPrice: form.estimatedPrice || undefined,
      });
      setForm(EMPTY);
      setAddDialog(false);
      onRefresh();
    } catch (e) { handleFormError(e, toast); }
    finally { setAdding(false); }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      await diagnosisService.removeSuggestedOp(diagnosisId, id);
      onRefresh();
    } catch (e) { handleFormError(e, toast); }
    finally { setRemovingId(null); }
  };

  const minsTemplate = (row: DiagnosisSuggestedOp) =>
    row.estimatedMins ? <span>{row.estimatedMins} min</span> : <span className="text-300">—</span>;

  const priceTemplate = (row: DiagnosisSuggestedOp) =>
    row.estimatedPrice && Number(row.estimatedPrice) > 0
      ? <span>${Number(row.estimatedPrice).toLocaleString("es-VE")}</span>
      : <span className="text-300">—</span>;

  const actionsTemplate = (row: DiagnosisSuggestedOp) => (
    <Button icon="pi pi-trash" size="small" text severity="danger" loading={removingId === row.id} onClick={() => handleRemove(row.id)} />
  );

  return (
    <div className="pt-2">
      <div className="flex justify-content-between align-items-center mb-3">
        <span className="text-sm text-500">
          {operations.length === 0 ? "No hay operaciones sugeridas." : `${operations.length} operación${operations.length !== 1 ? "es" : ""} sugerida${operations.length !== 1 ? "s" : ""}.`}
        </span>
        <Button label="Agregar operación" icon="pi pi-plus" size="small" onClick={() => setAddDialog(true)} />
      </div>

      {operations.length > 0 && (
        <DataTable value={operations} size="small" stripedRows>
          <Column field="description" header="Descripción" />
          <Column header="Tiempo" body={minsTemplate} style={{ width: "8rem" }} />
          <Column header="Precio Est." body={priceTemplate} style={{ width: "9rem" }} />
          <Column body={actionsTemplate} style={{ width: "4rem", textAlign: "center" }} />
        </DataTable>
      )}

      <Dialog
        header={
          <div className="mb-1">
            <div className="border-bottom-2 border-primary pb-2 flex align-items-center gap-2">
              <i className="pi pi-wrench text-primary text-xl" />
              <span className="text-xl font-bold text-900">Agregar Operación Sugerida</span>
            </div>
          </div>
        }
        visible={addDialog}
        onHide={() => { setAddDialog(false); setForm(EMPTY); }}
        style={{ width: "36rem" }}
        modal
        draggable={false}
        footer={
          <div className="flex w-full gap-2">
            <Button label="Cancelar" icon="pi pi-times" severity="secondary" className="flex-1" type="button" onClick={() => { setAddDialog(false); setForm(EMPTY); }} />
            <Button label="Agregar" icon="pi pi-check" loading={adding} disabled={!form.description.trim()} className="flex-1" type="button" onClick={handleAdd} />
          </div>
        }
      >
        <div className="flex flex-column gap-3 p-fluid pt-2">
          <div>
            <label className="text-sm font-semibold block mb-1">Descripción <span className="text-red-500">*</span></label>
            <InputTextarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              autoResize
              className="w-full"
              placeholder="Descripción de la operación..."
            />
          </div>
          <div className="grid formgrid">
            <div className="col-12 md:col-6">
              <label className="text-sm font-semibold block mb-1">Tiempo estimado (min)</label>
              <InputNumber
                value={form.estimatedMins}
                onValueChange={(e) => setForm((f) => ({ ...f, estimatedMins: e.value ?? 0 }))}
                min={0}
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-6">
              <label className="text-sm font-semibold block mb-1">Precio estimado</label>
              <InputNumber
                value={form.estimatedPrice}
                onValueChange={(e) => setForm((f) => ({ ...f, estimatedPrice: e.value ?? 0 }))}
                min={0}
                mode="currency"
                currency="USD"
                locale="es-VE"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
