"use client";
import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { handleFormError } from "@/utils/errorHandlers";
import { warrantyService } from "@/app/api/workshop";
import type { WorkshopWarranty, WarrantyStatus } from "@/libs/interfaces/workshop";
import {
  WarrantyStatusBadge,
  WARRANTY_STATUS_OPTIONS,
  WARRANTY_STATUS_LABELS,
} from "@/components/workshop/shared/WarrantyStatusBadge";

// Valid transitions per status
const VALID_TRANSITIONS: Record<WarrantyStatus, WarrantyStatus[]> = {
  OPEN: ["IN_PROGRESS", "REJECTED", "CLOSED"],
  IN_PROGRESS: ["RESOLVED", "REJECTED", "OPEN"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  REJECTED: ["OPEN"],
  CLOSED: [],
};

interface Props {
  visible: boolean;
  warranty: WorkshopWarranty | null;
  onHide: () => void;
  onSaved: () => void | Promise<void>;
  toast: React.RefObject<any>;
}

export default function WarrantyStatusDialog({ visible, warranty, onHide, onSaved, toast }: Props) {
  const [newStatus, setNewStatus] = useState<WarrantyStatus | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && warranty) {
      setNewStatus(warranty.status);
    }
  }, [visible, warranty]);

  const handleSave = async () => {
    if (!warranty || !newStatus) return;
    setSaving(true);
    try {
      await warrantyService.updateStatus(warranty.id, { status: newStatus });
      await onSaved();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSaving(false);
    }
  };

  const availableOptions = warranty
    ? WARRANTY_STATUS_OPTIONS.filter(
        (opt) => VALID_TRANSITIONS[warranty.status].includes(opt.value as WarrantyStatus)
      )
    : [];

  return (
    <Dialog
      visible={visible}
      style={{ width: "420px" }}
      breakpoints={{ "600px": "90vw" }}
      header={
        <div className="mb-2">
          <div className="border-bottom-2 border-primary pb-2">
            <h2 className="text-xl font-bold text-900 mb-2 flex align-items-center gap-2">
              <i className="pi pi-arrow-right-arrow-left text-primary text-2xl" />
              Cambiar Estado de Garantía
            </h2>
          </div>
        </div>
      }
      modal
      onHide={onHide}
      footer={
        <div className="flex justify-content-end gap-2">
          <Button label="Cancelar" icon="pi pi-times" outlined onClick={onHide} disabled={saving} />
          <Button
            label="Guardar"
            icon="pi pi-check"
            onClick={handleSave}
            loading={saving}
            disabled={!newStatus || newStatus === warranty?.status}
          />
        </div>
      }
    >
      {warranty && (
        <div className="flex flex-column gap-4 pt-2">
          <div className="flex align-items-center gap-3">
            <span className="text-600 font-medium" style={{ width: "5rem" }}>Actual:</span>
            <WarrantyStatusBadge status={warranty.status} />
          </div>

          <div className="flex align-items-center gap-3">
            <span className="text-600 font-medium" style={{ width: "5rem" }}>Folio:</span>
            <span className="font-bold text-primary">{warranty.warrantyNumber}</span>
          </div>

          <div className="flex flex-column gap-2">
            <label className="text-900 font-medium">
              Nuevo estado <span className="text-red-500">*</span>
            </label>
            {availableOptions.length > 0 ? (
              <Dropdown
                value={newStatus}
                options={availableOptions}
                onChange={(e) => setNewStatus(e.value)}
                placeholder="Seleccionar estado"
              />
            ) : (
              <div className="p-3 border-round surface-100 text-sm text-600 flex align-items-center gap-2">
                <i className="pi pi-lock text-orange-500" />
                <span>Esta garantía está cerrada y no puede cambiar de estado.</span>
              </div>
            )}
          </div>

          {newStatus && newStatus !== warranty.status && (
            <div className="p-3 border-round surface-100 flex align-items-center gap-2 text-sm text-600">
              <i className="pi pi-info-circle text-primary" />
              <span>
                La garantía pasará de{" "}
                <b>{WARRANTY_STATUS_LABELS[warranty.status]}</b> a{" "}
                <b>{WARRANTY_STATUS_LABELS[newStatus]}</b>.
              </span>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
