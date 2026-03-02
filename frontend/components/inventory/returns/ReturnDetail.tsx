"use client";

import {
  ReturnOrder,
  RETURN_STATUS_CONFIG,
  RETURN_TYPE_CONFIG,
} from "@/app/api/inventory/returnService";
import { Badge } from "primereact/badge";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

interface ReturnDetailProps {
  returnOrder: ReturnOrder;
}

const ReturnDetail = ({ returnOrder }: ReturnDetailProps) => {
  const statusConfig = RETURN_STATUS_CONFIG[returnOrder.status];
  const typeConfig = RETURN_TYPE_CONFIG[returnOrder.type];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="font-semibold block text-gray-500">
              Nº Devolución
            </label>
            <p className="text-lg font-bold">{returnOrder.returnNumber}</p>
          </div>
          <div>
            <label className="font-semibold block text-gray-500">Estado</label>
            <div className="flex items-center gap-2 mt-1">
              <i className={statusConfig.icon}></i>
              <Badge
                value={statusConfig.label}
                severity={statusConfig.severity as any}
              />
            </div>
          </div>
          <div>
            <label className="font-semibold block text-gray-500">
              Crear En
            </label>
            <p className="text-sm">
              {new Date(returnOrder.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="border-t pt-4" />
      </div>

      {/* Type and Warehouse Info */}
      <div className="space-y-2">
        <label className="font-semibold block text-lg">
          Información General
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-gray-500 block">
              Tipo de Devolución
            </label>
            <div className="flex items-center gap-2 mt-1">
              <i className={typeConfig.icon}></i>
              <span>{typeConfig.label}</span>
            </div>
          </div>
          <div>
            <label className="font-semibold text-gray-500 block">Almacén</label>
            <p>{returnOrder.warehouseId}</p>
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="space-y-2">
        <label className="font-semibold block text-lg">Razón</label>
        <div className="bg-gray-50 p-3 rounded border border-gray-200">
          <p>{returnOrder.reason}</p>
        </div>
      </div>

      {/* Approval Info */}
      {returnOrder.approvedAt && (
        <div className="space-y-2">
          <label className="font-semibold block text-lg">
            Información de Aprobación
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-gray-500 block">
                Aprobado por
              </label>
              <p>{returnOrder.approvedBy || "-"}</p>
            </div>
            <div>
              <label className="font-semibold text-gray-500 block">
                Aprobado en
              </label>
              <p>{new Date(returnOrder.approvedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Processing Info */}
      {returnOrder.processedAt && (
        <div className="space-y-2">
          <label className="font-semibold block text-lg">
            Información de Procesamiento
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-gray-500 block">
                Procesado por
              </label>
              <p>{returnOrder.processedBy || "-"}</p>
            </div>
            <div>
              <label className="font-semibold text-gray-500 block">
                Procesado en
              </label>
              <p>{new Date(returnOrder.processedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-2">
        <label className="font-semibold block text-lg">Artículos</label>
        <DataTable value={returnOrder.items} responsiveLayout="scroll">
          <Column field="item.name" header="Artículo" />
          <Column field="item.sku" header="SKU" />
          <Column field="quantity" header="Cantidad" />
          <Column field="unitPrice" header="Precio Unitario" />
          <Column field="notes" header="Notas" />
        </DataTable>
      </div>

      {/* Notes */}
      {returnOrder.notes && (
        <div className="space-y-2">
          <label className="font-semibold block text-lg">Notas</label>
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <p className="whitespace-pre-wrap">{returnOrder.notes}</p>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-500 space-y-1 pt-4 border-t">
        <p>ID: {returnOrder.id}</p>
        <p>Creado por: {returnOrder.createdBy}</p>
        <p>
          Última actualización:{" "}
          {new Date(returnOrder.updatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default ReturnDetail;
