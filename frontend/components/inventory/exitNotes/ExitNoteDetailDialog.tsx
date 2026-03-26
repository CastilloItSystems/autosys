"use client";
import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Checkbox } from "primereact/checkbox";
import { InputTextarea } from "primereact/inputtextarea";
import {
  ExitNote,
  ExitNoteStatus,
  ExitNoteItem,
  EXIT_NOTE_STATUS_CONFIG,
  EXIT_NOTE_TYPE_CONFIG,
} from "@/libs/interfaces/inventory/exitNote.interface";
import { Warehouse } from "@/app/api/inventory/warehouseService";
import exitNoteService from "@/app/api/inventory/exitNoteService";
import { Toast } from "primereact/toast";
import { handleFormError } from "@/utils/errorHandlers";
import ExitNoteStepper from "./ExitNoteStepper";

interface ExitNoteDetailDialogProps {
  visible: boolean;
  onHide: () => void;
  exitNote: ExitNote | null;
  onUpdate: () => void;
  toast: React.RefObject<Toast>;
  warehouses: Warehouse[];
}

const ExitNoteDetailDialog = ({
  visible,
  onHide,
  exitNote,
  onUpdate,
  toast,
  warehouses,
}: ExitNoteDetailDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [pickedItems, setPickedItems] = useState<Record<string, boolean>>({});
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    if (exitNote) setPickedItems({});
  }, [exitNote]);

  if (!exitNote) return null;

  const noteItems = exitNote.items || [];
  const statusCfg = EXIT_NOTE_STATUS_CONFIG[exitNote.status];
  const typeCfg = EXIT_NOTE_TYPE_CONFIG[exitNote.type];

  /* ── Actions ── */
  const handleStartPreparing = async () => {
    setLoading(true);
    try {
      await exitNoteService.start(exitNote.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Preparación iniciada",
        life: 3000,
      });
      onUpdate();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReady = async () => {
    setLoading(true);
    try {
      await exitNoteService.markReady(exitNote.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Marcado como listo para entrega",
        life: 3000,
      });
      onUpdate();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  const handleDeliver = async () => {
    setLoading(true);
    try {
      await exitNoteService.deliver(exitNote.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Entrega registrada exitosamente",
        life: 3000,
      });
      onUpdate();
      onHide();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    setLoading(true);
    try {
      await exitNoteService.cancel(exitNote.id, cancelReason || "");
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Nota ${exitNote.exitNoteNumber} cancelada`,
        life: 3000,
      });
      setCancelDialog(false);
      onUpdate();
      onHide();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  /* ── Footer ── */
  const renderFooter = () => {
    if (exitNote.status === ExitNoteStatus.CANCELLED) {
      return (
        <div className="flex w-full justify-content-center mb-4">
          <Tag
            severity="danger"
            value="NOTA CANCELADA"
            className="text-sm px-4 py-2"
          />
        </div>
      );
    }
    if (exitNote.status === ExitNoteStatus.DELIVERED) {
      return (
        <div className="flex w-full justify-content-center mb-4">
          <Tag
            severity="success"
            value="ENTREGADA"
            className="text-sm px-4 py-2"
          />
        </div>
      );
    }

    const allPicked = noteItems.every((item) => pickedItems[item.id]);

    return (
      <div className="flex w-full gap-2 mb-4">
        <Button
          label="Cancelar Nota"
          icon="pi pi-ban"
          severity="danger"
          outlined
          onClick={() => {
            setCancelReason("");
            setCancelDialog(true);
          }}
          disabled={loading}
          type="button"
          className="flex-1"
        />
        {exitNote.status === ExitNoteStatus.PENDING && (
          <Button
            label="Iniciar Preparación"
            icon="pi pi-play"
            onClick={handleStartPreparing}
            loading={loading}
            type="button"
            className="flex-1"
          />
        )}
        {exitNote.status === ExitNoteStatus.IN_PROGRESS && (
          <Button
            label="Marcar como Lista"
            icon="pi pi-check"
            severity="warning"
            onClick={handleMarkAsReady}
            loading={loading}
            disabled={!allPicked && noteItems.length > 0}
            tooltip={
              !allPicked
                ? "Debe confirmar el picking de todos los items"
                : undefined
            }
            tooltipOptions={{ showOnDisabled: true }}
            type="button"
            className="flex-1"
          />
        )}
        {exitNote.status === ExitNoteStatus.READY && (
          <Button
            label="Registrar Entrega"
            icon="pi pi-send"
            onClick={handleDeliver}
            loading={loading}
            type="button"
            className="flex-1"
          />
        )}
      </div>
    );
  };

  return (
    <>
      <Dialog
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-external-link mr-3 text-primary text-3xl"></i>
                Nota de Salida: {exitNote.exitNoteNumber}
              </h2>
            </div>
          </div>
        }
        visible={visible}
        style={{ width: "75vw" }}
        breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
        maximizable
        onHide={onHide}
        footer={renderFooter()}
        modal
      >
        {/* ── Stepper ── */}
        <div className="mb-4">
          <ExitNoteStepper currentStatus={exitNote.status} />
        </div>

        {/* ── Info cards ── */}
        <div className="grid mb-3">
          <div className="col-12 md:col-6 lg:col-3">
            <div className="surface-100 border-round p-3 h-full">
              <div className="flex align-items-center gap-2 mb-2">
                <i className="pi pi-tag text-primary text-lg" />
                <span className="text-500 text-sm font-medium">Tipo</span>
              </div>
              <div className="flex align-items-center gap-2 font-bold text-900 text-lg mb-1">
                <i className={typeCfg.icon} />
                <span>{typeCfg.label}</span>
              </div>
              <div className="mt-1">
                <Tag
                  value={statusCfg.label}
                  severity={statusCfg.severity}
                  icon={statusCfg.icon}
                />
              </div>
            </div>
          </div>

          <div className="col-12 md:col-6 lg:col-3">
            <div className="surface-100 border-round p-3 h-full">
              <div className="flex align-items-center gap-2 mb-2">
                <i className="pi pi-building text-orange-500 text-lg" />
                <span className="text-500 text-sm font-medium">Almacén</span>
              </div>
              <div className="font-bold text-900 text-lg">
                {exitNote.warehouse?.name ||
                  warehouses.find((w) => w.id === exitNote.warehouseId)?.name ||
                  "—"}
              </div>
            </div>
          </div>

          <div className="col-12 md:col-6 lg:col-3">
            <div className="surface-100 border-round p-3 h-full">
              <div className="flex align-items-center gap-2 mb-2">
                <i className="pi pi-user text-green-500 text-lg" />
                <span className="text-500 text-sm font-medium">
                  Destinatario
                </span>
              </div>
              <div className="font-bold text-900 text-lg">
                {exitNote.recipientName || "—"}
              </div>
              {exitNote.recipientPhone && (
                <div className="text-500 text-sm mt-1">
                  <i className="pi pi-phone text-xs mr-1" />
                  {exitNote.recipientPhone}
                </div>
              )}
            </div>
          </div>

          <div className="col-12 md:col-6 lg:col-3">
            <div className="surface-100 border-round p-3 h-full">
              <div className="flex align-items-center gap-2 mb-2">
                <i className="pi pi-list text-purple-500 text-lg" />
                <span className="text-500 text-sm font-medium">Artículos</span>
              </div>
              <div className="font-bold text-primary text-xl">
                {noteItems.length}
              </div>
              <div className="text-500 text-sm">
                {noteItems.reduce((sum, i) => sum + i.quantity, 0)} unidades
                total
              </div>
            </div>
          </div>
        </div>

        {/* ── Additional info ── */}
        {(exitNote.reference || exitNote.reason || exitNote.notes) && (
          <div className="grid mb-3">
            {exitNote.reference && (
              <div className="col-12 md:col-6">
                <div className="surface-100 border-round p-3">
                  <span className="text-500 text-sm font-medium">
                    Referencia
                  </span>
                  <div className="text-900 mt-1">{exitNote.reference}</div>
                </div>
              </div>
            )}
            {exitNote.reason && (
              <div className="col-12 md:col-6">
                <div className="surface-100 border-round p-3">
                  <span className="text-500 text-sm font-medium">Motivo</span>
                  <div className="text-900 mt-1">{exitNote.reason}</div>
                </div>
              </div>
            )}
            {exitNote.notes && (
              <div className="col-12">
                <div className="surface-100 border-round p-3">
                  <span className="text-500 text-sm font-medium">Notas</span>
                  <div className="text-900 mt-1">{exitNote.notes}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Items table ── */}
        <div
          style={{
            border: "1px solid var(--surface-300)",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 8px",
              backgroundColor: "var(--surface-100)",
              borderBottom: "2px solid var(--surface-300)",
            }}
          >
            {[
              { label: "Artículo", style: { flex: "1 1 0", minWidth: 0 } },
              {
                label: "Cant.",
                style: { width: "5rem", textAlign: "center" as const },
              },
              {
                label: "Ubicación",
                style: { width: "7rem", textAlign: "center" as const },
              },
              {
                label: "Lote",
                style: { width: "7rem", textAlign: "center" as const },
              },
              { label: "Notas", style: { width: "10rem" } },
              ...(exitNote.status === ExitNoteStatus.IN_PROGRESS
                ? [
                    {
                      label: "Picking",
                      style: { width: "5rem", textAlign: "center" as const },
                    },
                  ]
                : []),
            ].map((col, i) => (
              <div
                key={i}
                style={{
                  ...col.style,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "var(--text-color-secondary)",
                  userSelect: "none",
                  flexShrink: 0,
                }}
              >
                {col.label}
              </div>
            ))}
          </div>

          {noteItems.length === 0 ? (
            <div
              className="text-center py-4 text-500"
              style={{ fontSize: "0.85rem" }}
            >
              <i className="pi pi-inbox mr-2" />
              No hay artículos en esta nota
            </div>
          ) : (
            noteItems.map((line) => (
              <div
                key={line.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 8px",
                  borderBottom: "1px solid var(--surface-200)",
                }}
              >
                <div style={{ flex: "1 1 0", minWidth: 0 }}>
                  <div
                    className="font-medium text-900"
                    style={{ fontSize: "0.8rem" }}
                  >
                    {line.item?.sku || "—"}
                  </div>
                  <div
                    className="text-500"
                    style={{
                      fontSize: "0.7rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={line.itemName || line.item?.name || ""}
                  >
                    {line.itemName || line.item?.name || "Sin nombre"}
                  </div>
                </div>
                <div
                  style={{
                    width: "5rem",
                    textAlign: "center",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  <Tag
                    value={line.quantity.toString()}
                    severity="info"
                    className="text-sm"
                  />
                </div>
                <div
                  style={{
                    width: "7rem",
                    textAlign: "center",
                    fontSize: "0.8rem",
                    flexShrink: 0,
                  }}
                >
                  {line.pickedFromLocation ? (
                    <Tag
                      value={line.pickedFromLocation}
                      severity="secondary"
                      className="text-xs"
                    />
                  ) : (
                    <span className="text-400">—</span>
                  )}
                </div>
                <div
                  style={{
                    width: "7rem",
                    textAlign: "center",
                    fontSize: "0.8rem",
                    flexShrink: 0,
                  }}
                >
                  {line.batchId ? (
                    <Tag
                      value={line.batchId}
                      severity="info"
                      className="text-xs"
                    />
                  ) : (
                    <span className="text-400">—</span>
                  )}
                </div>
                <div
                  style={{ width: "10rem", fontSize: "0.75rem", flexShrink: 0 }}
                  className="text-500"
                >
                  {line.notes || "—"}
                </div>
                {exitNote.status === ExitNoteStatus.IN_PROGRESS && (
                  <div
                    style={{
                      width: "5rem",
                      textAlign: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Checkbox
                      checked={!!pickedItems[line.id]}
                      onChange={(e) =>
                        setPickedItems((prev) => ({
                          ...prev,
                          [line.id]: e.checked || false,
                        }))
                      }
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Dialog>

      {/* ── Cancel Dialog ── */}
      <Dialog
        visible={cancelDialog}
        style={{ width: "500px" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-red-500 pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-ban mr-3 text-red-500 text-3xl"></i>
                Cancelar Nota de Salida
              </h2>
            </div>
          </div>
        }
        modal
        onHide={() => setCancelDialog(false)}
        footer={
          <div className="flex w-full gap-2 mb-4">
            <Button
              label="No"
              icon="pi pi-times"
              severity="secondary"
              onClick={() => setCancelDialog(false)}
              type="button"
              className="flex-1"
            />
            <Button
              label="Sí, Cancelar"
              icon="pi pi-ban"
              severity="danger"
              onClick={handleCancelConfirm}
              loading={loading}
              type="button"
              className="flex-1"
            />
          </div>
        }
      >
        <div className="flex flex-column gap-3 p-2">
          <div className="flex align-items-center gap-3 p-2 surface-100 border-round">
            <i className="pi pi-exclamation-triangle text-orange-500 text-2xl" />
            <span>
              ¿Deseas cancelar la nota <b>{exitNote.exitNoteNumber}</b>? Se
              liberarán las reservas de stock.
            </span>
          </div>
          <div className="flex flex-column gap-1">
            <label className="text-sm font-semibold text-600">
              Motivo (opcional)
            </label>
            <InputTextarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Ingresa el motivo de la cancelación..."
              className="w-full"
              autoResize
            />
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default ExitNoteDetailDialog;
