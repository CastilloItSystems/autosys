"use client";
import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { confirmSalesOrder } from "@/app/api/inventory/salesOrderService";
import { getWarehouses } from "@/app/api/inventory/warehouseService";
import { handleFormError } from "@/utils/errorHandlers";
import { Warehouse } from "@/libs/interfaces/inventory";

// Generar UUID simple
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface ConfirmOrderDialogProps {
  visible: boolean;
  order: any;
  onHide: () => void;
  onSuccess: (updatedOrder: any) => void;
  toast: React.RefObject<Toast> | null;
}

const ConfirmOrderDialog = ({
  visible,
  order,
  onHide,
  onSuccess,
  toast,
}: ConfirmOrderDialogProps) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      loadWarehouses();
      setSelectedWarehouse("");
    }
  }, [visible]);

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

  const handleConfirm = async () => {
    if (!selectedWarehouse) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un almacén",
      });
      return;
    }

    setSubmitting(true);

    try {
      const idempotencyKey = `confirm-${order.numero || order.id}-${generateUUID()}`;

      localStorage.setItem(
        `confirm-pending-${order.id || order._id}`,
        idempotencyKey
      );

      const response = await confirmSalesOrder(
        order.id || order._id,
        selectedWarehouse,
        idempotencyKey
      );

      localStorage.removeItem(`confirm-pending-${order.id || order._id}`);

      toast?.current?.show({
        severity: "success",
        summary: "Orden Confirmada",
        detail: `Orden ${order.numero || order.id} confirmada exitosamente`,
      });

      onSuccess(response);
      onHide();
    } catch (error: any) {
      console.error("Error confirming order:", error);
      if (error?.response?.status === 400) {
        toast?.current?.show({
          severity: "error",
          summary: "Stock Insuficiente",
          detail:
            error?.response?.data?.message ||
            "No hay stock disponible para confirmar la orden",
        });
      } else {
        handleFormError(error, toast);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const dialogFooter = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text"
        onClick={onHide}
        disabled={submitting}
      />
      <Button
        label="Confirmar"
        icon="pi pi-check"
        className="p-button-success"
        onClick={handleConfirm}
        loading={submitting}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={`Confirmar Orden: ${order?.numero || order?.id || ""}`}
      footer={dialogFooter}
      style={{ width: "500px" }}
      className="p-fluid"
    >
      <div className="card">
        <div className="mb-4">
          <p className="text-700 mb-3">
            Al confirmar esta orden se crearán reservas de inventario para todos
            los items. Esto bloqueará el stock hasta que la orden sea despachada
            o cancelada.
          </p>

          {order?.items && (
            <div className="surface-100 border-round p-3 mb-3">
              <h4 className="mt-0 mb-2 text-900">Items a reservar:</h4>
              {order.items.map((line: any, index: number) => (
                <div
                  key={index}
                  className="flex justify-content-between align-items-center py-2 border-bottom-1 border-200"
                >
                  <span className="text-900 font-medium">
                    {typeof line.item === "object"
                      ? line.item.nombre
                      : line.item}
                  </span>
                  <span className="text-700">
                    Cantidad: <strong>{line.cantidad}</strong>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="field">
          <label htmlFor="warehouse" className="font-bold text-900 mb-2 block">
            Almacén Origen <span className="text-red-500">*</span>
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
          <small className="text-500 mt-2 block">
            El sistema verificará que hay stock disponible en este almacén antes
            de crear las reservas.
          </small>
        </div>
      </div>
    </Dialog>
  );
};

export default ConfirmOrderDialog;
