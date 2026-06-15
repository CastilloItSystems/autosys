"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Checkbox } from "primereact/checkbox";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { handleFormError } from "@/utils/errorHandlers";
import deliveryReturnedPartService from "../services/deliveryReturnedPartService";
import type {
  DeliveryReturnedPart,
  ReturnedPartCondition,
} from "../interfaces/deliveryReturnedPart.interface";

const CONDITION_OPTIONS: { label: string; value: ReturnedPartCondition }[] = [
  { label: "Completa", value: "WHOLE" },
  { label: "Dañada", value: "DAMAGED" },
  { label: "En piezas", value: "IN_PIECES" },
  { label: "Reemplazada", value: "REPLACED" },
  { label: "Otra", value: "OTHER" },
];

export default function ReturnedPartsPanel({
  deliveryId,
  substitutedPartsReturned,
  onMarkedComplete,
}: {
  deliveryId: string;
  substitutedPartsReturned?: boolean;
  onMarkedComplete?: () => void;
}) {
  const toast = useRef<Toast>(null);
  const [parts, setParts] = useState<DeliveryReturnedPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState<number | null>(1);
  const [cond, setCond] = useState<ReturnedPartCondition>("WHOLE");
  const [ack, setAck] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await deliveryReturnedPartService.listByDelivery(deliveryId);
      setParts(list);
    } catch (e) {
      handleFormError(e, toast);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deliveryId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryId]);

  const addPart = async () => {
    if (!desc.trim()) return;
    try {
      await deliveryReturnedPartService.create({
        deliveryId,
        description: desc,
        quantity: qty ?? 1,
        condition: cond,
        clientAcknowledged: ack,
      });
      setDesc("");
      setQty(1);
      setCond("WHOLE");
      load();
    } catch (e) {
      handleFormError(e, toast);
    }
  };

  const remove = async (id: string) => {
    try {
      await deliveryReturnedPartService.delete(id);
      load();
    } catch (e) {
      handleFormError(e, toast);
    }
  };

  const toggleAck = async (p: DeliveryReturnedPart) => {
    try {
      await deliveryReturnedPartService.update(p.id, {
        clientAcknowledged: !p.clientAcknowledged,
      });
      load();
    } catch (e) {
      handleFormError(e, toast);
    }
  };

  const markComplete = async () => {
    try {
      await deliveryReturnedPartService.markDeliveryPartsReturned(deliveryId);
      toast.current?.show({
        severity: "success",
        summary: "Marcado",
        detail: "Devolución de repuestos sustituidos confirmada",
        life: 3000,
      });
      onMarkedComplete?.();
    } catch (e) {
      handleFormError(e, toast);
    }
  };

  const acknowledgedCount = parts.filter((p) => p.clientAcknowledged).length;

  return (
    <div className="surface-100 p-3 border-round">
      <Toast ref={toast} />
      <div className="flex justify-content-between align-items-center mb-2">
        <h5 className="m-0">Repuestos Sustituidos — Devolución al Cliente (§23.3)</h5>
        <Tag
          value={substitutedPartsReturned ? "Cerrado" : "Pendiente"}
          severity={substitutedPartsReturned ? "success" : "warning"}
        />
      </div>

      <small className="block text-color-secondary mb-2">
        SIEMPRE se devuelven al cliente las piezas sustituidas. Mínimo 1 confirmada para
        cerrar.
      </small>

      <div className="flex flex-column gap-2 mb-3">
        {parts.map((p) => (
          <div
            key={p.id}
            className="flex justify-content-between align-items-center surface-0 p-2 border-round"
          >
            <div className="flex-1">
              <strong>{p.description}</strong>{" "}
              <span className="text-color-secondary">x{Number(p.quantity)}</span>
              <Tag
                value={CONDITION_OPTIONS.find((c) => c.value === p.condition)?.label}
                className="ml-2"
                severity="info"
              />
            </div>
            <Button
              label={p.clientAcknowledged ? "Conf." : "Pend."}
              size="small"
              severity={p.clientAcknowledged ? "success" : "warning"}
              outlined={!p.clientAcknowledged}
              onClick={() => toggleAck(p)}
              className="mr-2"
            />
            <Button
              icon="pi pi-trash"
              rounded
              text
              size="small"
              severity="danger"
              onClick={() => remove(p.id)}
            />
          </div>
        ))}
        {parts.length === 0 && (
          <small className="text-color-secondary">Sin repuestos registrados</small>
        )}
      </div>

      <div className="grid mb-2">
        <div className="col-5">
          <InputText
            placeholder="Descripción pieza sustituida"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="col-2">
          <InputNumber
            placeholder="Cant"
            value={qty}
            onValueChange={(e) => setQty(e.value ?? 1)}
            min={0.01}
            minFractionDigits={0}
            maxFractionDigits={2}
            className="w-full"
          />
        </div>
        <div className="col-3">
          <Dropdown
            value={cond}
            onChange={(e) => setCond(e.value)}
            options={CONDITION_OPTIONS}
            className="w-full"
          />
        </div>
        <div className="col-2">
          <Button
            label="Agregar"
            icon="pi pi-plus"
            size="small"
            onClick={addPart}
            disabled={!desc.trim() || loading}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex align-items-center mb-2">
        <Checkbox
          inputId="ack-default"
          checked={ack}
          onChange={(e) => setAck(!!e.checked)}
        />
        <label htmlFor="ack-default" className="ml-2 text-sm">
          Cliente confirma recibido por defecto al agregar
        </label>
      </div>

      {!substitutedPartsReturned && (
        <Button
          label="Marcar entrega de repuestos completada"
          icon="pi pi-check-circle"
          severity="success"
          onClick={markComplete}
          disabled={acknowledgedCount === 0}
          className="w-full"
        />
      )}
    </div>
  );
}
