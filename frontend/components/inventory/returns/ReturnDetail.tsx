"use client";

import { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { Skeleton } from "primereact/skeleton";
import { Button } from "primereact/button";
import {
  ReturnOrder,
  ReturnStatus,
  RETURN_STATUS_CONFIG,
  RETURN_TYPE_CONFIG,
} from "@/app/api/inventory/returnService";
import warehouseService, { Warehouse } from "@/app/api/inventory/warehouseService";

interface ReturnDetailProps {
  returnOrder: ReturnOrder;
  onRefresh?: () => void;
}

const ReturnDetail = ({ returnOrder, onRefresh }: ReturnDetailProps) => {
  const statusConfig = RETURN_STATUS_CONFIG[returnOrder.status];
  const typeConfig = RETURN_TYPE_CONFIG[returnOrder.type];

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [warehouseLoading, setWarehouseLoading] = useState(false);

  useEffect(() => {
    if (!returnOrder.warehouseId) return;
    const fetchWarehouse = async () => {
      setWarehouseLoading(true);
      try {
        const res = await warehouseService.getById(returnOrder.warehouseId);
        setWarehouse(res.data ?? null);
      } catch {
        // silent — fallback to raw ID
      } finally {
        setWarehouseLoading(false);
      }
    };
    fetchWarehouse();
  }, [returnOrder.warehouseId]);

  const severityMap: Record<string, any> = {
    secondary: "secondary",
    warning: "warning",
    info: "info",
    success: "success",
    danger: "danger",
  };

  return (
    <div className="flex flex-column gap-4">

      {/* ── Header row ───────────────────────────────────────────────── */}
      <div className="grid">
        <div className="col-12 md:col-4">
          <span className="text-500 text-sm font-semibold block mb-1">Nº Devolución</span>
          <span className="text-xl font-bold">{returnOrder.returnNumber}</span>
        </div>
        <div className="col-12 md:col-4">
          <span className="text-500 text-sm font-semibold block mb-1">Estado</span>
          <Tag
            value={statusConfig.label}
            severity={severityMap[statusConfig.severity] ?? "info"}
            icon={statusConfig.icon}
          />
        </div>
        <div className="col-12 md:col-4">
          <span className="text-500 text-sm font-semibold block mb-1">Creado</span>
          <span>{new Date(returnOrder.createdAt).toLocaleDateString("es-VE")}</span>
        </div>
      </div>

      <Divider className="my-0" />

      {/* ── Información General ───────────────────────────────────────── */}
      <div>
        <p className="font-semibold text-lg mt-0 mb-3">Información General</p>
        <div className="grid">
          <div className="col-12 md:col-6">
            <span className="text-500 text-sm font-semibold block mb-1">Tipo de Devolución</span>
            <div className="flex align-items-center gap-2">
              <i className={typeConfig.icon} style={{ color: typeConfig.color }} />
              <span>{typeConfig.label}</span>
            </div>
          </div>
          <div className="col-12 md:col-6">
            <span className="text-500 text-sm font-semibold block mb-1">Almacén</span>
            {warehouseLoading ? (
              <Skeleton width="120px" height="1.2rem" />
            ) : (
              <span>{warehouse?.name ?? returnOrder.warehouseId}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Razón ────────────────────────────────────────────────────── */}
      <div>
        <span className="text-500 text-sm font-semibold block mb-1">Razón</span>
        <div className="surface-50 p-3 border-round border-1 surface-border">
          <p className="m-0">{returnOrder.reason}</p>
        </div>
      </div>

      {/* ── Notas ────────────────────────────────────────────────────── */}
      {returnOrder.notes && (
        <div>
          <span className="text-500 text-sm font-semibold block mb-1">Notas</span>
          <div className="surface-50 p-3 border-round border-1 surface-border">
            <p className="m-0 white-space-pre-wrap">{returnOrder.notes}</p>
          </div>
        </div>
      )}

      {/* ── Aprobación ───────────────────────────────────────────────── */}
      {returnOrder.approvedAt && (
        <>
          <Divider className="my-0" />
          <div>
            <p className="font-semibold text-lg mt-0 mb-3">Información de Aprobación</p>
            <div className="grid">
              <div className="col-12 md:col-6">
                <span className="text-500 text-sm font-semibold block mb-1">Aprobado por</span>
                <span>{returnOrder.approvedBy || "—"}</span>
              </div>
              <div className="col-12 md:col-6">
                <span className="text-500 text-sm font-semibold block mb-1">Aprobado en</span>
                <span>{new Date(returnOrder.approvedAt).toLocaleString("es-VE")}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Procesamiento ─────────────────────────────────────────────── */}
      {returnOrder.processedAt && (
        <>
          <Divider className="my-0" />
          <div>
            <p className="font-semibold text-lg mt-0 mb-3">Información de Procesamiento</p>
            <div className="grid">
              <div className="col-12 md:col-6">
                <span className="text-500 text-sm font-semibold block mb-1">
                  {returnOrder.status === ReturnStatus.REJECTED ? "Rechazado por" : "Procesado por"}
                </span>
                <span>{returnOrder.processedBy || "—"}</span>
              </div>
              <div className="col-12 md:col-6">
                <span className="text-500 text-sm font-semibold block mb-1">
                  {returnOrder.status === ReturnStatus.REJECTED ? "Rechazado en" : "Procesado en"}
                </span>
                <span>{new Date(returnOrder.processedAt).toLocaleString("es-VE")}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Artículos ────────────────────────────────────────────────── */}
      <Divider className="my-0" />
      <div>
        <p className="font-semibold text-lg mt-0 mb-3">
          Artículos ({returnOrder.items?.length ?? 0})
        </p>
        <DataTable
          value={returnOrder.items ?? []}
          size="small"
          emptyMessage="Sin artículos registrados"
          stripedRows
        >
          <Column
            header="Artículo"
            style={{ minWidth: "180px" }}
            body={(r) => (
              <div className="flex flex-column">
                <span className="font-semibold">{r.item?.name ?? r.itemId}</span>
                {r.item?.sku && (
                  <span className="text-500 text-xs">{r.item.sku}</span>
                )}
              </div>
            )}
          />
          <Column
            field="quantity"
            header="Cantidad"
            style={{ minWidth: "100px" }}
          />
          <Column
            header="Precio Unit."
            style={{ minWidth: "130px" }}
            body={(r) =>
              r.unitPrice != null
                ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(r.unitPrice)
                : <span className="text-500">—</span>
            }
          />
          <Column
            header="Total"
            style={{ minWidth: "130px" }}
            body={(r) =>
              r.unitPrice != null
                ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(r.unitPrice * r.quantity)
                : <span className="text-500">—</span>
            }
          />
          <Column
            field="notes"
            header="Notas"
            style={{ minWidth: "150px" }}
            body={(r) => r.notes || <span className="text-500">—</span>}
          />
        </DataTable>
      </div>

      {/* ── Metadata ─────────────────────────────────────────────────── */}
      <div className="text-xs text-500 pt-2 border-top-1 surface-border flex flex-column gap-1">
        <span>ID: {returnOrder.id}</span>
        <span>Creado por: {returnOrder.createdBy}</span>
        <span>Última actualización: {new Date(returnOrder.updatedAt).toLocaleString("es-VE")}</span>
      </div>

      {/* ── Refresh button (optional) ─────────────────────────────────── */}
      {onRefresh && (
        <div className="flex justify-content-end">
          <Button
            icon="pi pi-refresh"
            label="Actualizar"
            severity="secondary"
            outlined
            size="small"
            onClick={onRefresh}
          />
        </div>
      )}
    </div>
  );
};

export default ReturnDetail;
