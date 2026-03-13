"use client";
import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import purchaseOrderService from "@/app/api/inventory/purchaseOrderService";
import { handleFormError } from "@/utils/errorHandlers";
import type {
  PurchaseOrder,
  PurchaseOrderItem,
} from "@/libs/interfaces/inventory";

interface ReceiveOrderDialogProps {
  visible: boolean;
  order: PurchaseOrder | null;
  onHide: () => void;
  onSuccess: (updatedOrder: any) => void;
  toast: React.RefObject<Toast> | null;
}

interface LineToReceive {
  itemId: string;
  itemName: string;
  sku: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityPending: number;
  qtyToReceive: number;
  unitCost: number;
  batchNumber: string;
  expiryDate: Date | null;
}

const ReceiveOrderDialog = ({
  visible,
  order,
  onHide,
  onSuccess,
  toast,
}: ReceiveOrderDialogProps) => {
  const [lines, setLines] = useState<LineToReceive[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (visible && order) {
      initializeLines();
      setNotes("");
    }
  }, [visible, order]);

  const initializeLines = () => {
    if (!order?.items) return;

    const initialLines: LineToReceive[] = order.items
      .filter((line) => line.quantityPending > 0)
      .map((line: PurchaseOrderItem) => ({
        itemId: line.itemId,
        itemName: line.item?.name || line.itemId,
        sku: line.item?.sku || "",
        quantityOrdered: line.quantityOrdered,
        quantityReceived: line.quantityReceived,
        quantityPending: line.quantityPending,
        qtyToReceive: line.quantityPending,
        unitCost: line.unitCost,
        batchNumber: "",
        expiryDate: null,
      }));

    setLines(initialLines);
  };

  const updateField = <K extends keyof LineToReceive>(
    index: number,
    field: K,
    value: LineToReceive[K],
  ) => {
    setLines((prev) => {
      const copy = [...prev];
      if (field === "qtyToReceive") {
        const qty = Math.max(0, Number(value || 0));
        const maxQty = copy[index].quantityPending;
        copy[index] = {
          ...copy[index],
          qtyToReceive: qty > maxQty ? maxQty : qty,
        };
      } else {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  };

  const handleReceiveAll = () => {
    setLines((prev) =>
      prev.map((line) => ({ ...line, qtyToReceive: line.quantityPending })),
    );
  };

  const handleClearAll = () => {
    setLines((prev) => prev.map((line) => ({ ...line, qtyToReceive: 0 })));
  };

  const handleSubmit = async () => {
    const itemsToReceive = lines
      .filter((line) => line.qtyToReceive > 0)
      .map((line) => ({
        itemId: line.itemId,
        quantityReceived: line.qtyToReceive,
        unitCost: line.unitCost,
        batchNumber: line.batchNumber || null,
        expiryDate: line.expiryDate
          ? new Date(line.expiryDate).toISOString()
          : null,
      }));

    if (itemsToReceive.length === 0) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "No hay cantidades para recepcionar",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await purchaseOrderService.receive(order!.id, {
        notes: notes || undefined,
        items: itemsToReceive,
      });

      toast?.current?.show({
        severity: "success",
        summary: "Recepción exitosa",
        detail: `Orden ${order!.orderNumber} recepcionada correctamente`,
      });

      const updatedOrder = response.purchaseOrder || response.data || response;
      onSuccess(updatedOrder);
      onHide();
    } catch (error) {
      console.error("Error receiving order:", error);
      handleFormError(error, toast);
    } finally {
      setSubmitting(false);
    }
  };

  const dialogFooter = (
    <div className="flex justify-content-between align-items-center">
      <div className="flex gap-2">
        <Button
          label="Todo"
          icon="pi pi-check-circle"
          className="p-button-sm p-button-success p-button-outlined"
          onClick={handleReceiveAll}
          disabled={submitting}
        />
        <Button
          label="Limpiar"
          icon="pi pi-times-circle"
          className="p-button-sm p-button-secondary p-button-outlined"
          onClick={handleClearAll}
          disabled={submitting}
        />
      </div>
      <div className="flex gap-2">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-text"
          onClick={onHide}
          disabled={submitting}
        />
        <Button
          label="Recepcionar"
          icon="pi pi-check"
          className="p-button-success"
          onClick={handleSubmit}
          loading={submitting}
        />
      </div>
    </div>
  );

  const totalToReceive = lines.reduce(
    (sum, line) => sum + line.qtyToReceive,
    0,
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={`Recepcionar Orden: ${order?.orderNumber || ""}`}
      footer={dialogFooter}
      style={{ width: "1000px" }}
      className="p-fluid"
    >
      <div className="card">
        {/* Info de la orden */}
        {order && (
          <div className="grid mb-3 surface-50 border-round p-3">
            <div className="col-4">
              <span className="text-500 text-sm">Proveedor</span>
              <div className="font-medium text-900">
                {order.supplier?.name || "—"}
              </div>
            </div>
            <div className="col-4">
              <span className="text-500 text-sm">Almacén Destino</span>
              <div className="font-medium text-900">
                {order.warehouse?.name || "—"}
              </div>
            </div>
            <div className="col-4">
              <span className="text-500 text-sm">Total Orden</span>
              <div className="font-medium text-900">
                ${Number(order.total || 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Notas */}
        <div className="field mb-3">
          <label htmlFor="receive-notes" className="font-bold text-900">
            Notas de Recepción
          </label>
          <InputText
            id="receive-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones de esta recepción..."
            className="w-full"
          />
        </div>

        {/* Lines header */}
        <div className="border-top-1 border-300 pt-3">
          <div className="flex justify-content-between align-items-center mb-3">
            <h4 className="m-0">Líneas a Recepcionar</h4>
            <span className="text-500">
              Total a recibir: <strong>{totalToReceive}</strong> unidades
            </span>
          </div>

          {lines.length === 0 ? (
            <div className="text-center py-4 text-500">
              <i className="pi pi-info-circle mr-2"></i>
              No hay líneas pendientes de recepcionar
            </div>
          ) : (
            <div className="surface-50 border-round p-3">
              {lines.map((line, index) => (
                <div
                  key={line.itemId + index}
                  className="grid align-items-center mb-3 pb-3 border-bottom-1 border-200"
                >
                  {/* Item info */}
                  <div className="col-12 md:col-3">
                    <div className="font-medium text-900">
                      {line.sku ? `${line.sku} — ` : ""}
                      {line.itemName}
                    </div>
                    <div className="text-sm text-500 mt-1">
                      <span className="mr-3">
                        Ord: <strong>{line.quantityOrdered}</strong>
                      </span>
                      <span className="mr-3">
                        Rec: <strong>{line.quantityReceived}</strong>
                      </span>
                      <span className="text-orange-500">
                        Pend: <strong>{line.quantityPending}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Cantidad a recibir */}
                  <div className="col-12 md:col-2">
                    <label className="text-sm font-medium text-600 mb-1 block">
                      Cantidad
                    </label>
                    <InputNumber
                      value={line.qtyToReceive}
                      onValueChange={(e) =>
                        updateField(index, "qtyToReceive", e.value ?? 0)
                      }
                      min={0}
                      max={line.quantityPending}
                      showButtons
                      buttonLayout="horizontal"
                      decrementButtonClassName="p-button-secondary"
                      incrementButtonClassName="p-button-secondary"
                      incrementButtonIcon="pi pi-plus"
                      decrementButtonIcon="pi pi-minus"
                      className="w-full"
                    />
                  </div>

                  {/* Costo unitario */}
                  <div className="col-6 md:col-2">
                    <label className="text-sm font-medium text-600 mb-1 block">
                      Costo Unit.
                    </label>
                    <InputNumber
                      value={line.unitCost}
                      onValueChange={(e) =>
                        updateField(index, "unitCost", e.value ?? 0)
                      }
                      mode="currency"
                      currency="USD"
                      locale="en-US"
                      className="w-full"
                    />
                  </div>

                  {/* Lote */}
                  <div className="col-6 md:col-2">
                    <label className="text-sm font-medium text-600 mb-1 block">
                      Lote
                    </label>
                    <InputText
                      value={line.batchNumber}
                      onChange={(e) =>
                        updateField(index, "batchNumber", e.target.value)
                      }
                      placeholder="Nro. Lote"
                      className="w-full"
                    />
                  </div>

                  {/* Vencimiento */}
                  <div className="col-6 md:col-2">
                    <label className="text-sm font-medium text-600 mb-1 block">
                      Vencimiento
                    </label>
                    <Calendar
                      value={line.expiryDate}
                      onChange={(e) =>
                        updateField(index, "expiryDate", e.value as Date | null)
                      }
                      dateFormat="dd/mm/yy"
                      showIcon
                      className="w-full"
                      placeholder="Fecha"
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="col-6 md:col-1 text-right">
                    <label className="text-sm font-medium text-600 mb-1 block">
                      Subtotal
                    </label>
                    <div className="text-900 font-bold">
                      ${(line.qtyToReceive * line.unitCost).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default ReceiveOrderDialog;
