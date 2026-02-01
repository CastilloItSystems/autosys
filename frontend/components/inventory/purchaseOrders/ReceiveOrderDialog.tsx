"use client";
import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { receivePurchaseOrder } from "@/app/api/inventory/purchaseOrderService";
import { getWarehouses } from "@/app/api/inventory/warehouseService";
import { handleFormError } from "@/utils/errorHandlers";
import { Warehouse } from "@/libs/interfaces/inventory";

// Generar UUID simple sin dependencia externa
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface ReceiveOrderDialogProps {
  visible: boolean;
  order: any;
  onHide: () => void;
  onSuccess: (updatedOrder: any) => void;
  toast: React.RefObject<Toast> | null;
}

interface LineToReceive {
  item: string;
  itemName: string;
  ordenado: number;
  recibido: number;
  pendiente: number;
  qtyToReceive: number;
  costoUnitario: number;
}

const ReceiveOrderDialog = ({
  visible,
  order,
  onHide,
  onSuccess,
  toast,
}: ReceiveOrderDialogProps) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [lines, setLines] = useState<LineToReceive[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && order) {
      loadWarehouses();
      initializeLines();
    }
  }, [visible, order]);

  const loadWarehouses = async () => {
    try {
      const response = await getWarehouses();
      const warehouseList = Array.isArray(response?.warehouses)
        ? response.warehouses
        : response?.warehouses ?? response ?? [];
      setWarehouses(warehouseList);
    } catch (error) {
      console.error("Error loading warehouses:", error);
      handleFormError(error, toast);
    }
  };

  const initializeLines = () => {
    if (!order?.items) return;

    const initialLines: LineToReceive[] = order.items
      .map((line: any) => {
        const ordenado = line.cantidad || 0;
        const recibido = line.recibido || 0;
        const pendiente = Math.max(ordenado - recibido, 0);

        // Solo incluir líneas con pendientes
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
          ordenado,
          recibido,
          pendiente,
          qtyToReceive: pendiente, // Default: recepcionar todo el pendiente
          costoUnitario: line.precioUnitario || 0,
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
        qtyToReceive: qty > maxQty ? maxQty : qty,
      };
      return copy;
    });
  };

  const handleReceiveAll = () => {
    setLines((prev) =>
      prev.map((line) => ({ ...line, qtyToReceive: line.pendiente }))
    );
  };

  const handleClearAll = () => {
    setLines((prev) => prev.map((line) => ({ ...line, qtyToReceive: 0 })));
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!selectedWarehouse) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un almacén destino",
      });
      return;
    }

    const itemsToReceive = lines
      .filter((line) => line.qtyToReceive > 0)
      .map((line) => ({
        item: line.item,
        cantidad: line.qtyToReceive,
        costoUnitario: line.costoUnitario,
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
      // Generar idempotency key
      const idempotencyKey = `receive-${
        order.id || order._id
      }-${generateUUID()}`;

      // Guardar en localStorage para reintentos
      localStorage.setItem(
        `receive-pending-${order.id || order._id}`,
        idempotencyKey
      );

      const response = await receivePurchaseOrder(
        order.id || order._id,
        selectedWarehouse,
        itemsToReceive,
        idempotencyKey
      );

      // Limpiar localStorage
      localStorage.removeItem(`receive-pending-${order.id || order._id}`);

      // Mostrar mensaje apropiado
      if (response.idempotent) {
        toast?.current?.show({
          severity: "info",
          summary: "Recepción idempotente",
          detail: "Esta recepción ya fue procesada anteriormente",
        });
      } else {
        toast?.current?.show({
          severity: "success",
          summary: "Recepción exitosa",
          detail: `Orden ${
            order.numero || order.id
          } recepcionada correctamente`,
        });
      }

      // Actualizar UI con la PO actualizada
      const updatedOrder = response.purchaseOrder || response;
      onSuccess(updatedOrder);
      onHide();
    } catch (error) {
      console.error("Error receiving order:", error);
      handleFormError(error, toast);
      // Mantener idempotencyKey en localStorage para reintentos
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
    0
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={`Recepcionar Orden: ${order?.numero || order?.id || ""}`}
      footer={dialogFooter}
      style={{ width: "900px" }}
      className="p-fluid"
    >
      <div className="card">
        {/* Warehouse selector */}
        <div className="field mb-4">
          <label htmlFor="warehouse" className="font-bold text-900">
            Almacén Destino <span className="text-red-500">*</span>
          </label>
          <Dropdown
            id="warehouse"
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.value)}
            options={warehouses}
            optionLabel="nombre"
            optionValue="id"
            placeholder="Seleccione un almacén"
            filter
            filterBy="nombre"
            className={classNames("w-full", {
              "p-invalid": !selectedWarehouse,
            })}
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

          {/* Lines table */}
          {lines.length === 0 ? (
            <div className="text-center py-4 text-500">
              <i className="pi pi-info-circle mr-2"></i>
              No hay líneas pendientes de recepcionar
            </div>
          ) : (
            <div className="surface-50 border-round p-3">
              {lines.map((line, index) => (
                <div
                  key={line.item + index}
                  className="grid align-items-center mb-3 pb-3 border-bottom-1 border-200"
                >
                  {/* Item info */}
                  <div className="col-12 md:col-5">
                    <div className="font-medium text-900">{line.itemName}</div>
                    <div className="text-sm text-500 mt-1">
                      <span className="mr-3">
                        <i className="pi pi-shopping-cart text-xs mr-1"></i>
                        Ordenado: <strong>{line.ordenado}</strong>
                      </span>
                      <span className="mr-3">
                        <i className="pi pi-check text-xs mr-1"></i>
                        Recibido: <strong>{line.recibido}</strong>
                      </span>
                      <span className="text-orange-500">
                        <i className="pi pi-clock text-xs mr-1"></i>
                        Pendiente: <strong>{line.pendiente}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Cantidad a recibir */}
                  <div className="col-12 md:col-3">
                    <label
                      htmlFor={`qty-${index}`}
                      className="text-sm font-medium text-600 mb-2 block"
                    >
                      Cantidad a recibir
                    </label>
                    <InputNumber
                      id={`qty-${index}`}
                      value={line.qtyToReceive}
                      onValueChange={(e) =>
                        updateQuantity(index, e.value ?? null)
                      }
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

                  {/* Costo unitario (read-only) */}
                  <div className="col-12 md:col-2">
                    <label className="text-sm font-medium text-600 mb-2 block">
                      Costo Unit.
                    </label>
                    <div className="text-900 font-medium">
                      ${line.costoUnitario.toFixed(2)}
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="col-12 md:col-2 text-right">
                    <label className="text-sm font-medium text-600 mb-2 block">
                      Subtotal
                    </label>
                    <div className="text-900 font-bold">
                      ${(line.qtyToReceive * line.costoUnitario).toFixed(2)}
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
