"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import movementService, {
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPE_SEVERITY,
  Movement,
} from "@/app/api/inventory/movementService";
import { handleFormError } from "@/utils/errorHandlers";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
};

/** Detecta UUID o CUID para mostrar "Sistema" en vez del id crudo */
const isSystemId = (str: string | undefined | null): boolean => {
  if (!str) return false;
  // UUID v4
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
  )
    return true;
  // CUID (c + 24-25 alfanuméricos)
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

const MovementDetailPage = () => {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const toast = useRef<Toast | null>(null);

  const [movement, setMovement] = useState<Movement | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);

  useEffect(() => {
    fetchMovement();
  }, [id]);

  const fetchMovement = async () => {
    try {
      setLoading(true);
      const res = await movementService.getById(id);
      setMovement(res.data);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el movimiento",
        life: 3000,
      });
      setTimeout(() => router.back(), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await movementService.cancel(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Movimiento cancelado",
        life: 3000,
      });
      await fetchMovement();
      setCancelDialog(false);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setCancelling(false);
    }
  };

  /* ── Loading / empty ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div
        className="flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <ProgressSpinner />
      </div>
    );
  }

  if (!movement) {
    return (
      <div className="card text-center py-8">
        <i className="pi pi-inbox text-5xl text-400 mb-3"></i>
        <p className="text-600">Movimiento no encontrado</p>
        <Button
          label="Volver"
          icon="pi pi-arrow-left"
          onClick={() => router.back()}
        />
      </div>
    );
  }

  /* ── Helpers ──────────────────────────────────────────────────── */
  const typeLabel = MOVEMENT_TYPE_LABELS[movement.type];
  const typeSeverity = MOVEMENT_TYPE_SEVERITY[movement.type];

  const fmtDate = (d: string | undefined | null, long = false) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("es-CL", {
      year: "numeric",
      month: long ? "long" : "short",
      day: "numeric",
      ...(long ? {} : { hour: "2-digit", minute: "2-digit" }),
    });
  };

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <>
      <Toast ref={toast} />

      {/* Header */}
      <div className="flex align-items-center gap-3 mb-5">
        <Button
          icon="pi pi-arrow-left"
          rounded
          text
          severity="secondary"
          onClick={() => router.back()}
        />
        <div className="flex-grow-1">
          <h2 className="m-0 text-2xl font-bold text-900">
            Movimiento #{movement.movementNumber}
          </h2>
          <span className="text-sm text-500">
            {fmtDate(movement.createdAt)}
          </span>
        </div>
        <Tag value={typeLabel} severity={typeSeverity} className="text-sm" />
      </div>

      {/* ── Resumen rápido ─────────────────────────────────────── */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="grid mb-4"
      >
        <div className="col-6 md:col-3">
          <div className="surface-card border-round p-3 h-full">
            <span className="text-xs text-500 font-semibold block mb-2">
              REFERENCIA
            </span>
            <span className="text-lg font-bold text-900">
              {movement.reference || "-"}
            </span>
          </div>
        </div>
        <div className="col-6 md:col-3">
          <div className="surface-card border-round p-3 h-full">
            <span className="text-xs text-500 font-semibold block mb-2">
              FECHA MOVIMIENTO
            </span>
            <span className="text-lg font-bold text-900">
              {fmtDate(movement.movementDate, true)}
            </span>
          </div>
        </div>
        <div className="col-6 md:col-3">
          <div className="surface-card border-round p-3 h-full">
            <span className="text-xs text-500 font-semibold block mb-2">
              COSTO UNITARIO
            </span>
            <span className="text-lg font-bold text-900">
              {formatCurrency(movement.unitCost)}
            </span>
          </div>
        </div>
        <div className="col-6 md:col-3">
          <div className="surface-card border-round p-3 h-full">
            <span className="text-xs text-500 font-semibold block mb-2">
              COSTO TOTAL
            </span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(movement.totalCost)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Artículo ───────────────────────────────────────────── */}
      {movement.item && (
        <motion.div
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="surface-card border-round p-4 mb-4"
        >
          <div className="flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <span className="text-xs text-500 font-semibold block mb-1">
                ARTÍCULO
              </span>
              <span className="text-xl font-bold text-900 block">
                {movement.item.name}
              </span>
              <span className="text-sm text-500">SKU: {movement.item.sku}</span>
            </div>
            <div className="text-center">
              <span className="text-xs text-500 font-semibold block mb-1">
                CANTIDAD
              </span>
              <span className="text-3xl font-bold text-primary">
                {movement.quantity.toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Flujo de almacenes ─────────────────────────────────── */}
      {(movement.warehouseFrom || movement.warehouseTo) && (
        <motion.div
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="surface-card border-round p-4 mb-4"
        >
          <span className="text-xs text-500 font-semibold block mb-3">
            FLUJO DE ALMACENES
          </span>

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
                    className="text-xs font-semibold uppercase flex align-items-center gap-1 mb-2"
                    style={{ color: "var(--blue-700)" }}
                  >
                    <i className="pi pi-sign-out text-xs"></i> Origen
                  </span>
                  <span className="text-lg font-bold text-900 block">
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
                    className="text-xs font-semibold uppercase flex align-items-center gap-1 mb-2"
                    style={{ color: "var(--green-700)" }}
                  >
                    <i className="pi pi-sign-in text-xs"></i> Destino
                  </span>
                  <span className="text-lg font-bold text-900 block">
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
        </motion.div>
      )}

      {/* ── Notas ──────────────────────────────────────────────── */}
      {movement.notes && (
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="surface-card border-round p-4 mb-4"
          style={{ borderLeft: "4px solid var(--orange-400)" }}
        >
          <span className="text-xs text-500 font-semibold flex align-items-center gap-1 mb-2">
            <i className="pi pi-file-edit text-orange-400 text-xs"></i> NOTAS
          </span>
          <p className="m-0 text-900 line-height-3">{movement.notes}</p>
        </motion.div>
      )}

      {/* ── Auditoría ──────────────────────────────────────────── */}
      <motion.div
        custom={4}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="surface-card border-round p-4 mb-4"
      >
        <span className="text-xs text-500 font-semibold flex align-items-center gap-1 mb-3">
          <i className="pi pi-shield text-primary text-xs"></i> AUDITORÍA
        </span>
        <div className="grid">
          <div className="col-12 md:col-6 lg:col-3">
            <span className="text-xs text-500 block mb-1">Creado por</span>
            <span className="text-sm font-semibold text-900">
              {formatUser(movement.createdBy)}
            </span>
          </div>
          <div className="col-12 md:col-6 lg:col-3">
            <span className="text-xs text-500 block mb-1">
              Fecha de registro
            </span>
            <span className="text-sm text-900">
              {fmtDate(movement.createdAt)}
            </span>
          </div>
          {movement.approvedBy && (
            <>
              <div className="col-12 md:col-6 lg:col-3">
                <span className="text-xs text-500 block mb-1">
                  Aprobado por
                </span>
                <span className="text-sm font-semibold text-900">
                  {formatUser(movement.approvedBy)}
                </span>
              </div>
              <div className="col-12 md:col-6 lg:col-3">
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
      </motion.div>

      {/* ── Acciones ───────────────────────────────────────────── */}
      <motion.div
        custom={5}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex gap-2 justify-content-end mt-4"
      >
        <Button
          label="Volver"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          onClick={() => router.back()}
        />
        <Button
          label="Cancelar Movimiento"
          icon="pi pi-times"
          severity="danger"
          onClick={() => setCancelDialog(true)}
        />
      </motion.div>

      {/* Cancel dialog */}
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
              onClick={handleCancel}
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
};

export default MovementDetailPage;
