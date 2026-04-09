"use client";
import React, { useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Tag } from "primereact/tag";
import { diagnosisService } from "@/app/api/workshop";
import { handleFormError } from "@/utils/errorHandlers";
import type { DiagnosisFinding } from "@/libs/interfaces/workshop";

const SEVERITY_OPTIONS = [
  { label: "Baja", value: "LOW" },
  { label: "Media", value: "MEDIUM" },
  { label: "Alta", value: "HIGH" },
  { label: "Crítica", value: "CRITICAL" },
];

const SEVERITY_TAG: Record<string, "success" | "info" | "warning" | "danger"> = {
  LOW: "success", MEDIUM: "info", HIGH: "warning", CRITICAL: "danger",
};

const SEVERITY_LABELS: Record<string, string> = {
  LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", CRITICAL: "Crítica",
};

interface Props {
  diagnosisId: string;
  findings: DiagnosisFinding[];
  onRefresh: () => void;
  toast: React.RefObject<any>;
}

const EMPTY = { description: "", category: "", severity: "MEDIUM", requiresClientAuth: true, observation: "" };

export default function DiagnosisFindingsTab({ diagnosisId, findings, onRefresh, toast }: Props) {
  const [addDialog, setAddDialog] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!form.description.trim()) return;
    setAdding(true);
    try {
      await diagnosisService.addFinding(diagnosisId, {
        description: form.description.trim(),
        category: form.category.trim() || undefined,
        severity: form.severity as any,
        requiresClientAuth: form.requiresClientAuth,
        observation: form.observation.trim() || undefined,
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
      await diagnosisService.removeFinding(diagnosisId, id);
      onRefresh();
    } catch (e) { handleFormError(e, toast); }
    finally { setRemovingId(null); }
  };

  const severityTemplate = (row: DiagnosisFinding) => (
    <Tag value={SEVERITY_LABELS[row.severity]} severity={SEVERITY_TAG[row.severity]} />
  );

  const authTemplate = (row: DiagnosisFinding) =>
    row.requiresClientAuth ? (
      <i className="pi pi-check-circle text-orange-500" title="Requiere autorización" />
    ) : (
      <i className="pi pi-minus text-300" />
    );

  const actionsTemplate = (row: DiagnosisFinding) => (
    <Button
      icon="pi pi-trash"
      size="small"
      text
      severity="danger"
      loading={removingId === row.id}
      onClick={() => handleRemove(row.id)}
    />
  );

  return (
    <div className="pt-2">
      <div className="flex justify-content-between align-items-center mb-3">
        <span className="text-sm text-500">
          {findings.length === 0 ? "No hay hallazgos registrados." : `${findings.length} hallazgo${findings.length !== 1 ? "s" : ""} registrado${findings.length !== 1 ? "s" : ""}.`}
        </span>
        <Button
          label="Agregar hallazgo"
          icon="pi pi-plus"
          size="small"
          onClick={() => setAddDialog(true)}
        />
      </div>

      {findings.length > 0 && (
        <DataTable value={findings} size="small" stripedRows>
          <Column header="Severidad" body={severityTemplate} style={{ width: "8rem" }} />
          <Column field="category" header="Categoría" style={{ width: "9rem" }} />
          <Column field="description" header="Descripción" />
          <Column field="observation" header="Observación" style={{ maxWidth: "12rem" }} />
          <Column header="Auth" body={authTemplate} style={{ width: "5rem", textAlign: "center" }} headerStyle={{ textAlign: "center" }} />
          <Column body={actionsTemplate} style={{ width: "4rem", textAlign: "center" }} headerStyle={{ textAlign: "center" }} />
        </DataTable>
      )}

      {/* Add Dialog */}
      <Dialog
        header={
          <div className="mb-1">
            <div className="border-bottom-2 border-primary pb-2 flex align-items-center gap-2">
              <i className="pi pi-exclamation-triangle text-primary text-xl" />
              <span className="text-xl font-bold text-900">Agregar Hallazgo</span>
            </div>
          </div>
        }
        visible={addDialog}
        onHide={() => { setAddDialog(false); setForm(EMPTY); }}
        style={{ width: "38rem" }}
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
              placeholder="Descripción del hallazgo..."
            />
          </div>
          <div className="grid formgrid">
            <div className="col-12 md:col-6">
              <label className="text-sm font-semibold block mb-1">Severidad</label>
              <Dropdown
                value={form.severity}
                options={SEVERITY_OPTIONS}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.value }))}
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-6">
              <label className="text-sm font-semibold block mb-1">Categoría</label>
              <InputText
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Motor, Suspensión..."
                className="w-full"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">Observación</label>
            <InputText
              value={form.observation}
              onChange={(e) => setForm((f) => ({ ...f, observation: e.target.value }))}
              placeholder="Detalle adicional..."
              className="w-full"
            />
          </div>
          <div className="flex align-items-center gap-2">
            <Checkbox
              inputId="reqAuth"
              checked={form.requiresClientAuth}
              onChange={(e) => setForm((f) => ({ ...f, requiresClientAuth: !!e.checked }))}
            />
            <label htmlFor="reqAuth" className="text-sm">Requiere autorización del cliente</label>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
