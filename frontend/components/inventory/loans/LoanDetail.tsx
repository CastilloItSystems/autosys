"use client";

import { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { Skeleton } from "primereact/skeleton";
import { Button } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";
import {
  Loan,
  LoanItem,
  LoanStatus,
  LOAN_STATUS_CONFIG,
} from "@/app/api/inventory/loanService";
import warehouseService, { Warehouse } from "@/app/api/inventory/warehouseService";

interface LoanDetailProps {
  loan: Loan;
  onReturn?: () => void;
  onRefresh?: () => void;
}

const LoanDetail = ({ loan, onReturn, onRefresh }: LoanDetailProps) => {
  const statusConfig = LOAN_STATUS_CONFIG[loan.status];

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [warehouseLoading, setWarehouseLoading] = useState(false);

  const severityMap: Record<string, any> = {
    secondary: "secondary",
    warning: "warning",
    info: "info",
    success: "success",
    danger: "danger",
  };

  useEffect(() => {
    if (!loan.warehouseId) return;
    const fetchWarehouse = async () => {
      setWarehouseLoading(true);
      try {
        const res = await warehouseService.getById(loan.warehouseId);
        setWarehouse(res.data ?? null);
      } catch {
        // silent — fallback to raw ID
      } finally {
        setWarehouseLoading(false);
      }
    };
    fetchWarehouse();
  }, [loan.warehouseId]);

  const isActive = [LoanStatus.ACTIVE, LoanStatus.OVERDUE].includes(loan.status);

  const due = new Date(loan.dueDate);
  const today = new Date();
  const isOverdue = due < today && loan.status === LoanStatus.ACTIVE;
  const daysOverdue = isOverdue
    ? Math.floor((today.getTime() - due.getTime()) / 86400000)
    : 0;
  const daysUntil = !isOverdue
    ? Math.floor((due.getTime() - today.getTime()) / 86400000)
    : 0;

  // ── Return progress per item ────────────────────────────────────────────────

  const returnProgressTemplate = (item: LoanItem) => {
    const pct =
      item.quantityLoaned > 0
        ? Math.round((item.quantityReturned / item.quantityLoaned) * 100)
        : 0;
    const remaining = item.quantityLoaned - item.quantityReturned;

    if (pct >= 100) {
      return <Tag value="Devuelto" severity="success" icon="pi pi-check" />;
    }
    if (pct === 0) {
      return (
        <div className="flex flex-column gap-1">
          <span className="text-xs text-500">
            0 / {item.quantityLoaned}
          </span>
          <ProgressBar value={0} style={{ height: "6px" }} showValue={false} />
        </div>
      );
    }
    return (
      <div className="flex flex-column gap-1">
        <div className="flex align-items-center justify-content-between">
          <span className="text-xs text-500">
            {item.quantityReturned} / {item.quantityLoaned}
          </span>
          <Tag
            value={`${remaining} pendiente${remaining > 1 ? "s" : ""}`}
            severity="warning"
          />
        </div>
        <ProgressBar value={pct} style={{ height: "6px" }} showValue={false} />
      </div>
    );
  };

  return (
    <div className="flex flex-column gap-4">

      {/* ── Header row ───────────────────────────────────────────────── */}
      <div className="grid">
        <div className="col-12 md:col-4">
          <span className="text-500 text-sm font-semibold block mb-1">Nº Préstamo</span>
          <span className="text-xl font-bold">{loan.loanNumber}</span>
        </div>
        <div className="col-12 md:col-4">
          <span className="text-500 text-sm font-semibold block mb-1">Estado</span>
          <div className="flex align-items-center gap-2 flex-wrap">
            <Tag
              value={statusConfig.label}
              severity={severityMap[statusConfig.severity] ?? "info"}
              icon={statusConfig.icon}
            />
            {isOverdue && (
              <Tag value={`${daysOverdue}d vencido`} severity="danger" />
            )}
            {!isOverdue &&
              daysUntil <= 7 &&
              loan.status === LoanStatus.ACTIVE && (
                <Tag value={`${daysUntil}d restantes`} severity="warning" />
              )}
          </div>
        </div>
        <div className="col-12 md:col-4">
          <span className="text-500 text-sm font-semibold block mb-1">Creado</span>
          <span>{new Date(loan.createdAt).toLocaleDateString("es-VE")}</span>
        </div>
      </div>

      <Divider className="my-0" />

      {/* ── Prestatario ──────────────────────────────────────────────── */}
      <div>
        <p className="font-semibold text-lg mt-0 mb-3">Información del Prestatario</p>
        <div className="grid">
          <div className="col-12 md:col-6">
            <span className="text-500 text-sm font-semibold block mb-1">Nombre</span>
            <span className="font-medium">{loan.borrowerName}</span>
          </div>
          {loan.borrowerId && (
            <div className="col-12 md:col-6">
              <span className="text-500 text-sm font-semibold block mb-1">ID Prestatario</span>
              <span>{loan.borrowerId}</span>
            </div>
          )}
        </div>
      </div>

      <Divider className="my-0" />

      {/* ── Detalles del préstamo ─────────────────────────────────────── */}
      <div>
        <p className="font-semibold text-lg mt-0 mb-3">Detalles del Préstamo</p>
        <div className="grid">
          <div className="col-12 md:col-6">
            <span className="text-500 text-sm font-semibold block mb-1">Almacén</span>
            {warehouseLoading ? (
              <Skeleton width="140px" height="1.2rem" />
            ) : (
              <span>{warehouse?.name ?? loan.warehouseId}</span>
            )}
          </div>
          {loan.purpose && (
            <div className="col-12 md:col-6">
              <span className="text-500 text-sm font-semibold block mb-1">Propósito</span>
              <span>{loan.purpose}</span>
            </div>
          )}
          <div className="col-12 md:col-6">
            <span className="text-500 text-sm font-semibold block mb-1">Fecha de Inicio</span>
            <span>{new Date(loan.startDate).toLocaleDateString("es-VE")}</span>
          </div>
          <div className="col-12 md:col-6">
            <span className="text-500 text-sm font-semibold block mb-1">Fecha de Devolución</span>
            <div className="flex align-items-center gap-2">
              <span>{new Date(loan.dueDate).toLocaleDateString("es-VE")}</span>
              {isOverdue && <Tag value="Vencido" severity="danger" />}
            </div>
          </div>
        </div>
      </div>

      {/* ── Notas ────────────────────────────────────────────────────── */}
      {loan.notes && (
        <>
          <Divider className="my-0" />
          <div>
            <span className="text-500 text-sm font-semibold block mb-1">Notas</span>
            <div className="surface-50 p-3 border-round border-1 surface-border">
              <p className="m-0 white-space-pre-wrap">{loan.notes}</p>
            </div>
          </div>
        </>
      )}

      {/* ── Aprobación ───────────────────────────────────────────────── */}
      {loan.approvedAt && (
        <>
          <Divider className="my-0" />
          <div>
            <p className="font-semibold text-lg mt-0 mb-3">Información de Aprobación</p>
            <div className="grid">
              <div className="col-12 md:col-6">
                <span className="text-500 text-sm font-semibold block mb-1">Aprobado por</span>
                <span>{loan.approvedBy || "—"}</span>
              </div>
              <div className="col-12 md:col-6">
                <span className="text-500 text-sm font-semibold block mb-1">Aprobado en</span>
                <span>{new Date(loan.approvedAt).toLocaleString("es-VE")}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Devolución ───────────────────────────────────────────────── */}
      {loan.returnedAt && (
        <>
          <Divider className="my-0" />
          <div>
            <p className="font-semibold text-lg mt-0 mb-3">Información de Devolución</p>
            <div className="grid">
              <div className="col-12 md:col-6">
                <span className="text-500 text-sm font-semibold block mb-1">Devuelto en</span>
                <span>{new Date(loan.returnedAt).toLocaleString("es-VE")}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Artículos ────────────────────────────────────────────────── */}
      <Divider className="my-0" />
      <div>
        <p className="font-semibold text-lg mt-0 mb-3">
          Artículos ({loan.items?.length ?? 0})
        </p>
        <DataTable
          value={loan.items ?? []}
          size="small"
          stripedRows
          emptyMessage="Sin artículos registrados"
        >
          <Column
            header="Artículo"
            style={{ minWidth: "180px" }}
            body={(r: LoanItem) => (
              <div className="flex flex-column">
                <span className="font-semibold">{r.item?.name ?? r.itemId}</span>
                {r.item?.sku && (
                  <span className="text-500 text-xs">{r.item.sku}</span>
                )}
              </div>
            )}
          />
          <Column
            field="quantityLoaned"
            header="Prestado"
            style={{ minWidth: "100px" }}
          />
          <Column
            header="Progreso devolución"
            style={{ minWidth: "200px" }}
            body={returnProgressTemplate}
          />
          <Column
            header="Costo Unit."
            style={{ minWidth: "120px" }}
            body={(r: LoanItem) =>
              r.unitCost != null ? (
                new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(r.unitCost)
              ) : (
                <span className="text-500">—</span>
              )
            }
          />
          <Column
            header="Total"
            style={{ minWidth: "120px" }}
            body={(r: LoanItem) =>
              r.unitCost != null ? (
                new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(r.unitCost * r.quantityLoaned)
              ) : (
                <span className="text-500">—</span>
              )
            }
          />
          <Column
            field="notes"
            header="Notas"
            style={{ minWidth: "150px" }}
            body={(r: LoanItem) => r.notes || <span className="text-500">—</span>}
          />
        </DataTable>
      </div>

      {/* ── Metadata ─────────────────────────────────────────────────── */}
      <div className="text-xs text-500 pt-2 border-top-1 surface-border flex flex-column gap-1">
        <span>ID: {loan.id}</span>
        <span>Creado por: {loan.createdBy}</span>
        <span>
          Última actualización:{" "}
          {new Date(loan.updatedAt).toLocaleString("es-VE")}
        </span>
      </div>

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <div className="flex justify-content-end gap-2">
        {onRefresh && (
          <Button
            icon="pi pi-refresh"
            label="Actualizar"
            severity="secondary"
            outlined
            size="small"
            onClick={onRefresh}
          />
        )}
        {isActive && onReturn && (
          <Button
            icon="pi pi-undo"
            label="Registrar Devolución"
            severity="info"
            size="small"
            onClick={onReturn}
          />
        )}
      </div>
    </div>
  );
};

export default LoanDetail;
