"use client";
import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Steps } from "primereact/steps";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Checkbox } from "primereact/checkbox";
import { InputTextarea } from "primereact/inputtextarea";
import {
  ExitNote,
  ExitNoteStatus,
  ExitNoteItem,
} from "@/libs/interfaces/inventory/exitNote.interface";
import { Item } from "@/app/api/inventory/itemService";
import { Warehouse } from "@/app/api/inventory/warehouseService";
import {
  startPreparing,
  markAsReady,
  deliverExitNote,
  cancelExitNote,
} from "@/app/api/inventory/exitNoteService";
import { Toast } from "primereact/toast";

interface ExitNoteDetailDialogProps {
  visible: boolean;
  onHide: () => void;
  exitNote: ExitNote | null;
  onUpdate: () => void;
  toast: React.RefObject<Toast | null>;
  items: Item[];
  warehouses: Warehouse[];
}

const ExitNoteDetailDialog = ({
  visible,
  onHide,
  exitNote,
  onUpdate,
  toast,
  items,
  warehouses,
}: ExitNoteDetailDialogProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pickedItems, setPickedItems] = useState<Record<string, boolean>>({});
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>("");

  useEffect(() => {
    if (exitNote) {
      // Map status to step index
      switch (exitNote.status) {
        case ExitNoteStatus.PENDING:
          setActiveIndex(0);
          break;
        case ExitNoteStatus.IN_PROGRESS:
          setActiveIndex(1);
          break;
        case ExitNoteStatus.READY:
          setActiveIndex(2);
          break;
        case ExitNoteStatus.DELIVERED:
          setActiveIndex(3);
          break;
        case ExitNoteStatus.CANCELLED:
          setActiveIndex(0);
          break; // Or handle differently
        default:
          setActiveIndex(0);
      }
      setPickedItems({});
    }
  }, [exitNote]);

  const stepItems = [
    { label: "Pendiente" },
    { label: "Preparando" },
    { label: "Listo para Entrega" },
    { label: "Entregado" },
  ];

  if (!exitNote) return null;

  const handleStartPreparing = async () => {
    setLoading(true);
    try {
      const result = await startPreparing(exitNote.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Preparación iniciada",
        life: 3000,
      });
      onUpdate();
    } catch (error) {
      console.error(error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo iniciar la preparación",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReady = async () => {
    setLoading(true);
    try {
      const result = await markAsReady(exitNote.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Marcado como listo para entrega",
        life: 3000,
      });
      onUpdate();
    } catch (error) {
      console.error(error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al marcar como listo",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeliver = async () => {
    setLoading(true);
    try {
      const result = await deliverExitNote(exitNote.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Entrega registrada exitosamente",
        life: 3000,
      });
      onUpdate();
      onHide();
    } catch (error) {
      console.error(error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al registrar la entrega",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    setCancelReason("");
    setCancelDialog(true);
  };

  const handleCancelConfirm = async () => {
    setLoading(true);
    try {
      const result = await cancelExitNote(exitNote.id, cancelReason || "");
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Nota de salida ${exitNote.exitNoteNumber} cancelada`,
        life: 3000,
      });
      setCancelDialog(false);
      onUpdate();
      onHide();
    } catch (error) {
      console.error(error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cancelar la nota",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Render logic based on status
  const renderActions = () => {
    if (exitNote.status === ExitNoteStatus.CANCELLED)
      return <Tag severity="danger" value="CANCELADO" />;

    switch (exitNote.status) {
      case ExitNoteStatus.PENDING:
        return (
          <div className="flex gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              severity="danger"
              text
              onClick={handleCancelClick}
            />
            <Button
              label="Iniciar Preparación"
              icon="pi pi-play"
              severity="success"
              onClick={handleStartPreparing}
              loading={loading}
            />
          </div>
        );
      case ExitNoteStatus.IN_PROGRESS:
        const allPicked =
          exitNote.items?.every((item) => pickedItems[item.id]) ?? false;
        return (
          <div className="flex gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              severity="danger"
              text
              onClick={handleCancelClick}
            />
            <Button
              label="Marcar como Listo"
              icon="pi pi-check"
              severity="warning"
              onClick={handleMarkAsReady}
              loading={loading}
              disabled={!allPicked && (exitNote.items?.length || 0) > 0}
              tooltip={
                !allPicked
                  ? "Debe confirmar el picking de todos los items"
                  : undefined
              }
              tooltipOptions={{ showOnDisabled: true }}
            />
          </div>
        );
      case ExitNoteStatus.READY:
        return (
          <div className="flex gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              severity="danger"
              text
              onClick={handleCancelClick}
            />
            <Button
              label="Registrar Entrega"
              icon="pi pi-send"
              severity="success"
              onClick={handleDeliver}
              loading={loading}
            />
          </div>
        );
      case ExitNoteStatus.DELIVERED:
        return <Tag severity="success" value="ENTREGADO" />;
      default:
        return null;
    }
  };

  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find((w) => w.id === warehouseId);
    return warehouse?.name || warehouseId;
  };

  const pickedBodyTemplate = (item: ExitNoteItem) => {
    if (exitNote.status !== ExitNoteStatus.IN_PROGRESS) return null;

    return (
      <Checkbox
        checked={!!pickedItems[item.id]}
        onChange={(e) =>
          setPickedItems((prev) => ({ ...prev, [item.id]: e.checked || false }))
        }
      />
    );
  };

  return (
    <>
      <Dialog
        header={`Nota de Salida #${exitNote.exitNoteNumber}`}
        visible={visible}
        style={{ width: "70vw" }}
        onHide={onHide}
        footer={
          <div className="flex justify-content-end">{renderActions()}</div>
        }
      >
        <div className="mb-4">
          <Steps model={stepItems} activeIndex={activeIndex} readOnly={true} />
        </div>

        <div className="grid mb-3">
          <div className="col-12 md:col-6">
            <div className="text-500 mb-1">Destinatario</div>
            <div className="font-bold">{exitNote.recipientName || "N/A"}</div>
            {exitNote.recipientPhone && (
              <div className="text-sm">{exitNote.recipientPhone}</div>
            )}
          </div>
          <div className="col-12 md:col-6">
            <div className="text-500 mb-1">Almacén de Origen</div>
            <div className="font-bold">
              {exitNote.warehouse?.name ||
                getWarehouseName(exitNote.warehouseId)}
            </div>
          </div>
          <div className="col-12">
            <div className="text-500 mb-1">Notas</div>
            <div>{exitNote.notes || "Sin notas"}</div>
          </div>
        </div>

        <h5>Items (Picking)</h5>
        <DataTable value={exitNote.items} stripedRows size="small">
          <Column field="item.sku" header="SKU" />
          <Column field="item.name" header="Producto" />
          <Column field="quantity" header="Cantidad" align="center" />
          <Column field="pickedFromLocation" header="Ubicación" />
          {/* Picking Checkbox Column only visible during In Progress */}
          {exitNote.status === ExitNoteStatus.IN_PROGRESS && (
            <Column
              header="Confirmar Picking"
              body={pickedBodyTemplate}
              align="center"
            />
          )}
        </DataTable>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        visible={cancelDialog}
        style={{ width: "500px" }}
        header="Cancelar Nota de Salida"
        modal
        onHide={() => setCancelDialog(false)}
        footer={
          <>
            <Button
              label="No"
              icon="pi pi-times"
              text
              onClick={() => setCancelDialog(false)}
            />
            <Button
              label="Sí, Cancelar"
              icon="pi pi-check"
              text
              severity="danger"
              onClick={handleCancelConfirm}
              loading={loading}
            />
          </>
        }
      >
        <div className="mb-3">
          <h5>¿Deseas cancelar la nota {exitNote.exitNoteNumber}?</h5>
          <p className="text-600 text-sm">
            Esta acción revertirá las reservas de stock realizadas.
          </p>
        </div>
        <div>
          <label className="text-sm font-semibold">Motivo (opcional)</label>
          <InputTextarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
            placeholder="Ingresa el motivo de la cancelación..."
            className="w-full mt-2"
          />
        </div>
      </Dialog>
    </>
  );
};

export default ExitNoteDetailDialog;
