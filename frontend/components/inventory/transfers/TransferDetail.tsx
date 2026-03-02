"use client";

import React from "react";
import {
  Transfer,
  TRANSFER_STATUS_CONFIG,
} from "../../../libs/interfaces/inventory/transfer.interface";
import { Badge } from "primereact/badge";
import { Divider } from "primereact/divider";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

interface TransferDetailProps {
  transfer: Transfer;
}

export default function TransferDetail({ transfer }: TransferDetailProps) {
  const statusConfig = TRANSFER_STATUS_CONFIG[transfer.status];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-semibold text-gray-600">
            # Transferencia
          </label>
          <p className="mt-1 text-lg font-bold">{transfer.transferNumber}</p>
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
          <label className="text-sm font-semibold text-gray-600">
            Fecha de Creación
          </label>
          <p className="mt-1 text-lg">
            {new Date(transfer.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <Divider />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-gray-600">
            Almacén Origen
          </label>
          <p className="mt-1 text-lg">{transfer.fromWarehouse?.name}</p>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-600">
            Almacén Destino
          </label>
          <p className="mt-1 text-lg">{transfer.toWarehouse?.name}</p>
        </div>
      </div>

      {transfer.sentAt && (
        <div>
          <label className="text-sm font-semibold text-gray-600">
            Fecha de Envío
          </label>
          <p className="mt-1 text-lg">
            {new Date(transfer.sentAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {transfer.receivedAt && (
        <div>
          <label className="text-sm font-semibold text-gray-600">
            Fecha de Recepción
          </label>
          <p className="mt-1 text-lg">
            {new Date(transfer.receivedAt).toLocaleDateString()}
          </p>
        </div>
      )}

      <Divider />

      <div>
        <h3 className="mb-3 text-lg font-semibold">Artículos</h3>
        <DataTable value={transfer.items} className="w-full">
          <Column
            field="item.name"
            header="Artículo"
            body={(rowData: any) => rowData.item?.name}
          />
          <Column
            field="item.sku"
            header="SKU"
            body={(rowData: any) => rowData.item?.sku}
            style={{ width: "100px" }}
          />
          <Column
            field="quantity"
            header="Cantidad"
            style={{ width: "80px" }}
          />
          <Column
            field="unitCost"
            header="Costo Unitario"
            style={{ width: "120px" }}
            body={(rowData: any) =>
              `$${rowData.unitCost?.toFixed(2) || "0.00"}`
            }
          />
        </DataTable>
      </div>

      {transfer.notes && (
        <>
          <Divider />
          <div>
            <label className="text-sm font-semibold text-gray-600">Notas</label>
            <p className="mt-2 text-gray-700">{transfer.notes}</p>
          </div>
        </>
      )}
    </div>
  );
}
