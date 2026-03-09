"use client";

import React, { useState, useRef } from "react";
import {
  CycleCount,
  CYCLE_COUNT_STATUS_CONFIG,
  CycleCountStatus,
} from "../../../libs/interfaces/inventory/cycleCount.interface";
import { Badge } from "primereact/badge";
import { Divider } from "primereact/divider";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { updateItemCountedQuantity } from "../../../app/api/inventory/cycleCountService";
import { Message } from "primereact/message";

interface CycleCountDetailProps {
  cycleCount: CycleCount;
}

export default function CycleCountDetail({
  cycleCount,
}: CycleCountDetailProps) {
  const statusConfig = CYCLE_COUNT_STATUS_CONFIG[cycleCount.status];
  const toast = useRef<Toast>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const handleUpdateCountedQuantity = async (
    itemId: string,
    countedQuantity: number,
  ) => {
    try {
      setUpdatingItemId(itemId);
      await updateItemCountedQuantity(cycleCount.id, itemId, countedQuantity);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Cantidad actualizada",
        life: 2000,
      });
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al actualizar cantidad",
        life: 3000,
      });
    } finally {
      setUpdatingItemId(null);
    }
  };

  const varianceRowClass = (rowData: any) => {
    // Only highlight variance if counted quantity is set
    if (
      rowData.countedQuantity === null ||
      rowData.countedQuantity === undefined
    )
      return "";

    const variance = (rowData.countedQuantity || 0) - rowData.expectedQuantity;
    if (variance === 0) return "";
    if (Math.abs(variance) <= 5) return "bg-yellow-50";
    return "bg-red-50";
  };

  const varianceBodyTemplate = (rowData: any) => {
    if (
      rowData.countedQuantity === null ||
      rowData.countedQuantity === undefined
    )
      return <span className="text-gray-400">-</span>;

    const variance = (rowData.countedQuantity || 0) - rowData.expectedQuantity;
    if (variance === 0) {
      return <Badge value="0" severity="success" />;
    }
    if (variance > 0) {
      return <Badge value={`+${variance}`} severity="warning" />;
    }
    return <Badge value={`${variance}`} severity="danger" />;
  };

  const countedQuantityTemplate = (rowData: any) => {
    if (cycleCount.status === CycleCountStatus.IN_PROGRESS) {
      return (
        <InputNumber
          value={rowData.countedQuantity}
          onValueChange={(e) => {
            if (
              e.value !== undefined &&
              e.value !== null &&
              e.value !== rowData.countedQuantity
            ) {
              handleUpdateCountedQuantity(rowData.itemId, e.value);
            }
          }}
          min={0}
          placeholder="Ingrese cantidad"
          className="w-full"
          pt={{
            input: { className: "w-full text-right" },
          }}
        />
      );
    }
    return <span className="font-bold">{rowData.countedQuantity ?? "—"}</span>;
  };

  const locationTemplate = (rowData: any) => {
    // Fallback: If item is not populated, check if it's available in other properties
    // or display a placeholder.
    const itemName =
      rowData.item?.name || rowData.name || "Artículo Desconocido";
    const itemSku = rowData.item?.sku || rowData.sku || "";

    return (
      <div className="flex flex-column">
        <span className="font-medium">{itemName}</span>
        {itemSku && (
          <span className="text-sm text-500 font-mono">{itemSku}</span>
        )}
        {rowData.location && (
          <span className="text-sm text-500">
            <i className="pi pi-map-marker mr-1"></i>
            {rowData.location}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-column gap-4">
      <Toast ref={toast} />

      {/* Header Info */}
      <div className="grid">
        <div className="col-12 md:col-4">
          <span className="text-500 font-medium block mb-2"># Conteo</span>
          <span className="text-900 text-xl font-bold">
            {cycleCount.cycleCountNumber}
          </span>
        </div>
        <div className="col-12 md:col-4">
          <span className="text-500 font-medium block mb-2">Estado</span>
          <Badge
            value={statusConfig.label}
            severity={statusConfig.severity}
            size="large"
          />
        </div>
        <div className="col-12 md:col-4">
          <span className="text-500 font-medium block mb-2">
            Fecha de Creación
          </span>
          <span className="text-900 text-lg">
            {new Date(cycleCount.createdAt).toLocaleDateString("es-ES")}
          </span>
        </div>
      </div>

      <Divider className="my-0" />

      {/* Warehouse Info */}
      <div className="grid">
        <div className="col-12">
          <div className="p-3 surface-50 border-round h-full border-left-3 border-blue-500">
            <div className="flex align-items-center gap-2 mb-2">
              <i className="pi pi-box text-blue-500 text-xl" />
              <span className="text-700 font-bold">Almacén</span>
            </div>
            <div className="text-900 text-xl font-medium ml-5">
              {cycleCount.warehouse?.name || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Approval / Completion Info */}
      {cycleCount.completedAt && (
        <div className="grid mt-2">
          <div className="col-12 md:col-6">
            <div className="surface-50 p-3 border-round flex align-items-center gap-3 border-left-3 border-green-500 h-full">
              <i className="pi pi-check-square text-green-500 text-xl" />
              <div>
                <span className="text-700 font-bold block">Completado por</span>
                <span className="text-900">
                  {cycleCount.completedBy || "—"}
                </span>
                <div className="text-sm text-500 mt-1">
                  {new Date(cycleCount.completedAt).toLocaleDateString(
                    "es-ES",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </div>
              </div>
            </div>
          </div>
          {cycleCount.approvedAt && (
            <div className="col-12 md:col-6">
              <div className="surface-50 p-3 border-round flex align-items-center gap-3 border-left-3 border-orange-500 h-full">
                <i className="pi pi-check-circle text-orange-500 text-xl" />
                <div>
                  <span className="text-700 font-bold block">Aprobado por</span>
                  <span className="text-900">
                    {cycleCount.approvedBy || "—"}
                  </span>
                  <div className="text-sm text-500 mt-1">
                    {new Date(cycleCount.approvedAt).toLocaleDateString(
                      "es-ES",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rejection Info */}
      {cycleCount.status === CycleCountStatus.REJECTED && (
        <Message
          severity="error"
          className="w-full mt-2"
          content={
            <div className="flex flex-column gap-2">
              <span className="font-semibold">Rechazado</span>
              {/* Add rejection details if available in the interface */}
            </div>
          }
        />
      )}

      <Divider />

      {/* Items Table */}
      <div>
        <div className="flex justify-content-between align-items-center mb-3">
          <h3 className="text-lg font-semibold m-0">Artículos en Conteo</h3>
          <div className="flex gap-3 text-sm">
            <span className="flex align-items-center gap-2">
              <span className="w-1rem h-1rem bg-yellow-50 border-1 border-yellow-200 border-round"></span>
              <span>Varianza baja (±5)</span>
            </span>
            <span className="flex align-items-center gap-2">
              <span className="w-1rem h-1rem bg-red-50 border-1 border-red-200 border-round"></span>
              <span>Varianza alta (&gt;5)</span>
            </span>
          </div>
        </div>

        <DataTable
          value={cycleCount.items}
          rowClassName={varianceRowClass}
          className="w-full"
          showGridlines
          stripedRows
        >
          <Column
            field="item.sku"
            header="SKU"
            body={(rowData: any) => rowData.item?.sku || "—"}
            style={{ width: "120px" }}
          />
          <Column field="item.name" header="Artículo" body={locationTemplate} />
          <Column
            field="expectedQuantity"
            header="Stock Sistema (Snapshot)"
            align="right"
            body={(rowData: any) => rowData.expectedQuantity}
            style={{ width: "180px" }}
          />
          <Column
            field="countedQuantity"
            header="Stock Contado"
            body={countedQuantityTemplate}
            align="right"
            style={{ width: "150px" }}
          />
          <Column
            header="Varianza"
            body={varianceBodyTemplate}
            align="center"
            style={{ width: "120px" }}
          />
        </DataTable>
      </div>

      {cycleCount.notes && (
        <>
          <Divider />
          <div className="surface-50 p-3 border-round">
            <span className="text-700 font-bold block mb-2">Notas</span>
            <p className="m-0 text-gray-700 line-height-3">
              {cycleCount.notes}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
