"use client";
import React from "react";
import { Tag } from "primereact/tag";
import {
  SerialNumber,
  SERIAL_STATUS_CONFIG,
} from "@/types/serialNumber.interface";

interface SerialNumberDetailProps {
  serial: SerialNumber;
}

export default function SerialNumberDetail({
  serial,
}: SerialNumberDetailProps) {
  const config = SERIAL_STATUS_CONFIG[serial.status];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-semibold text-gray-600 block mb-1">
            Número de Serie
          </label>
          <p className="text-lg font-mono">{serial.serialNumber}</p>
        </div>

        <div>
          <label className="font-semibold text-gray-600 block mb-1">SKU</label>
          <p className="text-lg">{serial.sku}</p>
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
          <p className="text-lg">{serial.warehouse?.name || "N/A"}</p>
        </div>

        <div>
          <label className="font-semibold text-gray-600 block mb-1">Lote</label>
          {serial.batch ? (
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold">
                {serial.batch.batchNumber}
              </p>
              <p className="text-sm text-gray-500">
                Vence:{" "}
                {new Date(serial.batch.expiryDate).toLocaleDateString("es-ES")}
              </p>
            </div>
          ) : (
            <p className="text-lg">N/A</p>
          )}
        </div>

        <div>
          <label className="font-semibold text-gray-600 block mb-1">
            Orden de Compra
          </label>
          <p className="text-lg">{serial.purchaseOrderNumber || "N/A"}</p>
        </div>

        <div>
          <label className="font-semibold text-gray-600 block mb-1">
            Ubicación
          </label>
          <p className="text-lg">{serial.location || "N/A"}</p>
        </div>

        {serial.notes && (
          <div className="col-span-2">
            <label className="font-semibold text-gray-600 block mb-1">
              Notas
            </label>
            <p className="text-base">{serial.notes}</p>
          </div>
        )}
      </div>

      <div className="pt-4 border-t flex flex-col gap-2 text-sm text-gray-500">
        <p>Creado: {new Date(serial.createdAt).toLocaleDateString("es-ES")}</p>
        <p>
          Actualizado: {new Date(serial.updatedAt).toLocaleDateString("es-ES")}
        </p>
      </div>
    </div>
  );
}
