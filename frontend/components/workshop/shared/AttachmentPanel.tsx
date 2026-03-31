"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType?: string | null;
  description?: string | null;
  createdAt?: string;
}

interface AttachmentPanelProps {
  entityType: string;
  entityId: string;
  readOnly?: boolean;
}

interface NewAttachmentForm {
  fileName: string;
  fileUrl: string;
  description: string;
}

const EMPTY_FORM: NewAttachmentForm = {
  fileName: "",
  fileUrl: "",
  description: "",
};

export default function AttachmentPanel({
  entityType,
  entityId,
  readOnly = false,
}: AttachmentPanelProps) {
  const toastRef = useRef<Toast>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [form, setForm] = useState<NewAttachmentForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadAttachments = useCallback(async () => {
    setLoading(true);
    try {
      // Lazy-load service — gracefully handle if not yet available
      const mod = await import("@/app/api/workshop").catch(() => null);
      const svc = (mod as any)?.attachmentService;
      if (svc?.getAttachments) {
        const data = await svc.getAttachments(entityType, entityId);
        setAttachments(data ?? []);
      } else {
        setAttachments([]);
      }
    } catch {
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    if (entityId) {
      loadAttachments();
    }
  }, [entityId, loadAttachments]);

  const handleSave = async () => {
    if (!form.fileName.trim() || !form.fileUrl.trim()) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Campos requeridos",
        detail: "Nombre y URL son obligatorios",
        life: 3000,
      });
      return;
    }

    setSaving(true);
    try {
      const mod = await import("@/app/api/workshop").catch(() => null);
      const svc = (mod as any)?.attachmentService;
      if (svc?.createAttachment) {
        const created = await svc.createAttachment({
          entityType,
          entityId,
          ...form,
        });
        setAttachments((prev) => [...prev, created]);
      } else {
        // Fallback: add locally with a temp id
        setAttachments((prev) => [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            fileName: form.fileName,
            fileUrl: form.fileUrl,
            description: form.description || null,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      toastRef.current?.show({
        severity: "success",
        summary: "Adjunto agregado",
        life: 2500,
      });
      setDialogVisible(false);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: err?.message ?? "No se pudo guardar el adjunto",
        life: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const mod = await import("@/app/api/workshop").catch(() => null);
      const svc = (mod as any)?.attachmentService;
      if (svc?.deleteAttachment) {
        await svc.deleteAttachment(id);
      }
      setAttachments((prev) => prev.filter((a) => a.id !== id));
      toastRef.current?.show({
        severity: "success",
        summary: "Adjunto eliminado",
        life: 2000,
      });
    } catch (err: any) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: err?.message ?? "No se pudo eliminar",
        life: 3000,
      });
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const dialogFooter = (
    <div className="flex gap-2 justify-content-end">
      <Button
        label="Cancelar"
        severity="secondary"
        outlined
        onClick={() => {
          setDialogVisible(false);
          setForm(EMPTY_FORM);
        }}
        disabled={saving}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        loading={saving}
        onClick={handleSave}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toastRef} />

      <div className="flex flex-column gap-3">
        {/* Header row */}
        {!readOnly && (
          <div className="flex justify-content-end">
            <Button
              label="Agregar adjunto"
              icon="pi pi-paperclip"
              size="small"
              outlined
              onClick={() => setDialogVisible(true)}
            />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-content-center p-4">
            <ProgressSpinner style={{ width: 40, height: 40 }} />
          </div>
        ) : attachments.length === 0 ? (
          <div className="flex flex-column align-items-center justify-content-center p-5 text-500">
            <i className="pi pi-folder-open text-4xl mb-2" />
            <span className="text-sm">Sin adjuntos</span>
          </div>
        ) : (
          <div className="flex flex-column gap-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex align-items-center justify-content-between p-3 border-1 border-round surface-border surface-50 gap-3"
              >
                <div className="flex align-items-center gap-3 flex-1 min-w-0">
                  <i className="pi pi-file text-primary text-xl flex-shrink-0" />
                  <div className="flex flex-column gap-1 min-w-0">
                    <a
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-medium text-sm no-underline hover:underline white-space-nowrap overflow-hidden text-overflow-ellipsis"
                    >
                      {att.fileName}
                    </a>
                    {att.description && (
                      <span className="text-500 text-xs">{att.description}</span>
                    )}
                    <div className="flex align-items-center gap-2">
                      {att.fileType && (
                        <Tag value={att.fileType.toUpperCase()} severity="secondary" />
                      )}
                      {att.createdAt && (
                        <span className="text-400 text-xs">
                          {formatDate(att.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!readOnly && (
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    size="small"
                    onClick={() => handleDelete(att.id)}
                    tooltip="Eliminar"
                    tooltipOptions={{ position: "left" }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add attachment dialog */}
      <Dialog
        header="Agregar adjunto"
        visible={dialogVisible}
        onHide={() => {
          if (!saving) {
            setDialogVisible(false);
            setForm(EMPTY_FORM);
          }
        }}
        style={{ width: "min(480px, 95vw)" }}
        footer={dialogFooter}
        closable={!saving}
      >
        <div className="flex flex-column gap-3 pt-2">
          <div className="flex flex-column gap-1">
            <label className="text-sm font-medium text-900">
              Nombre del archivo <span className="text-red-500">*</span>
            </label>
            <InputText
              value={form.fileName}
              onChange={(e) => setForm((f) => ({ ...f, fileName: e.target.value }))}
              placeholder="ej. factura-001.pdf"
              className="w-full"
            />
          </div>

          <div className="flex flex-column gap-1">
            <label className="text-sm font-medium text-900">
              URL del archivo <span className="text-red-500">*</span>
            </label>
            <InputText
              value={form.fileUrl}
              onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full"
            />
          </div>

          <div className="flex flex-column gap-1">
            <label className="text-sm font-medium text-900">Descripción</label>
            <InputTextarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Descripción opcional..."
              rows={3}
              className="w-full"
            />
          </div>
        </div>
      </Dialog>
    </>
  );
}
