"use client";
import React, { useEffect, useState, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";

import {
  Case,
  CaseComment,
  CASE_STATUS_CONFIG,
  CASE_PRIORITY_CONFIG,
  CASE_TYPE_CONFIG,
} from "@/libs/interfaces/crm/case.interface";
import caseService from "@/app/api/crm/caseService";
import { handleFormError } from "@/utils/errorHandlers";

interface Props {
  caseId: string | null;
  visible: boolean;
  onHide: () => void;
  onUpdated: () => void;
  toast: React.RefObject<Toast> | null;
}

const TERMINAL_STATUSES = ["RESOLVED", "CLOSED", "REJECTED"];

function isOverdue(slaDeadline?: string | null, status?: string): boolean {
  if (!slaDeadline) return false;
  if (TERMINAL_STATUSES.includes(status ?? "")) return false;
  return new Date(slaDeadline) < new Date();
}

export default function CaseDetailDialog({ caseId, visible, onHide, onUpdated, toast }: Props) {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!visible || !caseId) {
      setCaseData(null);
      setComment("");
      setIsInternal(false);
      return;
    }
    setLoading(true);
    caseService
      .getById(caseId)
      .then((res) => {
        const data = (res as any)?.data ?? res;
        setCaseData(data);
      })
      .catch(() => {
        toast?.current?.show({ severity: "error", summary: "Error al cargar el caso" });
      })
      .finally(() => setLoading(false));
  }, [visible, caseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddComment = async () => {
    if (!caseId || !comment.trim()) return;
    setSubmittingComment(true);
    try {
      await caseService.addComment(caseId, { comment: comment.trim(), isInternal });
      toast?.current?.show({ severity: "success", summary: "Comentario agregado" });
      setComment("");
      setIsInternal(false);
      // Reload case to get updated comments
      const res = await caseService.getById(caseId);
      const data = (res as any)?.data ?? res;
      setCaseData(data);
      onUpdated();
    } catch (err) {
      handleFormError(err, toast);
    } finally {
      setSubmittingComment(false);
    }
  };

  const statusCfg = caseData ? CASE_STATUS_CONFIG[caseData.status] : null;
  const priorityCfg = caseData ? CASE_PRIORITY_CONFIG[caseData.priority] : null;
  const overdue = isOverdue(caseData?.slaDeadline, caseData?.status);

  const header = caseData ? (
    <div className="flex align-items-center gap-2 flex-wrap">
      <i className="pi pi-inbox text-primary" />
      <span className="font-semibold">{caseData.caseNumber}</span>
      <span className="text-600 text-sm">·</span>
      <span className="text-sm text-700">{caseData.title}</span>
      <div className="flex gap-2 ml-auto">
        {priorityCfg && (
          <Tag value={priorityCfg.label} severity={priorityCfg.severity} icon={priorityCfg.icon} className="text-xs" />
        )}
        {statusCfg && (
          <Tag value={statusCfg.label} severity={statusCfg.severity} icon={statusCfg.icon} className="text-xs" />
        )}
      </div>
    </div>
  ) : (
    <span>Detalle del Caso</span>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={header}
      style={{ width: "760px" }}
      breakpoints={{ "960px": "95vw", "640px": "98vw" }}
      modal
      draggable={false}
      maximizable
    >
      {loading && (
        <div className="flex justify-content-center align-items-center py-5">
          <i className="pi pi-spin pi-spinner text-4xl text-400" />
        </div>
      )}

      {!loading && caseData && (
        <div className="p-fluid">
          {/* SLA deadline */}
          {caseData.slaDeadline && (
            <div className={`mb-3 flex align-items-center gap-2 text-sm ${overdue ? "text-red-500 font-semibold" : "text-600"}`}>
              <i className={`pi ${overdue ? "pi-exclamation-triangle" : "pi-clock"}`} />
              <span>
                SLA:{" "}
                {new Date(caseData.slaDeadline).toLocaleString("es-VE")}
                {overdue && " — VENCIDO"}
              </span>
            </div>
          )}

          {/* Info grid */}
          <div className="grid formgrid">
            <div className="col-12 md:col-6 mb-3">
              <div className="text-xs text-500 mb-1">Tipo</div>
              <div className="text-sm font-semibold">
                {CASE_TYPE_CONFIG[caseData.type]?.label ?? caseData.type}
              </div>
            </div>

            <div className="col-12 md:col-6 mb-3">
              <div className="text-xs text-500 mb-1">Asignado a</div>
              <div className="text-sm">{caseData.assignedTo ?? <span className="text-400">—</span>}</div>
            </div>

            <div className="col-12 md:col-6 mb-3">
              <div className="text-xs text-500 mb-1">Cliente</div>
              <div className="text-sm font-semibold">
                {caseData.customer?.name ?? caseData.customerId}
              </div>
              {caseData.customer?.code && (
                <div className="text-xs text-500">{caseData.customer.code}</div>
              )}
              {(caseData.customer?.phone || caseData.customer?.mobile) && (
                <div className="text-xs text-400 mt-1">
                  {caseData.customer.phone ?? caseData.customer.mobile}
                </div>
              )}
            </div>

            {caseData.customerVehicle && (
              <div className="col-12 md:col-6 mb-3">
                <div className="text-xs text-500 mb-1">Vehículo</div>
                <div className="text-sm">{caseData.customerVehicle.plate}</div>
              </div>
            )}

            {caseData.lead && (
              <div className="col-12 md:col-6 mb-3">
                <div className="text-xs text-500 mb-1">Lead vinculado</div>
                <div className="text-sm">{caseData.lead.title}</div>
                <div className="text-xs text-400">{caseData.lead.channel}</div>
              </div>
            )}

            {caseData.refDocType && (
              <div className="col-12 md:col-6 mb-3">
                <div className="text-xs text-500 mb-1">Documento de referencia</div>
                <div className="text-sm">
                  {caseData.refDocType}
                  {caseData.refDocNumber && ` — ${caseData.refDocNumber}`}
                </div>
              </div>
            )}

            <div className="col-12 md:col-6 mb-3">
              <div className="text-xs text-500 mb-1">Creado</div>
              <div className="text-sm">{new Date(caseData.createdAt).toLocaleString("es-VE")}</div>
            </div>
          </div>

          <Divider className="my-2" />

          {/* Description */}
          <div className="mb-3">
            <div className="text-xs text-500 mb-1 font-semibold">DESCRIPCIÓN</div>
            <div className="text-sm line-height-3 white-space-pre-line">{caseData.description}</div>
          </div>

          {/* Resolution */}
          {caseData.resolution && (
            <div className="mb-3">
              <div className="text-xs text-500 mb-1 font-semibold">RESOLUCIÓN</div>
              <div className="text-sm line-height-3 white-space-pre-line">{caseData.resolution}</div>
            </div>
          )}

          {/* Root cause */}
          {caseData.rootCause && (
            <div className="mb-3">
              <div className="text-xs text-500 mb-1 font-semibold">CAUSA RAÍZ</div>
              <div className="text-sm line-height-3">{caseData.rootCause}</div>
            </div>
          )}

          <Divider className="my-2" />

          {/* Comments */}
          <div>
            <div className="text-xs text-500 mb-2 font-semibold">
              COMENTARIOS ({caseData.comments?.length ?? 0})
            </div>

            {(!caseData.comments || caseData.comments.length === 0) && (
              <div className="text-center text-500 text-sm py-2 border-1 border-dashed border-300 border-round mb-3">
                Sin comentarios aún.
              </div>
            )}

            <div className="flex flex-column gap-2 mb-3">
              {(caseData.comments ?? []).map((c: CaseComment) => (
                <div
                  key={c.id}
                  className={`p-3 border-round text-sm ${
                    c.isInternal
                      ? "bg-gray-100 border-left-3 border-400"
                      : "bg-blue-50 border-left-3 border-primary"
                  }`}
                >
                  <div className="flex justify-content-between align-items-center mb-1">
                    <span className="font-semibold text-xs text-700">{c.createdBy}</span>
                    <span className="text-xs text-400">
                      {new Date(c.createdAt).toLocaleString("es-VE")}
                    </span>
                  </div>
                  {c.isInternal && (
                    <div className="text-xs text-400 mb-1 font-italic">
                      <i className="pi pi-lock mr-1" />Interno
                    </div>
                  )}
                  <div className={`line-height-3 ${c.isInternal ? "text-600 font-italic" : ""}`}>
                    {c.comment}
                  </div>
                </div>
              ))}
            </div>

            {/* Add comment form */}
            <div className="border-1 border-200 border-round p-3">
              <div className="text-xs text-500 mb-2 font-semibold">AGREGAR COMENTARIO</div>
              <InputTextarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Escribe un comentario..."
                className="w-full mb-2"
              />
              <div className="flex justify-content-between align-items-center">
                <div className="flex align-items-center gap-2">
                  <Checkbox
                    inputId="isInternal"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(!!e.checked)}
                  />
                  <label htmlFor="isInternal" className="text-sm cursor-pointer">
                    <i className="pi pi-lock mr-1 text-400" />
                    Interno (no visible al cliente)
                  </label>
                </div>
                <Button
                  label="Agregar"
                  icon="pi pi-send"
                  size="small"
                  onClick={handleAddComment}
                  loading={submittingComment}
                  disabled={!comment.trim()}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
