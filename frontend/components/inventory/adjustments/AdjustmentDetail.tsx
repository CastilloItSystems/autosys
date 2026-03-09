"use client";

import React from "react";
import {
  Adjustment,
  ADJUSTMENT_STATUS_LABELS,
  ADJUSTMENT_STATUS_SEVERITY,
} from "@/app/api/inventory/adjustmentService";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

interface Props {
  adjustment: Adjustment;
}

export default function AdjustmentDetail({ adjustment }: Props) {
  return (
    <div className="flex flex-column gap-4">
      <div className="grid">
        <div className="col-12 md:col-4">
          <span className="text-500 font-medium block mb-2"># Ajuste</span>
          <span className="text-900 text-xl font-bold">
            {adjustment.adjustmentNumber}
          </span>
        </div>
        <div className="col-12 md:col-4">
          <span className="text-500 font-medium block mb-2">Estado</span>
          <Tag
            value={ADJUSTMENT_STATUS_LABELS[adjustment.status]}
            severity={ADJUSTMENT_STATUS_SEVERITY[adjustment.status]}
          />
        </div>
        <div className="col-12 md:col-4">
          <span className="text-500 font-medium block mb-2">
            Fecha de Creación
          </span>
          <span className="text-900 text-lg">
            {new Date(adjustment.createdAt).toLocaleDateString("es-CL")}
          </span>
        </div>
      </div>

      <Divider className="my-0" />

      <div className="grid">
        <div className="col-12 md:col-6">
          <div className="p-3 surface-50 border-round h-full border-left-3 border-blue-500">
            <div className="flex align-items-center gap-2 mb-2">
              <i className="pi pi-box text-blue-500 text-xl" />
              <span className="text-700 font-bold">Almacén</span>
            </div>
            <div className="text-900 text-xl font-medium ml-5">
              {adjustment.warehouse?.name || "—"}
            </div>
            <div className="text-sm text-gray-500 ml-5">
              {adjustment.warehouse?.code}
            </div>
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="p-3 surface-50 border-round h-full border-left-3 border-green-500">
            <div className="flex align-items-center gap-2 mb-2">
              <i className="pi pi-info-circle text-green-500 text-xl" />
              <span className="text-700 font-bold">Motivo</span>
            </div>
            <div className="text-900 text-xl font-medium ml-5">
              {adjustment.reason}
            </div>
          </div>
        </div>
      </div>

      <Divider />

      <div>
        <h3 className="mb-3 text-lg font-semibold">Artículos</h3>
        <DataTable value={adjustment.items} className="w-full">
          <Column
            header="Artículo"
            body={(rowData: any) => rowData.item?.name || "—"}
          />
          <Column
            header="SKU"
            body={(rowData: any) => rowData.item?.sku || "—"}
            style={{ width: "120px" }}
          />
          <Column
            field="quantityChange"
            header="Cambio"
            style={{ width: "120px" }}
          />
          <Column
            field="currentQuantity"
            header="Actual"
            style={{ width: "120px" }}
          />
          <Column
            field="newQuantity"
            header="Nuevo"
            style={{ width: "120px" }}
          />
        </DataTable>
      </div>

      {adjustment.notes && (
        <>
          <Divider />
          <div>
            <label className="text-sm font-semibold text-gray-600">Notas</label>
            <p className="mt-2 text-gray-700">{adjustment.notes}</p>
          </div>
        </>
      )}
    </div>
  );
}
