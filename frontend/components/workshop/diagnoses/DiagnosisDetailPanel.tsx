"use client";
import React, { useState } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Tag } from "primereact/tag";
import { diagnosisService } from "@/app/api/workshop";
import { handleFormError } from "@/utils/errorHandlers";
import type { Diagnosis, DiagnosisFinding, DiagnosisSuggestedOp, DiagnosisSuggestedPart, DiagnosisEvidence } from "@/libs/interfaces/workshop";

const SEVERITY_OPTIONS = [
  { label: "Baja", value: "LOW" },
  { label: "Media", value: "MEDIUM" },
  { label: "Alta", value: "HIGH" },
  { label: "Crítica", value: "CRITICAL" },
];

const SEVERITY_TAG: Record<string, "success" | "info" | "warning" | "danger"> = {
  LOW: "success",
  MEDIUM: "info",
  HIGH: "warning",
  CRITICAL: "danger",
};

const SEVERITY_LABELS: Record<string, string> = {
  LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", CRITICAL: "Crítica",
};

const EVIDENCE_TYPE_OPTIONS = [
  { label: "Foto", value: "photo" },
  { label: "Video", value: "video" },
  { label: "Documento", value: "document" },
];

interface Props {
  diagnosis: Diagnosis;
  onRefresh: () => void;
  toast: React.RefObject<any>;
}

export default function DiagnosisDetailPanel({ diagnosis, onRefresh, toast }: Props) {
  // ── Findings ────────────────────────────────────────────────────────────────
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [findingForm, setFindingForm] = useState({
    description: "", category: "", severity: "MEDIUM", requiresClientAuth: true, observation: "",
  });
  const [addingFinding, setAddingFinding] = useState(false);
  const [removingFindingId, setRemovingFindingId] = useState<string | null>(null);

  const handleAddFinding = async () => {
    if (!findingForm.description.trim()) return;
    setAddingFinding(true);
    try {
      await diagnosisService.addFinding(diagnosis.id, {
        description: findingForm.description.trim(),
        category: findingForm.category.trim() || undefined,
        severity: findingForm.severity as any,
        requiresClientAuth: findingForm.requiresClientAuth,
        observation: findingForm.observation.trim() || undefined,
      });
      setFindingForm({ description: "", category: "", severity: "MEDIUM", requiresClientAuth: true, observation: "" });
      setShowFindingForm(false);
      onRefresh();
    } catch (e) { handleFormError(e, toast); }
    finally { setAddingFinding(false); }
  };

  const handleRemoveFinding = async (findingId: string) => {
    setRemovingFindingId(findingId);
    try {
      await diagnosisService.removeFinding(diagnosis.id, findingId);
      onRefresh();
    } catch (e) { handleFormError(e, toast); }
    finally { setRemovingFindingId(null); }
  };

  // ── Suggested Operations ─────────────────────────────────────────────────────
  const [showOpForm, setShowOpForm] = useState(false);
  const [opForm, setOpForm] = useState({ description: "", estimatedMins: 0, estimatedPrice: 0 });
  const [addingOp, setAddingOp] = useState(false);
  const [removingOpId, setRemovingOpId] = useState<string | null>(null);

  const handleAddOp = async () => {
    if (!opForm.description.trim()) return;
    setAddingOp(true);
    try {
      await diagnosisService.addSuggestedOp(diagnosis.id, {
        description: opForm.description.trim(),
        estimatedMins: opForm.estimatedMins || undefined,
        estimatedPrice: opForm.estimatedPrice || undefined,
      });
      setOpForm({ description: "", estimatedMins: 0, estimatedPrice: 0 });
      setShowOpForm(false);
      onRefresh();
    } catch (e) { handleFormError(e, toast); }
    finally { setAddingOp(false); }
  };

  const handleRemoveOp = async (opId: string) => {
    setRemovingOpId(opId);
    try {
      await diagnosisService.removeSuggestedOp(diagnosis.id, opId);
      onRefresh();
    } catch (e) { handleFormError(e, toast); }
    finally { setRemovingOpId(null); }
  };

  // ── Suggested Parts ──────────────────────────────────────────────────────────
  const [showPartForm, setShowPartForm] = useState(false);
  const [partForm, setPartForm] = useState({ description: "", quantity: 1, estimatedCost: 0, estimatedPrice: 0 });
  const [addingPart, setAddingPart] = useState(false);
  const [removingPartId, setRemovingPartId] = useState<string | null>(null);

  const handleAddPart = async () => {
    if (!partForm.description.trim()) return;
    setAddingPart(true);
    try {
      await diagnosisService.addSuggestedPart(diagnosis.id, {
        description: partForm.description.trim(),
        quantity: partForm.quantity || 1,
        estimatedCost: partForm.estimatedCost || undefined,
        estimatedPrice: partForm.estimatedPrice || undefined,
      });
      setPartForm({ description: "", quantity: 1, estimatedCost: 0, estimatedPrice: 0 });
      setShowPartForm(false);
      onRefresh();
    } catch (e) { handleFormError(e, toast); }
    finally { setAddingPart(false); }
  };

  const handleRemovePart = async (partId: string) => {
    setRemovingPartId(partId);
    try {
      await diagnosisService.removeSuggestedPart(diagnosis.id, partId);
      onRefresh();
    } catch (e) { handleFormError(e, toast); }
    finally { setRemovingPartId(null); }
  };

  // ── Evidences ────────────────────────────────────────────────────────────────
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [evidenceForm, setEvidenceForm] = useState({ type: "photo", url: "", description: "" });
  const [addingEvidence, setAddingEvidence] = useState(false);
  const [removingEvidenceId, setRemovingEvidenceId] = useState<string | null>(null);

  const handleAddEvidence = async () => {
    if (!evidenceForm.url.trim()) return;
    setAddingEvidence(true);
    try {
      await diagnosisService.addEvidence(diagnosis.id, {
        type: evidenceForm.type,
        url: evidenceForm.url.trim(),
        description: evidenceForm.description.trim() || undefined,
      });
      setEvidenceForm({ type: "photo", url: "", description: "" });
      setShowEvidenceForm(false);
      onRefresh();
    } catch (e) { handleFormError(e, toast); }
    finally { setAddingEvidence(false); }
  };

  const handleRemoveEvidence = async (evidenceId: string) => {
    setRemovingEvidenceId(evidenceId);
    try {
      await diagnosisService.removeEvidence(diagnosis.id, evidenceId);
      onRefresh();
    } catch (e) { handleFormError(e, toast); }
    finally { setRemovingEvidenceId(null); }
  };

  const findings: DiagnosisFinding[] = diagnosis.findings ?? [];
  const operations: DiagnosisSuggestedOp[] = diagnosis.suggestedOperations ?? [];
  const parts: DiagnosisSuggestedPart[] = diagnosis.suggestedParts ?? [];
  const evidences: DiagnosisEvidence[] = diagnosis.evidences ?? [];

  return (
    <div className="p-3 flex flex-column gap-3">

      {/* ── HALLAZGOS ──────────────────────────────────────────────────────── */}
      <div className="p-3 border-round border-1 border-surface-200 bg-surface-50">
        <div className="flex justify-content-between align-items-center mb-3">
          <span className="text-xs font-bold text-500 uppercase flex align-items-center gap-2">
            <i className="pi pi-exclamation-triangle text-orange-500" />
            Hallazgos ({findings.length})
          </span>
          <Button
            icon="pi pi-plus"
            size="small"
            text
            className="p-button-sm"
            onClick={() => setShowFindingForm((v) => !v)}
            tooltip="Agregar hallazgo"
          />
        </div>

        {showFindingForm && (
          <div className="mb-3 p-3 border-round bg-white border-1 border-blue-200 flex flex-column gap-2">
            <div className="grid formgrid gap-2">
              <div className="col-12 md:col-8">
                <InputTextarea
                  value={findingForm.description}
                  onChange={(e) => setFindingForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Descripción del hallazgo *"
                  rows={2}
                  className="w-full"
                  autoResize
                />
              </div>
              <div className="col-12 md:col-4">
                <Dropdown
                  value={findingForm.severity}
                  options={SEVERITY_OPTIONS}
                  onChange={(e) => setFindingForm((f) => ({ ...f, severity: e.value }))}
                  className="w-full"
                  placeholder="Severidad"
                />
              </div>
              <div className="col-12 md:col-6">
                <InputText
                  value={findingForm.category}
                  onChange={(e) => setFindingForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="Categoría (Motor, Suspensión…)"
                  className="w-full"
                />
              </div>
              <div className="col-12 md:col-6">
                <InputText
                  value={findingForm.observation}
                  onChange={(e) => setFindingForm((f) => ({ ...f, observation: e.target.value }))}
                  placeholder="Observación adicional"
                  className="w-full"
                />
              </div>
              <div className="col-12 flex align-items-center gap-2">
                <Checkbox
                  inputId="requiresAuth"
                  checked={findingForm.requiresClientAuth}
                  onChange={(e) => setFindingForm((f) => ({ ...f, requiresClientAuth: !!e.checked }))}
                />
                <label htmlFor="requiresAuth" className="text-sm">Requiere autorización del cliente</label>
              </div>
            </div>
            <div className="flex gap-2 justify-content-end">
              <Button label="Cancelar" size="small" severity="secondary" outlined onClick={() => setShowFindingForm(false)} />
              <Button label="Agregar" size="small" icon="pi pi-check" loading={addingFinding} onClick={handleAddFinding} disabled={!findingForm.description.trim()} />
            </div>
          </div>
        )}

        {findings.length === 0 ? (
          <p className="text-500 text-sm m-0">No hay hallazgos registrados.</p>
        ) : (
          <div className="flex flex-column gap-2">
            {findings.map((f) => (
              <div key={f.id} className="flex align-items-start justify-content-between gap-2 p-2 border-round bg-white border-1 border-surface-200">
                <div className="flex-1">
                  <div className="flex align-items-center gap-2 mb-1">
                    <Tag value={SEVERITY_LABELS[f.severity]} severity={SEVERITY_TAG[f.severity]} className="text-xs" />
                    {f.category && <span className="text-xs text-500">{f.category}</span>}
                    {f.requiresClientAuth && <span className="text-xs text-orange-500"><i className="pi pi-user-edit mr-1" />Auth cliente</span>}
                  </div>
                  <p className="m-0 text-sm text-900">{f.description}</p>
                  {f.observation && <p className="m-0 text-xs text-500 mt-1">{f.observation}</p>}
                </div>
                <Button
                  icon="pi pi-trash"
                  size="small"
                  text
                  severity="danger"
                  loading={removingFindingId === f.id}
                  onClick={() => handleRemoveFinding(f.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── OPERACIONES SUGERIDAS ───────────────────────────────────────────── */}
      <div className="p-3 border-round border-1 border-surface-200 bg-surface-50">
        <div className="flex justify-content-between align-items-center mb-3">
          <span className="text-xs font-bold text-500 uppercase flex align-items-center gap-2">
            <i className="pi pi-wrench text-blue-500" />
            Operaciones Sugeridas ({operations.length})
          </span>
          <Button icon="pi pi-plus" size="small" text className="p-button-sm" onClick={() => setShowOpForm((v) => !v)} tooltip="Agregar operación" />
        </div>

        {showOpForm && (
          <div className="mb-3 p-3 border-round bg-white border-1 border-blue-200 flex flex-column gap-2">
            <InputTextarea
              value={opForm.description}
              onChange={(e) => setOpForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descripción de la operación *"
              rows={2}
              className="w-full"
              autoResize
            />
            <div className="grid formgrid gap-2">
              <div className="col-12 md:col-6">
                <label className="text-xs text-500 block mb-1">Tiempo estimado (min)</label>
                <InputNumber
                  value={opForm.estimatedMins}
                  onValueChange={(e) => setOpForm((f) => ({ ...f, estimatedMins: e.value ?? 0 }))}
                  min={0} className="w-full"
                />
              </div>
              <div className="col-12 md:col-6">
                <label className="text-xs text-500 block mb-1">Precio estimado</label>
                <InputNumber
                  value={opForm.estimatedPrice}
                  onValueChange={(e) => setOpForm((f) => ({ ...f, estimatedPrice: e.value ?? 0 }))}
                  min={0} mode="currency" currency="USD" locale="es-VE" className="w-full"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-content-end">
              <Button label="Cancelar" size="small" severity="secondary" outlined onClick={() => setShowOpForm(false)} />
              <Button label="Agregar" size="small" icon="pi pi-check" loading={addingOp} onClick={handleAddOp} disabled={!opForm.description.trim()} />
            </div>
          </div>
        )}

        {operations.length === 0 ? (
          <p className="text-500 text-sm m-0">No hay operaciones sugeridas.</p>
        ) : (
          <div className="flex flex-column gap-2">
            {operations.map((op) => (
              <div key={op.id} className="flex align-items-center justify-content-between gap-2 p-2 border-round bg-white border-1 border-surface-200">
                <div className="flex-1">
                  <p className="m-0 text-sm text-900">{op.description}</p>
                  <div className="flex gap-3 mt-1">
                    {op.estimatedMins != null && op.estimatedMins > 0 && (
                      <span className="text-xs text-500"><i className="pi pi-clock mr-1" />{op.estimatedMins} min</span>
                    )}
                    {op.estimatedPrice != null && Number(op.estimatedPrice) > 0 && (
                      <span className="text-xs text-500"><i className="pi pi-dollar mr-1" />${Number(op.estimatedPrice).toLocaleString("es-VE")}</span>
                    )}
                  </div>
                </div>
                <Button icon="pi pi-trash" size="small" text severity="danger" loading={removingOpId === op.id} onClick={() => handleRemoveOp(op.id)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── REPUESTOS SUGERIDOS ─────────────────────────────────────────────── */}
      <div className="p-3 border-round border-1 border-surface-200 bg-surface-50">
        <div className="flex justify-content-between align-items-center mb-3">
          <span className="text-xs font-bold text-500 uppercase flex align-items-center gap-2">
            <i className="pi pi-box text-purple-500" />
            Repuestos Sugeridos ({parts.length})
          </span>
          <Button icon="pi pi-plus" size="small" text className="p-button-sm" onClick={() => setShowPartForm((v) => !v)} tooltip="Agregar repuesto" />
        </div>

        {showPartForm && (
          <div className="mb-3 p-3 border-round bg-white border-1 border-blue-200 flex flex-column gap-2">
            <InputTextarea
              value={partForm.description}
              onChange={(e) => setPartForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descripción del repuesto *"
              rows={2}
              className="w-full"
              autoResize
            />
            <div className="grid formgrid gap-2">
              <div className="col-12 md:col-4">
                <label className="text-xs text-500 block mb-1">Cantidad</label>
                <InputNumber
                  value={partForm.quantity}
                  onValueChange={(e) => setPartForm((f) => ({ ...f, quantity: e.value ?? 1 }))}
                  min={0.01} minFractionDigits={0} maxFractionDigits={2} className="w-full"
                />
              </div>
              <div className="col-12 md:col-4">
                <label className="text-xs text-500 block mb-1">Costo estimado</label>
                <InputNumber
                  value={partForm.estimatedCost}
                  onValueChange={(e) => setPartForm((f) => ({ ...f, estimatedCost: e.value ?? 0 }))}
                  min={0} mode="currency" currency="USD" locale="es-VE" className="w-full"
                />
              </div>
              <div className="col-12 md:col-4">
                <label className="text-xs text-500 block mb-1">Precio estimado</label>
                <InputNumber
                  value={partForm.estimatedPrice}
                  onValueChange={(e) => setPartForm((f) => ({ ...f, estimatedPrice: e.value ?? 0 }))}
                  min={0} mode="currency" currency="USD" locale="es-VE" className="w-full"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-content-end">
              <Button label="Cancelar" size="small" severity="secondary" outlined onClick={() => setShowPartForm(false)} />
              <Button label="Agregar" size="small" icon="pi pi-check" loading={addingPart} onClick={handleAddPart} disabled={!partForm.description.trim()} />
            </div>
          </div>
        )}

        {parts.length === 0 ? (
          <p className="text-500 text-sm m-0">No hay repuestos sugeridos.</p>
        ) : (
          <div className="flex flex-column gap-2">
            {parts.map((p) => (
              <div key={p.id} className="flex align-items-center justify-content-between gap-2 p-2 border-round bg-white border-1 border-surface-200">
                <div className="flex-1">
                  <p className="m-0 text-sm text-900">{p.description}</p>
                  <div className="flex gap-3 mt-1">
                    {p.quantity != null && <span className="text-xs text-500">Cant: {Number(p.quantity)}</span>}
                    {p.estimatedCost != null && Number(p.estimatedCost) > 0 && (
                      <span className="text-xs text-500">Costo: ${Number(p.estimatedCost).toLocaleString("es-VE")}</span>
                    )}
                    {p.estimatedPrice != null && Number(p.estimatedPrice) > 0 && (
                      <span className="text-xs text-500">Precio: ${Number(p.estimatedPrice).toLocaleString("es-VE")}</span>
                    )}
                  </div>
                </div>
                <Button icon="pi pi-trash" size="small" text severity="danger" loading={removingPartId === p.id} onClick={() => handleRemovePart(p.id)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── EVIDENCIAS ──────────────────────────────────────────────────────── */}
      <div className="p-3 border-round border-1 border-surface-200 bg-surface-50">
        <div className="flex justify-content-between align-items-center mb-3">
          <span className="text-xs font-bold text-500 uppercase flex align-items-center gap-2">
            <i className="pi pi-images text-teal-500" />
            Evidencias ({evidences.length})
          </span>
          <Button icon="pi pi-plus" size="small" text className="p-button-sm" onClick={() => setShowEvidenceForm((v) => !v)} tooltip="Agregar evidencia" />
        </div>

        {showEvidenceForm && (
          <div className="mb-3 p-3 border-round bg-white border-1 border-blue-200 flex flex-column gap-2">
            <div className="grid formgrid gap-2">
              <div className="col-12 md:col-3">
                <Dropdown
                  value={evidenceForm.type}
                  options={EVIDENCE_TYPE_OPTIONS}
                  onChange={(e) => setEvidenceForm((f) => ({ ...f, type: e.value }))}
                  className="w-full"
                  placeholder="Tipo"
                />
              </div>
              <div className="col-12 md:col-9">
                <InputText
                  value={evidenceForm.url}
                  onChange={(e) => setEvidenceForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="URL de la evidencia *"
                  className="w-full"
                />
              </div>
              <div className="col-12">
                <InputText
                  value={evidenceForm.description}
                  onChange={(e) => setEvidenceForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Descripción (opcional)"
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-content-end">
              <Button label="Cancelar" size="small" severity="secondary" outlined onClick={() => setShowEvidenceForm(false)} />
              <Button label="Agregar" size="small" icon="pi pi-check" loading={addingEvidence} onClick={handleAddEvidence} disabled={!evidenceForm.url.trim()} />
            </div>
          </div>
        )}

        {evidences.length === 0 ? (
          <p className="text-500 text-sm m-0">No hay evidencias registradas.</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {evidences.map((ev) => (
              <div key={ev.id} className="flex align-items-center gap-2 p-2 border-round bg-white border-1 border-surface-200">
                <i className={`pi ${ev.type === "photo" ? "pi-image" : ev.type === "video" ? "pi-video" : "pi-file"} text-teal-500`} />
                <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary font-semibold">
                  {ev.description || ev.type}
                </a>
                <Button icon="pi pi-trash" size="small" text severity="danger" loading={removingEvidenceId === ev.id} onClick={() => handleRemoveEvidence(ev.id)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── NOTAS ───────────────────────────────────────────────────────────── */}
      {diagnosis.generalNotes && (
        <div className="p-3 border-round bg-blue-50 border-1 border-blue-100">
          <span className="text-xs font-bold text-500 uppercase block mb-1">Notas generales</span>
          <p className="m-0 text-sm text-900">{diagnosis.generalNotes}</p>
        </div>
      )}
    </div>
  );
}
