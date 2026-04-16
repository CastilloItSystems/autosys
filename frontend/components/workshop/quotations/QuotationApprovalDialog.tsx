"use client";
import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";
import { handleFormError } from "@/utils/errorHandlers";
import { quotationService } from "@/app/api/workshop";
import type { WorkshopQuotation, ApprovalType, ApprovalChannel } from "@/libs/interfaces/workshop";

const APPROVAL_TYPE_OPTIONS: { label: string; value: ApprovalType }[] = [
  { label: "Aprobación total",   value: "TOTAL" },
  { label: "Aprobación parcial", value: "PARTIAL" },
  { label: "Rechazo",            value: "REJECTION" },
];

const CHANNEL_OPTIONS: { label: string; value: ApprovalChannel }[] = [
  { label: "Firma presencial",   value: "PRESENTIAL" },
  { label: "WhatsApp",           value: "WHATSAPP" },
  { label: "Correo electrónico", value: "EMAIL" },
  { label: "Llamada",            value: "CALL" },
  { label: "Firma digital",      value: "DIGITAL_SIGNATURE" },
];

interface Props {
  visible: boolean;
  quotation: WorkshopQuotation | null;
  onHide: () => void;
  onSaved: () => void;
  toast: React.RefObject<Toast>;
}

export default function QuotationApprovalDialog({ visible, quotation, onHide, onSaved, toast }: Props) {
  const [type, setType] = useState<ApprovalType>("TOTAL");
  const [channel, setChannel] = useState<ApprovalChannel>("PRESENTIAL");
  const [approvedByName, setApprovedByName] = useState("");
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvedItemIds, setApprovedItemIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setType("TOTAL"); setChannel("PRESENTIAL");
    setApprovedByName(""); setNotes(""); setRejectionReason("");
    setApprovedItemIds([]);
  };

  React.useEffect(() => {
    if (!visible || !quotation) return;
    const defaults = (quotation.items ?? [])
      .filter((it) => it.approved !== false)
      .map((it) => it.id);
    setApprovedItemIds(defaults);
  }, [visible, quotation]);

  const toggleApprovedItem = (itemId: string, checked: boolean) => {
    setApprovedItemIds((prev) =>
      checked ? Array.from(new Set([...prev, itemId])) : prev.filter((id) => id !== itemId),
    );
  };

  const canSubmit =
    !!approvedByName.trim() &&
    (type !== "PARTIAL" || approvedItemIds.length > 0);

  const handleSave = async () => {
    if (!quotation || !approvedByName.trim()) return;
    setSubmitting(true);
    try {
      await quotationService.registerApproval(quotation.id, {
        type, channel, approvedByName,
        notes: notes || undefined,
        rejectionReason: rejectionReason || undefined,
        approvedItemIds: type === "PARTIAL" ? approvedItemIds : undefined,
      });
      reset();
      onSaved();
    } catch (err) {
      handleFormError(err, toast.current!);
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button label="Cancelar" outlined severity="secondary" onClick={() => { reset(); onHide(); }} disabled={submitting} />
      <Button
        label={type === "REJECTION" ? "Registrar rechazo" : "Registrar aprobación"}
        icon="pi pi-check"
        severity={type === "REJECTION" ? "danger" : "success"}
        onClick={handleSave}
        loading={submitting}
        disabled={!canSubmit}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      header={`Registrar respuesta — ${quotation?.quotationNumber ?? ""}`}
      style={{ width: "480px" }}
      breakpoints={{ "600px": "95vw" }}
      modal
      onHide={() => { reset(); onHide(); }}
      footer={footer}
    >
      <div className="p-fluid flex flex-column gap-3">
        <div>
          <label className="block mb-1 font-semibold text-sm">Decisión del cliente *</label>
          <Dropdown value={type} options={APPROVAL_TYPE_OPTIONS} onChange={e => setType(e.value)} />
        </div>
        <div>
          <label className="block mb-1 font-semibold text-sm">Canal de aprobación *</label>
          <Dropdown value={channel} options={CHANNEL_OPTIONS} onChange={e => setChannel(e.value)} />
        </div>
        <div>
          <label className="block mb-1 font-semibold text-sm">Nombre del aprobador *</label>
          <InputText
            value={approvedByName}
            onChange={e => setApprovedByName(e.target.value)}
            placeholder="Nombre de quien aprueba o rechaza"
          />
        </div>
        {type === "REJECTION" && (
          <div>
            <label className="block mb-1 font-semibold text-sm">Motivo de rechazo</label>
            <InputTextarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="¿Por qué rechazó el cliente?"
            />
          </div>
        )}
        {type === "PARTIAL" && quotation?.items?.length > 0 && (
          <div>
            <div className="flex align-items-center justify-content-between mb-2">
              <label className="block font-semibold text-sm m-0">Ítems aprobados por el cliente *</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  label="Todos"
                  text
                  size="small"
                  onClick={() => setApprovedItemIds(quotation.items.map((it) => it.id))}
                />
                <Button
                  type="button"
                  label="Ninguno"
                  text
                  size="small"
                  onClick={() => setApprovedItemIds([])}
                />
              </div>
            </div>
            <div className="border-1 border-200 border-round p-2" style={{ maxHeight: "220px", overflowY: "auto" }}>
              {quotation.items.map((item) => {
                const checked = approvedItemIds.includes(item.id);
                return (
                  <div key={item.id} className="flex align-items-start gap-2 py-2 border-bottom-1 border-100">
                    <Checkbox
                      inputId={`approved-item-${item.id}`}
                      checked={checked}
                      onChange={(e) => toggleApprovedItem(item.id, !!e.checked)}
                    />
                    <label htmlFor={`approved-item-${item.id}`} className="text-sm cursor-pointer" style={{ lineHeight: 1.35 }}>
                      <span className="font-medium">{item.description}</span>
                      <span className="text-600"> — Cant: {item.quantity} · Total: {item.total.toFixed(2)}</span>
                    </label>
                  </div>
                );
              })}
            </div>
            {approvedItemIds.length === 0 && (
              <small className="p-error block mt-2">Selecciona al menos un ítem para aprobación parcial.</small>
            )}
          </div>
        )}
        <div>
          <label className="block mb-1 font-semibold text-sm">Observaciones adicionales</label>
          <InputTextarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Notas del proceso de aprobación..."
          />
        </div>
      </div>
    </Dialog>
  );
}
