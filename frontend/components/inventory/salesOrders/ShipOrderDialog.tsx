"use client";
import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { shipSalesOrder } from "@/app/api/inventory/salesOrderService";
import { handleFormError } from "@/utils/errorHandlers";

// Generar UUID simple
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface ShipOrderDialogProps {
  visible: boolean;
  order: any;
  onHide: () => void;
  onSuccess: (updatedOrder: any) => void;
  toast: React.RefObject<Toast> | null;
}

interface LineToShip {
  item: string;
  itemName: string;
  cantidad: number;
  entregado: number;
  pendiente: number;
  qtyToShip: number;
}

const ShipOrderDialog = ({
  visible,
  order,
  onHide,
  onSuccess,
  toast,
}: ShipOrderDialogProps) => {
  const [lines, setLines] = useState<LineToShip[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && order) {
      initializeLines();
    }
  }, [visible, order]);

  const initializeLines = () => {
    if (!order?.items) return;

    const initialLines: LineToShip[] = order.items
      .map((line: any) => {
        const cantidad = line.cantidad || 0;
        const entregado = line.entregado || 0;
        const pendiente = Math.max(cantidad - entregado, 0);

        if (pendiente <= 0) return null;

        const itemId =
          typeof line.item === "object"
            ? line.item.id || line.item._id
            : line.item;
        const itemName =
          typeof line.item === "object" ? line.item.nombre : itemId;

        return {
          item: itemId,
          itemName,
          cantidad,
          entregado,
          pendiente,
          qtyToShip: pendiente,
        };
      })
      .filter((line: any) => line !== null);

    setLines(initialLines);
  };

  const updateQuantity = (index: number, value: number | null) => {
    setLines((prev) => {
      const copy = [...prev];
      const qty = Math.max(0, Number(value || 0));
      const maxQty = copy[index].pendiente;
      copy[index] = {
        ...copy[index],
        qtyToShip: qty > maxQty ? maxQty : qty,
      };
      return copy;
    });
  };

  const handleShipAll = () => {
    setLines((prev) =>
      prev.map((line) => ({ ...line, qtyToShip: line.pendiente }))
    );
  };

  const handleClearAll = () => {
    setLines((prev) => prev.map((line) => ({ ...line, qtyToShip: 0 })));
  };

  const handleShipFull = async () => {
    setSubmitting(true);
    try {
      const idempotencyKey = `ship-${order.numero || order.id}-full-${generateUUID()}`;

      localStorage.setItem(
        `ship-pending-${order.id || order._id}`,
        idempotencyKey
      );

      const response = await shipSalesOrder(
        order.id || order._id,
        undefined,
        idempotencyKey
      );

      localStorage.removeItem(`ship-pending-${order.id || order._id}`);

      toast?.current?.show({
        severity: "success",
        summary: "Despacho Completo",
        detail: `Orden ${order.numero || order.id} despachada completamente`,
      });

      onSuccess(response);
      onHide();
    } catch (error) {
      console.error("Error shipping order:", error);
      handleFormError(error, toast);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShipPartial = async () => {
    const itemsToShip = lines
      .filter((line) => line.qtyToShip > 0)
      .map((line) => ({
        item: line.item,
        cantidad: line.qtyToShip,
      }));

    if (itemsToShip.length === 0) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "No hay cantidades para despachar",
      });
      return;
    }

    setSubmitting(true);

    try {
      const idempotencyKey = `ship-${order.numero || order.id}-partial-${generateUUID()}`;

      localStorage.setItem(
        `ship-pending-${order.id || order._id}`,
        idempotencyKey
      );

      const response = await shipSalesOrder(
        order.id || order._id,
        itemsToShip,
        idempotencyKey
      );

      localStorage.removeItem(`ship-pending-${order.id || order._id}`);

      const isFullyShipped = response.estado === "despachada";

      toast?.current?.show({
        severity: "success",
        summary: isFullyShipped ? "Despacho Completo" : "Despacho Parcial",
        detail: isFullyShipped
          ? `Orden ${order.numero || order.id} despachada completamente`
          : `Despacho parcial procesado exitosamente`,
      });

      onSuccess(response);
      onHide();
    } catch (error) {
      console.error("Error shipping order:", error);
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
          onClick={handleShipAll}
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
          label="Despachar Todo"
          icon="pi pi-send"
          className="p-button-info"
          onClick={handleShipFull}
          loading={submitting}
        />
        <Button
          label="Despacho Parcial"
          icon="pi pi-check"
          className="p-button-success"
          onClick={handleShipPartial}
          loading={submitting}
        />
      </div>
    </div>
  );

  const totalToShip = lines.reduce((sum, line) => sum + line.qtyToShip, 0);

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={`Despachar Orden: ${order?.numero || order?.id || ""}`}
      footer={dialogFooter}
      style={{ width: "900px" }}
      className="p-fluid"
    >
      <div className="card">
        <div className="mb-3 surface-100 border-round p-3">
          <p className="text-700 m-0">
            <i className="pi pi-info-circle mr-2 text-blue-500"></i>
            Puede despachar la orden completa o parcial. Los movimientos de salida
            se crearán automáticamente y el stock se actualizará.
          </p>
        </div>

        <div className="border-top-1 border-300 pt-3">
          <div className="flex justify-content-between align-items-center mb-3">
            <h4 className="m-0">Líneas a Despachar</h4>
            <span className="text-500">
              Total a despachar: <strong>{totalToShip}</strong> unidades
            </span>
          </div>

          {lines.length === 0 ? (
            <div className="text-center py-4 text-500">
              <i className="pi pi-check-circle mr-2 text-green-500 text-xl"></i>
              <div>No hay líneas pendientes de despachar</div>
              <small>La orden está completamente despachada</small>
            </div>
          ) : (
            <div className="surface-50 border-round p-3">
              {lines.map((line, index) => (
                <div
                  key={line.item + index}
                  className="grid align-items-center mb-3 pb-3 border-bottom-1 border-200"
                >
                  <div className="col-12 md:col-5">
                    <div className="font-medium text-900">{line.itemName}</div>
                    <div className="text-sm text-500 mt-1">
                      <span className="mr-3">
                        <i className="pi pi-shopping-cart text-xs mr-1"></i>
                        Cantidad: <strong>{line.cantidad}</strong>
                      </span>
                      <span className="mr-3">
                        <i className="pi pi-check text-xs mr-1"></i>
                        Entregado: <strong>{line.entregado}</strong>
                      </span>
                      <span className="text-orange-500">
                        <i className="pi pi-clock text-xs mr-1"></i>
                        Pendiente: <strong>{line.pendiente}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="col-12 md:col-4">
                    <label
                      htmlFor={`qty-${index}`}
                      className="text-sm font-medium text-600 mb-2 block"
                    >
                      Cantidad a despachar
                    </label>
                    <InputNumber
                      id={`qty-${index}`}
                      value={line.qtyToShip}
                      onValueChange={(e) => updateQuantity(index, e.value ?? null)}
                      min={0}
                      max={line.pendiente}
                      showButtons
                      buttonLayout="horizontal"
                      decrementButtonClassName="p-button-secondary"
                      incrementButtonClassName="p-button-secondary"
                      incrementButtonIcon="pi pi-plus"
                      decrementButtonIcon="pi pi-minus"
                      className="w-full"
                    />
                  </div>

                  <div className="col-12 md:col-3 text-right">
                    <label className="text-sm font-medium text-600 mb-2 block">
                      Progreso
                    </label>
                    <div className="flex align-items-center justify-content-end gap-2">
                      <div
                        className="border-round overflow-hidden bg-gray-200"
                        style={{ width: "100px", height: "8px" }}
                      >
                        <div
                          className="bg-green-500 h-full"
                          style={{
                            width: `${
                              ((line.entregado + line.qtyToShip) /
                                line.cantidad) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-500">
                        {(
                          ((line.entregado + line.qtyToShip) / line.cantidad) *
                          100
                        ).toFixed(0)}
                        %
                      </span>
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

export default ShipOrderDialog;
