"use client";
import React, { useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { diagnosisService } from "@/app/api/workshop";
import { handleFormError } from "@/utils/errorHandlers";
import type { DiagnosisEvidence } from "@/libs/interfaces/workshop";

const EVIDENCE_TYPE_OPTIONS = [
  { label: "Foto", value: "photo" },
  { label: "Video", value: "video" },
  { label: "Documento", value: "document" },
];

const TYPE_ICON: Record<string, string> = {
  photo: "pi pi-image",
  video: "pi pi-video",
  document: "pi pi-file",
};

const TYPE_COLOR: Record<string, string> = {
  photo: "text-blue-500",
  video: "text-purple-500",
  document: "text-teal-500",
};

const ACCEPT: Record<string, string> = {
  photo: "image/*",
  video: "video/*",
  document: ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt",
};

interface Props {
  diagnosisId: string;
  evidences: DiagnosisEvidence[];
  onRefresh: () => void;
  toast: React.RefObject<any>;
}

const EMPTY = { type: "photo", url: "", description: "" };

export default function DiagnosisEvidencesTab({ diagnosisId, evidences, onRefresh, toast }: Props) {
  const [addDialog, setAddDialog] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const useFileUpload = form.type === "photo" || form.type === "video" || form.type === "document";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file && form.type === "photo") {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleTypeChange = (type: string) => {
    setForm((f) => ({ ...f, type, url: "" }));
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isValid = useFileUpload ? !!selectedFile || !!form.url.trim() : !!form.url.trim();

  const handleAdd = async () => {
    if (!isValid) return;
    setAdding(true);
    try {
      if (selectedFile) {
        await diagnosisService.uploadEvidenceFile(
          diagnosisId,
          selectedFile,
          form.type,
          form.description.trim() || undefined
        );
      } else {
        await diagnosisService.addEvidence(diagnosisId, {
          type: form.type,
          url: form.url.trim(),
          description: form.description.trim() || undefined,
        });
      }
      resetForm();
      setAddDialog(false);
      onRefresh();
    } catch (e) {
      handleFormError(e, toast);
    } finally {
      setAdding(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      await diagnosisService.removeEvidence(diagnosisId, id);
      onRefresh();
    } catch (e) {
      handleFormError(e, toast);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="pt-2">
      <div className="flex justify-content-between align-items-center mb-3">
        <span className="text-sm text-500">
          {evidences.length === 0
            ? "No hay evidencias registradas."
            : `${evidences.length} evidencia${evidences.length !== 1 ? "s" : ""} registrada${evidences.length !== 1 ? "s" : ""}.`}
        </span>
        <Button label="Agregar evidencia" icon="pi pi-plus" size="small" onClick={() => setAddDialog(true)} />
      </div>

      {evidences.length > 0 && (
        <div className="flex flex-column gap-2">
          {evidences.map((ev) => (
            <div
              key={ev.id}
              className="flex align-items-center justify-content-between gap-3 p-3 border-round border-1 border-surface-200 surface-50"
            >
              <div className="flex align-items-center gap-3 min-w-0">
                {ev.type === "photo" ? (
                  <a href={ev.url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={ev.url}
                      alt={ev.description || "evidencia"}
                      style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </a>
                ) : (
                  <i className={`${TYPE_ICON[ev.type] ?? "pi pi-link"} text-xl ${TYPE_COLOR[ev.type] ?? "text-500"}`} />
                )}
                <div className="min-w-0">
                  <a
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-semibold text-sm block overflow-hidden text-overflow-ellipsis white-space-nowrap"
                    style={{ maxWidth: "28rem" }}
                  >
                    {ev.description || ev.url}
                  </a>
                  {ev.description && (
                    <span
                      className="text-xs text-500 block overflow-hidden text-overflow-ellipsis white-space-nowrap"
                      style={{ maxWidth: "28rem" }}
                    >
                      {ev.url}
                    </span>
                  )}
                </div>
              </div>
              <Button
                icon="pi pi-trash"
                size="small"
                text
                severity="danger"
                loading={removingId === ev.id}
                onClick={() => handleRemove(ev.id)}
              />
            </div>
          ))}
        </div>
      )}

      <Dialog
        header={
          <div className="mb-1">
            <div className="border-bottom-2 border-primary pb-2 flex align-items-center gap-2">
              <i className="pi pi-images text-primary text-xl" />
              <span className="text-xl font-bold text-900">Agregar Evidencia</span>
            </div>
          </div>
        }
        visible={addDialog}
        onHide={() => { setAddDialog(false); resetForm(); }}
        style={{ width: "36rem" }}
        modal
        draggable={false}
        footer={
          <div className="flex w-full gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              severity="secondary"
              className="flex-1"
              type="button"
              onClick={() => { setAddDialog(false); resetForm(); }}
            />
            <Button
              label="Agregar"
              icon="pi pi-check"
              loading={adding}
              disabled={!isValid}
              className="flex-1"
              type="button"
              onClick={handleAdd}
            />
          </div>
        }
      >
        <div className="flex flex-column gap-3 p-fluid pt-2">
          {/* Tipo */}
          <div>
            <label className="text-sm font-semibold block mb-1">Tipo</label>
            <Dropdown
              value={form.type}
              options={EVIDENCE_TYPE_OPTIONS}
              onChange={(e) => handleTypeChange(e.value)}
              className="w-full"
            />
          </div>

          {/* Selección de archivo */}
          <div>
            <label className="text-sm font-semibold block mb-1">
              Archivo <span className="text-red-500">*</span>
            </label>
            <div
              className="border-2 border-dashed border-300 border-round p-3 text-center cursor-pointer hover:border-primary transition-colors transition-duration-200"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="preview"
                  style={{ maxHeight: 160, maxWidth: "100%", borderRadius: 6, objectFit: "contain" }}
                />
              ) : selectedFile ? (
                <div className="flex align-items-center justify-content-center gap-2 text-600">
                  <i className={`${TYPE_ICON[form.type]} text-2xl`} />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-column align-items-center gap-1 text-400 py-2">
                  <i className="pi pi-upload text-3xl" />
                  <span className="text-sm">Haz clic para seleccionar un archivo</span>
                  <span className="text-xs">{form.type === "photo" ? "JPG, PNG, WEBP, etc." : form.type === "video" ? "MP4, MOV, etc." : "PDF, DOCX, XLSX, etc."}</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT[form.type] ?? "*"}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            {selectedFile && (
              <Button
                label="Quitar archivo"
                icon="pi pi-times"
                text
                severity="secondary"
                size="small"
                className="mt-1"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              />
            )}
          </div>

          {/* URL alternativa (si no hay archivo) */}
          {!selectedFile && (
            <div>
              <label className="text-sm font-semibold block mb-1">
                O pega una URL {selectedFile ? "" : <span className="text-red-500">*</span>}
              </label>
              <InputText
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://..."
                className="w-full"
              />
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="text-sm font-semibold block mb-1">Descripción (opcional)</label>
            <InputText
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Foto del motor, cotización..."
              className="w-full"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
