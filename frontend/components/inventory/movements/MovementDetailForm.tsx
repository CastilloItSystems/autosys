"use client";
import React, { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import {
  cancelMovement,
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPE_SEVERITY,
  Movement,
} from "@/app/api/inventory/movementService";
import { handleFormError } from "@/utils/errorHandlers";

interface MovementDetailFormProps {
  movement: Movement | null;
  isLoading: boolean;
  onCancel: () => void;
  onSave: (updatedMovement: Movement) => void;
  toast: React.RefObject<any>;
}

/* ── Helpers ───────────────────────────────────────────────── */
const isSystemId = (str: string | undefined | null): boolean => {
  if (!str) return false;
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
  )
    return true;
  if (/^c[a-z0-9]{20,30}$/i.test(str)) return true;
  return false;
};

const formatUser = (id: string | undefined | null) =>
  !id ? "-" : isSystemId(id) ? "Sistema" : id;

const formatCurrency = (v: number | null | undefined) =>
  v == null
    ? "-"
    : new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
      }).format(v);

const fmtDate = (d: string | undefined | null, long = false) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("es-CL", {
    year: "numeric",
    month: long ? "long" : "short",
    day: "numeric",
    ...(long ? {} : { hour: "2-digit", minute: "2-digit" }),
  });
};

export default function MovementDetailForm({
  movement,
  isLoading,
  onCancel,
  onSave,
  toast,
}: MovementDetailFormProps) {
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  /**
   * Maneja la cancelación del movimiento
   */
  const handleCancelMovement = async () => {
    if (!movement) return;
    setCancelling(true);
    try {
      const res = await cancelMovement(movement.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Movimiento cancelado",
        life: 3000,
      });
      setCancelDialog(false);
      onSave(res.data);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-column align-items-center justify-content-center p-4">
        <ProgressSpinner
          style={{ width: "40px", height: "40px" }}
          strokeWidth="4"
          fill="var(--surface-ground)"
          animationDuration=".5s"
        />
        <p className="mt-3 text-600 font-medium">Cargando detalles...</p>
      </div>
    );
  }

  if (!movement) {
    return (
      <div className="text-center py-4">
        <i className="pi pi-inbox text-4xl text-400 mb-2"></i>
        <p className="text-600">Movimiento no encontrado</p>
      </div>
    );
  }

  /* ── Helpers ──────────────────────────────────────────────── */
  const typeLabel = MOVEMENT_TYPE_LABELS[movement.type];
  const typeSeverity = MOVEMENT_TYPE_SEVERITY[movement.type];

  return (
    <>
      <form className="p-fluid">
        {/* Resumen Rápido - KPIs */}
        <div className="grid mb-4">
          <div className="col-6 md:col-3">
            <label className="block text-900 font-medium mb-2 text-sm">
              Referencia
            </label>
            <div className="surface-100 border-round p-3">
              <span className="font-bold text-900">
                {movement.reference || "-"}
              </span>
            </div>
          </div>

          <div className="col-6 md:col-3">
            <label className="block text-900 font-medium mb-2 text-sm">
              Fecha Movimiento
            </label>
            <div className="surface-100 border-round p-3">
              <span className="font-bold text-900">
                {fmtDate(movement.movementDate, true)}
              </span>
            </div>
          </div>

          <div className="col-6 md:col-3">
            <label className="block text-900 font-medium mb-2 text-sm">
              Costo Unitario
            </label>
            <div className="surface-100 border-round p-3">
              <span className="font-bold text-900">
                {formatCurrency(movement.unitCost)}
              </span>
            </div>
          </div>

          <div className="col-6 md:col-3">
            <label className="block text-900 font-medium mb-2 text-sm">
              Costo Total
            </label>
            <div className="surface-100 border-round p-3">
              <span className="font-bold text-primary">
                {formatCurrency(movement.totalCost)}
              </span>
            </div>
          </div>
        </div>

        {/* Artículo + Cantidad */}
        {movement.item && (
          <div className="mb-4">
            <label className="block text-900 font-medium mb-2 text-sm">
              Artículo
            </label>
            <div className="surface-card border-1 surface-border border-round p-3">
              <div className="flex align-items-center justify-content-between flex-wrap gap-3">
                <div>
                  <span className="text-lg font-bold text-900 block">
                    {movement.item.name}
                  </span>
                  <span className="text-sm text-500">
                    SKU: {movement.item.sku}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-xs text-500 font-semibold block mb-1">
                    CANTIDAD
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {movement.quantity.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Flujo de Almacenes */}
        {(movement.warehouseFrom || movement.warehouseTo) && (
          <div className="mb-4">
            <label className="block text-900 font-medium mb-2 text-sm">
              Flujo de Almacenes
            </label>
            <div className="surface-card border-1 surface-border border-round p-3">
              <div className="flex flex-column md:flex-row align-items-stretch gap-3">
                {/* Origen */}
                <div className="flex-1">
                  {movement.warehouseFrom ? (
                    <div
                      className="border-round p-3 h-full"
                      style={{
                        background: "var(--blue-50)",
                        borderLeft: "4px solid var(--blue-500)",
                      }}
                    >
                      <span
                        className="text-xs font-semibold uppercase block mb-1"
                        style={{ color: "var(--blue-700)" }}
                      >
                        <i className="pi pi-sign-out text-xs mr-1"></i>Origen
                      </span>
                      <span className="font-bold text-900 block">
                        {movement.warehouseFrom.name}
                      </span>
                      <span className="text-xs text-500">
                        {movement.warehouseFrom.code}
                      </span>
                    </div>
                  ) : (
                    <div className="border-round p-3 h-full surface-100 text-center">
                      <span className="text-500 text-sm">No aplica</span>
                    </div>
                  )}
                </div>

                {/* Flecha */}
                <div className="flex align-items-center justify-content-center">
                  <i className="pi pi-arrow-right text-xl text-primary hidden md:block"></i>
                  <i className="pi pi-arrow-down text-xl text-primary md:hidden"></i>
                </div>

                {/* Destino */}
                <div className="flex-1">
                  {movement.warehouseTo ? (
                    <div
                      className="border-round p-3 h-full"
                      style={{
                        background: "var(--green-50)",
                        borderLeft: "4px solid var(--green-500)",
                      }}
                    >
                      <span
                        className="text-xs font-semibold uppercase block mb-1"
                        style={{ color: "var(--green-700)" }}
                      >
                        <i className="pi pi-sign-in text-xs mr-1"></i>Destino
                      </span>
                      <span className="font-bold text-900 block">
                        {movement.warehouseTo.name}
                      </span>
                      <span className="text-xs text-500">
                        {movement.warehouseTo.code}
                      </span>
                    </div>
                  ) : (
                    <div className="border-round p-3 h-full surface-100 text-center">
                      <span className="text-500 text-sm">No aplica</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notas */}
        {movement.notes && (
          <div className="mb-4">
            <label className="block text-900 font-medium mb-2 text-sm">
              Notas
            </label>
            <div
              className="border-round p-3"
              style={{
                background: "var(--orange-50)",
                borderLeft: "4px solid var(--orange-400)",
              }}
            >
              <p className="m-0 text-900 line-height-3">{movement.notes}</p>
            </div>
          </div>
        )}

        {/* Auditoría */}
        <div className="mb-4">
          <label className="block text-900 font-medium mb-2 text-sm flex align-items-center gap-1">
            <i className="pi pi-shield text-primary text-xs"></i> Auditoría
          </label>
          <div className="surface-100 border-round p-3">
            <div className="grid">
              <div className="col-6 md:col-3">
                <span className="text-xs text-500 block mb-1">Creado por</span>
                <span className="text-sm font-semibold text-900">
                  {formatUser(movement.createdBy)}
                </span>
              </div>
              <div className="col-6 md:col-3">
                <span className="text-xs text-500 block mb-1">
                  Fecha registro
                </span>
                <span className="text-sm text-900">
                  {fmtDate(movement.createdAt)}
                </span>
              </div>
              {movement.approvedBy && (
                <>
                  <div className="col-6 md:col-3">
                    <span className="text-xs text-500 block mb-1">
                      Aprobado por
                    </span>
                    <span className="text-sm font-semibold text-900">
                      {formatUser(movement.approvedBy)}
                    </span>
                  </div>
                  <div className="col-6 md:col-3">
                    <span className="text-xs text-500 block mb-1">
                      Fecha aprobación
                    </span>
                    <span className="text-sm text-900">
                      {fmtDate(movement.approvedAt)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label="Cerrar"
            icon="pi pi-times"
            severity="secondary"
            outlined
            onClick={onCancel}
            type="button"
            disabled={cancelling}
          />
          <Button
            label="Cancelar Movimiento"
            icon="pi pi-ban"
            severity="danger"
            onClick={() => setCancelDialog(true)}
            type="button"
            disabled={cancelling}
          />
        </div>
      </form>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        visible={cancelDialog}
        style={{ width: "420px" }}
        header="Cancelar Movimiento"
        modal
        footer={
          <>
            <Button
              label="No"
              icon="pi pi-times"
              text
              onClick={() => setCancelDialog(false)}
              disabled={cancelling}
            />
            <Button
              label="Sí, Cancelar"
              icon={cancelling ? "pi pi-spin pi-spinner" : "pi pi-check"}
              severity="danger"
              onClick={handleCancelMovement}
              disabled={cancelling}
            />
          </>
        }
        onHide={() => setCancelDialog(false)}
      >
        <div className="flex align-items-center gap-3">
          <i
            className="pi pi-exclamation-triangle text-3xl"
            style={{ color: "#ff9800" }}
          />
          <span>
            ¿Estás seguro de que deseas cancelar este movimiento? Esta acción no
            se puede deshacer.
          </span>
        </div>
      </Dialog>
    </>
  );
}
