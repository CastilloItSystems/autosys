"use client";
import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { handleFormError } from "@/utils/errorHandlers";
import { serviceOrderService } from "@/app/api/workshop";
import type { ServiceOrder, ServiceOrderStatus } from "@/libs/interfaces/workshop";
import {
  ServiceOrderStatusBadge,
  SO_STATUS_OPTIONS,
  SO_STATUS_LABELS,
} from "@/components/workshop/shared/ServiceOrderStatusBadge";

interface Props {
  visible: boolean;
  order: ServiceOrder | null;
  onHide: () => void;
  onSaved: () => void | Promise<void>;
  toast: React.RefObject<any>;
}

export default function ServiceOrderStatusDialog({ visible, order, onHide, onSaved, toast }: Props) {
  const [newStatus, setNewStatus] = useState<ServiceOrderStatus | null>(null);
  const [mileageOut, setMileageOut] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && order) {
      setNewStatus(order.status);
      setMileageOut(order.mileageOut ?? null);
    }
  }, [visible, order]);

  const handleSave = async () => {
    if (!order || !newStatus) return;
    setSaving(true);
    try {
      await serviceOrderService.updateStatus(order.id, {
        status: newStatus,
        ...(mileageOut != null ? { mileageOut } : {}),
      });
      await onSaved();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSaving(false);
    }
  };

  const requiresMileage = newStatus === "DELIVERED" || newStatus === "CLOSED";

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
              Cambiar Estado
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
            disabled={!newStatus || newStatus === order?.status}
          />
        </div>
      }
    >
      {order && (
        <div className="flex flex-column gap-4 pt-2">
          <div className="flex align-items-center gap-3">
            <span className="text-600 font-medium w-6rem">Actual:</span>
            <ServiceOrderStatusBadge status={order.status} />
          </div>

          <div className="flex flex-column gap-2">
            <label className="text-900 font-medium">
              Nuevo estado <span className="text-red-500">*</span>
            </label>
            <Dropdown
              value={newStatus}
              options={SO_STATUS_OPTIONS}
              onChange={(e) => setNewStatus(e.value)}
              placeholder="Seleccionar estado"
            />
          </div>

          {requiresMileage && (
            <div className="flex flex-column gap-2">
              <label className="text-900 font-medium">
                Kilometraje de salida
              </label>
              <InputNumber
                value={mileageOut}
                onValueChange={(e) => setMileageOut(e.value ?? null)}
                min={0}
                placeholder="Km al momento de entrega"
              />
            </div>
          )}

          {newStatus && newStatus !== order.status && (
            <div className="p-3 border-round surface-100 flex align-items-center gap-2 text-sm text-600">
              <i className="pi pi-info-circle text-primary" />
              <span>
                La orden pasará de{" "}
                <b>{SO_STATUS_LABELS[order.status]}</b> a{" "}
                <b>{SO_STATUS_LABELS[newStatus]}</b>.
              </span>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
