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
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Controller, useForm } from "react-hook-form";
import { updateItemCountedQuantity } from "../../../app/api/inventory/cycleCountService";

interface CycleCountDetailProps {
  cycleCount: CycleCount;
}

export default function CycleCountDetail({
  cycleCount,
}: CycleCountDetailProps) {
  const statusConfig = CYCLE_COUNT_STATUS_CONFIG[cycleCount.status];
  const toast = useRef<Toast>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const { control, getValues, reset } = useForm();

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
    const variance = (rowData.countedQuantity || 0) - rowData.expectedQuantity;
    if (variance === 0) return "";
    if (Math.abs(variance) <= 5) return "bg-yellow-50";
    return "bg-red-50";
  };

  const varianceBadgeTemplate = (rowData: any) => {
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
          value={rowData.countedQuantity || 0}
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
          className="w-full"
        />
      );
    }
    return <span>{rowData.countedQuantity || "N/A"}</span>;
  };

  return (
    <div className="space-y-4">
      <Toast ref={toast} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-semibold text-gray-600">
            # Conteo
          </label>
          <p className="mt-1 text-lg font-bold">
            {cycleCount.cycleCountNumber}
          </p>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-600">Estado</label>
          <div className="mt-1">
            <Badge
              value={statusConfig.label}
              severity={statusConfig.severity}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-600">Almacén</label>
          <p className="mt-1 text-lg">{cycleCount.warehouse?.name}</p>
        </div>
      </div>

      <Divider />

      <div>
        <h3 className="mb-3 text-lg font-semibold">Artículos en Conteo</h3>
        <p className="mb-4 text-sm text-gray-600">
          <span className="inline-block mr-4">
            <span className="inline-block w-3 h-3 bg-yellow-100 rounded mr-1"></span>
            Varianza pequeña (±5)
          </span>
          <span className="inline-block">
            <span className="inline-block w-3 h-3 bg-red-100 rounded mr-1"></span>
            Varianza grande (&gt;5)
          </span>
        </p>

        <DataTable
          value={cycleCount.items}
          rowClassName={varianceRowClass}
          className="w-full"
        >
          <Column
            field="item.sku"
            header="SKU"
            body={(rowData: any) => rowData.item?.sku}
            style={{ width: "100px" }}
          />
          <Column
            field="item.name"
            header="Artículo"
            body={(rowData: any) => rowData.item?.name}
          />
          <Column
            field="expectedQuantity"
            header="Stock Sistema"
            style={{ width: "100px" }}
          />
          <Column
            field="countedQuantity"
            header="Stock Contado"
            body={countedQuantityTemplate}
            style={{ width: "120px" }}
          />
          <Column
            field="variance"
            header="Varianza"
            body={varianceBadgeTemplate}
            style={{ width: "100px" }}
          />
          {cycleCount.items.some((item) => item.location) && (
            <Column
              field="location"
              header="Ubicación"
              style={{ width: "120px" }}
            />
          )}
        </DataTable>
      </div>

      {cycleCount.notes && (
        <>
          <Divider />
          <div>
            <label className="text-sm font-semibold text-gray-600">Notas</label>
            <p className="mt-2 text-gray-700">{cycleCount.notes}</p>
          </div>
        </>
      )}
    </div>
  );
}
