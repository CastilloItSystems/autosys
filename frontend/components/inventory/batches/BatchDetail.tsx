"use client";
import React from "react";
import { Tag } from "primereact/tag";
import { Badge } from "primereact/badge";
import {
  Batch,
  BATCH_STATUS_CONFIG,
  getDaysUntilExpiry,
} from "@/types/batch.interface";

interface BatchDetailProps {
  batch: Batch;
}

export default function BatchDetail({ batch }: BatchDetailProps) {
  const config = BATCH_STATUS_CONFIG[batch.status];
  const daysUntilExpiry = getDaysUntilExpiry(batch.expiryDate);
  const manufacureDate = new Date(batch.manufactureDate).toLocaleDateString(
    "es-ES",
  );
  const expiryDate = new Date(batch.expiryDate).toLocaleDateString("es-ES");
  const remaining = batch.quantityRemaining || batch.quantity;
  const used = batch.quantityUsed || 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-semibold text-gray-600 block mb-1">
            Número de Lote
          </label>
          <p className="text-lg">{batch.batchNumber}</p>
        </div>

        <div>
          <label className="font-semibold text-gray-600 block mb-1">SKU</label>
          <p className="text-lg">{batch.sku}</p>
        </div>

        <div>
          <label className="font-semibold text-gray-600 block mb-1">
            Estado
          </label>
          <Tag
            value={config.label}
            severity={config.severity}
            icon={config.icon}
          />
        </div>

        <div>
          <label className="font-semibold text-gray-600 block mb-1">
            Almacén
          </label>
          <p className="text-lg">{batch.warehouse?.name || "N/A"}</p>
        </div>

        <div>
          <label className="font-semibold text-gray-600 block mb-1">
            Fecha de Fabricación
          </label>
          <p className="text-lg">{manufacureDate}</p>
        </div>

        <div>
          <label className="font-semibold text-gray-600 block mb-1">
            Fecha de Vencimiento
          </label>
          <div className="flex items-center gap-2">
            <p className="text-lg">{expiryDate}</p>
            {daysUntilExpiry < 0 ? (
              <Badge value="Vencido" severity="danger" />
            ) : daysUntilExpiry <= 30 ? (
              <Badge value={`${daysUntilExpiry}d`} severity="warning" />
            ) : (
              <Badge value={`${daysUntilExpiry}d`} severity="success" />
            )}
          </div>
        </div>

        <div>
          <label className="font-semibold text-gray-600 block mb-1">
            Cantidad Total
          </label>
          <p className="text-lg">{batch.quantity}</p>
        </div>

        <div>
          <label className="font-semibold text-gray-600 block mb-1">
            Cantidad Usada
          </label>
          <p className="text-lg">{used}</p>
        </div>

        <div>
          <label className="font-semibold text-gray-600 block mb-1">
            Cantidad Disponible
          </label>
          <p className="text-lg font-semibold text-green-600">{remaining}</p>
        </div>

        {batch.notes && (
          <div className="col-span-2">
            <label className="font-semibold text-gray-600 block mb-1">
              Notas
            </label>
            <p className="text-base">{batch.notes}</p>
          </div>
        )}
      </div>

      <div className="pt-4 border-t flex flex-col gap-2 text-sm text-gray-500">
        <p>Creado: {new Date(batch.createdAt).toLocaleDateString("es-ES")}</p>
        <p>
          Actualizado: {new Date(batch.updatedAt).toLocaleDateString("es-ES")}
        </p>
      </div>
    </div>
  );
}
