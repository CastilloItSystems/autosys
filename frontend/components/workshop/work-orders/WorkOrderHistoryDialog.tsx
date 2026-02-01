"use client";
import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { getWorkOrderHistory } from "@/app/api/workshop/workOrderService";
import { WorkOrderHistory } from "@/libs/interfaces/workshop";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface WorkOrderHistoryDialogProps {
  visible: boolean;
  workOrderId: string | null;
  workOrderNumber: string;
  onHide: () => void;
}

const WorkOrderHistoryDialog: React.FC<WorkOrderHistoryDialogProps> = ({
  visible,
  workOrderId,
  workOrderNumber,
  onHide,
}) => {
  const [history, setHistory] = useState<WorkOrderHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && workOrderId) {
      fetchHistory();
    }
  }, [visible, workOrderId]);

  const fetchHistory = async () => {
    if (!workOrderId) return;

    setLoading(true);
    try {
      const response = await getWorkOrderHistory(workOrderId);
      if (response.success) {
        setHistory(response.data);
      }
    } catch (error) {
      console.error("Error al obtener el historial:", error);
    } finally {
      setLoading(false);
    }
  };

  const tipoBodyTemplate = (rowData: WorkOrderHistory) => {
    const tipoConfig: Record<
      string,
      { label: string; severity: string; icon: string }
    > = {
      cambio_estado: {
        label: "Cambio Estado",
        severity: "info",
        icon: "pi pi-refresh",
      },
      modificado_item: {
        label: "Modificado Item",
        severity: "warning",
        icon: "pi pi-pencil",
      },
      completado_item: {
        label: "Completado Item",
        severity: "success",
        icon: "pi pi-check",
      },
      eliminado_item: {
        label: "Eliminado Item",
        severity: "danger",
        icon: "pi pi-trash",
      },
      actualizacion_costos: {
        label: "Actualización Costos",
        severity: "help",
        icon: "pi pi-dollar",
      },
      creado: { label: "Creado", severity: "success", icon: "pi pi-plus" },
      actualizado: {
        label: "Actualizado",
        severity: "info",
        icon: "pi pi-save",
      },
    };

    const config = tipoConfig[rowData.tipo] || {
      label: rowData.tipo,
      severity: "info",
      icon: "pi pi-info-circle",
    };

    return (
      <Tag
        value={config.label}
        severity={config.severity as any}
        icon={config.icon}
      />
    );
  };

  const fechaBodyTemplate = (rowData: WorkOrderHistory) => {
    return format(new Date(rowData.fecha), "dd/MM/yyyy HH:mm", { locale: es });
  };

  const usuarioBodyTemplate = (rowData: WorkOrderHistory) => {
    return rowData.usuario.nombre;
  };

  const detallesBodyTemplate = (rowData: WorkOrderHistory) => {
    if (rowData.tipo === "cambio_estado") {
      return (
        <div>
          <div>
            <strong>De:</strong> {rowData.estadoAnterior?.nombre || "N/A"}
          </div>
          <div>
            <strong>A:</strong> {rowData.estadoNuevo?.nombre || "N/A"}
          </div>
        </div>
      );
    }

    if (rowData.detalles) {
      if (rowData.detalles.tipo && rowData.detalles.nombre) {
        return (
          <div>
            <div>
              <strong>{rowData.detalles.tipo}:</strong>{" "}
              {rowData.detalles.nombre}
            </div>
            {rowData.detalles.estadoAnterior &&
              rowData.detalles.estadoNuevo && (
                <div>
                  <strong>Estado:</strong> {rowData.detalles.estadoAnterior} →{" "}
                  {rowData.detalles.estadoNuevo}
                </div>
              )}
            {rowData.detalles.cantidad && (
              <div>
                <strong>Cantidad:</strong> {rowData.detalles.cantidad}
              </div>
            )}
          </div>
        );
      }

      if (
        rowData.detalles.costoAnterior !== undefined &&
        rowData.detalles.costoNuevo !== undefined
      ) {
        return (
          <div>
            <div>
              <strong>Costo:</strong> ${rowData.detalles.costoAnterior} → $
              {rowData.detalles.costoNuevo}
            </div>
            {rowData.detalles.subtotalServicios && (
              <div>
                <strong>Servicios:</strong> $
                {rowData.detalles.subtotalServicios}
              </div>
            )}
            {rowData.detalles.subtotalRepuestos && (
              <div>
                <strong>Repuestos:</strong> $
                {rowData.detalles.subtotalRepuestos}
              </div>
            )}
          </div>
        );
      }
    }

    return rowData.descripcion;
  };

  const costoBodyTemplate = (rowData: WorkOrderHistory) => {
    if (rowData.costoAdicional && rowData.costoAdicional > 0) {
      return `$${rowData.costoAdicional.toFixed(2)}`;
    }
    return "-";
  };

  return (
    <Dialog
      visible={visible}
      style={{ width: "80vw" }}
      header={`Historial - Orden ${workOrderNumber}`}
      modal
      onHide={onHide}
      maximizable
      breakpoints={{ "960px": "90vw", "641px": "95vw" }}
    >
      {loading ? (
        <div className="flex justify-content-center align-items-center p-4">
          <ProgressSpinner />
        </div>
      ) : (
        <DataTable
          value={history}
          paginator
          rows={10}
          responsiveLayout="scroll"
          emptyMessage="No hay historial disponible"
          sortField="fecha"
          sortOrder={-1}
          size="small"
        >
          <Column
            field="tipo"
            header="Tipo"
            body={tipoBodyTemplate}
            sortable
            style={{ width: "150px" }}
          />
          <Column
            field="descripcion"
            header="Descripción"
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            header="Detalles"
            body={detallesBodyTemplate}
            style={{ minWidth: "250px" }}
          />
          <Column
            header="Usuario"
            body={usuarioBodyTemplate}
            sortable
            style={{ width: "150px" }}
          />
          <Column
            field="fecha"
            header="Fecha"
            body={fechaBodyTemplate}
            sortable
            style={{ width: "150px" }}
          />
          <Column
            header="Costo Adicional"
            body={costoBodyTemplate}
            style={{ width: "120px" }}
          />
        </DataTable>
      )}
    </Dialog>
  );
};

export default WorkOrderHistoryDialog;
