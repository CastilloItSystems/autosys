"use client";
import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { getWorkOrderItems } from "@/app/api/workshop/workOrderService";
import { WorkOrderItem } from "@/libs/interfaces/workshop";

interface WorkOrderItemsDialogProps {
  visible: boolean;
  workOrderId: string | null;
  workOrderNumber: string;
  onHide: () => void;
}

const WorkOrderItemsDialog = ({
  visible,
  workOrderId,
  workOrderNumber,
  onHide,
}: WorkOrderItemsDialogProps) => {
  const [items, setItems] = useState<WorkOrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && workOrderId) {
      loadItems();
    }
  }, [visible, workOrderId]);

  const loadItems = async () => {
    if (!workOrderId) return;

    try {
      setLoading(true);
      const data = await getWorkOrderItems(workOrderId);
      setItems(data || []);
    } catch (error) {
      console.error("Error loading items:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const tipoBodyTemplate = (rowData: WorkOrderItem) => {
    const severity = rowData.tipo === "servicio" ? "info" : "warning";
    const label = rowData.tipo === "servicio" ? "Servicio" : "Repuesto";
    return <Tag value={label} severity={severity} />;
  };

  const estadoBodyTemplate = (rowData: WorkOrderItem) => {
    const severityMap: Record<
      string,
      "success" | "info" | "warning" | "danger"
    > = {
      pendiente: "warning",
      en_proceso: "info",
      completado: "success",
      cancelado: "danger",
    };

    const labelMap: Record<string, string> = {
      pendiente: "Pendiente",
      en_proceso: "En Proceso",
      completado: "Completado",
      cancelado: "Cancelado",
    };

    return (
      <Tag
        value={labelMap[rowData.estado] || rowData.estado}
        severity={severityMap[rowData.estado] || "info"}
      />
    );
  };

  const precioBodyTemplate = (
    rowData: WorkOrderItem,
    field: keyof Pick<
      WorkOrderItem,
      "precioUnitario" | "precioTotal" | "precioFinal"
    >
  ) => {
    const value = rowData[field];
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "VES",
    }).format(value);
  };

  const cantidadBodyTemplate = (rowData: WorkOrderItem) => {
    return new Intl.NumberFormat("es-VE").format(rowData.cantidad);
  };

  const tiempoBodyTemplate = (rowData: WorkOrderItem) => {
    if (!rowData.tiempoEstimado) return "-";
    return `${rowData.tiempoEstimado} min`;
  };

  const descuentoBodyTemplate = (rowData: WorkOrderItem) => {
    if (!rowData.descuento) return "-";
    return `${rowData.descuento}%`;
  };

  const footer = (
    <div className="flex justify-content-between align-items-center">
      <div className="text-lg font-bold">Total Items: {items.length}</div>
      <div className="text-lg font-bold">
        Total General:{" "}
        {new Intl.NumberFormat("es-VE", {
          style: "currency",
          currency: "VES",
        }).format(
          items.reduce((sum, item) => sum + (item.precioFinal || 0), 0)
        )}
      </div>
    </div>
  );

  return (
    <Dialog
      header={
        <div className="mb-2 text-center md:text-left">
          <div className="border-bottom-2 border-primary pb-2">
            <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
              <i className="pi pi-tags mr-3 text-primary text-3xl"></i>
              {`Items - ${workOrderNumber}`}
            </h2>
          </div>
        </div>
      }
      visible={visible}
      onHide={onHide}
      style={{ width: "90vw" }}
      breakpoints={{ "960px": "75vw", "641px": "100vw" }}
      footer={footer}
    >
      <DataTable
        value={items}
        loading={loading}
        emptyMessage="No hay items en esta orden de trabajo"
        stripedRows
        size="small"
      >
        <Column
          field="tipo"
          header="Tipo"
          body={tipoBodyTemplate}
          style={{ width: "8rem" }}
        />
        <Column field="nombre" header="Nombre" style={{ minWidth: "15rem" }} />
        <Column
          field="descripcion"
          header="Descripción"
          style={{ minWidth: "15rem" }}
        />
        <Column
          field="cantidad"
          header="Cantidad"
          body={cantidadBodyTemplate}
          style={{ width: "8rem" }}
        />
        <Column
          field="precioUnitario"
          header="Precio Unit."
          body={(rowData) => precioBodyTemplate(rowData, "precioUnitario")}
          style={{ width: "10rem" }}
        />
        <Column
          field="descuento"
          header="Desc."
          body={descuentoBodyTemplate}
          style={{ width: "6rem" }}
        />
        <Column
          field="precioTotal"
          header="Subtotal"
          body={(rowData) => precioBodyTemplate(rowData, "precioTotal")}
          style={{ width: "10rem" }}
        />
        <Column
          field="precioFinal"
          header="Total"
          body={(rowData) => precioBodyTemplate(rowData, "precioFinal")}
          style={{ width: "10rem" }}
        />
        <Column
          field="tiempoEstimado"
          header="Tiempo"
          body={tiempoBodyTemplate}
          style={{ width: "8rem" }}
        />
        <Column
          field="estado"
          header="Estado"
          body={estadoBodyTemplate}
          style={{ width: "10rem" }}
        />
      </DataTable>
    </Dialog>
  );
};

export default WorkOrderItemsDialog;
