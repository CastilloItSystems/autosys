"use client";
import React from "react";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { Tag } from "primereact/tag";
import {
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPE_SEVERITY,
  Movement,
} from "@/app/api/inventory/movementService";

interface MovementDetailFormProps {
  movement: Movement | null;
  isLoading: boolean;
  onCancel: () => void;
  onSave?: (updatedMovement: Movement) => void;
  toast?: React.RefObject<any>;
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
  const isCancelled = movement?.notes?.includes("[CANCELADO]");
  console.log(movement);
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
        {isCancelled && (
          <div className="surface-section border-1 border-red-500 border-round p-3 mb-4 bg-red-50 text-red-700 flex align-items-center gap-3">
            <i className="pi pi-ban text-2xl"></i>
            <div>
              <span className="font-bold block">MOVIMIENTO CANCELADO</span>
              <span className="text-sm block">
                Este registro ha sido anulado administrativamente.
              </span>
              <span className="text-xs">
                Nota: El stock físico <strong>NO</strong> fue revertido
                automáticamente. Debe realizar un ajuste manual si requiere
                corregir el inventario.
              </span>
            </div>
          </div>
        )}

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

        {/* Análisis de Varianza - Solo si existe */}
        {movement.variance !== null &&
          movement.variance !== undefined &&
          movement.variance !== 0 && (
            <div className="mb-4">
              <label className="block text-900 font-medium mb-2 text-sm flex align-items-center gap-1">
                <i className="pi pi-exclamation-triangle text-orange-500 text-xs"></i>
                Análisis de Varianza de Conteo
              </label>
              <div className="surface-card border-1 surface-border border-round p-4">
                <div className="grid gap-3">
                  <div className="col-12 md:col-6">
                    <div
                      className="border-round p-3"
                      style={{ background: "var(--blue-50)" }}
                    >
                      <span className="text-xs text-500 uppercase font-semibold block mb-2">
                        Cantidad Esperada
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        {movement.snapshotQuantity ?? "—"}
                      </span>
                    </div>
                  </div>

                  <div className="col-12 md:col-6">
                    <div
                      className="border-round p-3"
                      style={{
                        background:
                          movement.variance > 0
                            ? "var(--orange-50)"
                            : "var(--red-50)",
                      }}
                    >
                      <span className="text-xs text-500 uppercase font-semibold block mb-2">
                        Varianza Detectada
                      </span>
                      <span
                        className="text-2xl font-bold"
                        style={{
                          color:
                            movement.variance > 0
                              ? "var(--orange-600)"
                              : "var(--red-600)",
                        }}
                      >
                        {movement.variance > 0 ? "+" : ""}
                        {movement.variance}
                      </span>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="surface-100 border-round p-3 text-sm text-600">
                      <i className="pi pi-info-circle mr-2"></i>
                      <strong>Interpretación:</strong> Se contaron{" "}
                      <span className="font-semibold">
                        {movement.variance > 0 ? "más" : "menos"} unidades
                      </span>{" "}
                      de las esperadas en el sistema.
                    </div>
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
          />
        </div>
      </form>
    </>
  );
}
