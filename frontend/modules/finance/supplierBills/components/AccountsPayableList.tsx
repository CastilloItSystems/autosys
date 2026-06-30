"use client";

import React, { useState, useRef, useMemo } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { Badge } from "primereact/badge";
import { ProgressBar } from "primereact/progressbar";
import { Skeleton } from "primereact/skeleton";
import { motion } from "framer-motion";
import type {
  AccountsPayableEntry,
  SupplierBill,
} from "../interfaces/supplierBill";
import { useAccountsPayableData } from "../hooks/useSupplierBillsData";
import RegisterPaymentDialog from "./RegisterPaymentDialog";
import { CURRENCY_SYMBOLS } from "@/utils/currencyFormat";

// ── Constants ─────────────────────────────────────────────────────────────

const STATUS_SEVERITY: Record<
  string,
  "success" | "warning" | "danger" | "secondary" | "info"
> = {
  PENDING_INVOICE: "info",
  PENDING: "warning",
  PARTIAL: "warning",
  PAID: "success",
  CANCELLED: "secondary",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_INVOICE: "Sin Factura",
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  PAID: "Pagada",
  CANCELLED: "Cancelada",
};

// ── Helpers ───────────────────────────────────────────────────────────────

const fmtAmt = (value: number, currency = "USD") => {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${sym} ${Number(value).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const fmtDate = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString("es-VE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// ── Component ─────────────────────────────────────────────────────────────

function AccountsPayableListContent() {
  const toast = useRef<Toast>(null);
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [selectedBill, setSelectedBill] = useState<SupplierBill | null>(null);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [search, setSearch] = useState("");
  const { entries, loading, mutate } = useAccountsPayableData() as {
    entries: AccountsPayableEntry[];
    loading: boolean;
    mutate: () => Promise<unknown>;
  };

  // ── Search filter ──────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.supplier.name.toLowerCase().includes(q) ||
        (e.supplier.taxId ?? "").toLowerCase().includes(q),
    );
  }, [entries, search]);

  // ── Summary totals ─────────────────────────────────────────────────────

  const summary = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    let overdueTotal = 0;
    let pendingInvoiceCount = 0;
    for (const e of entries) {
      for (const [cur, amt] of Object.entries(e.totalPendingByCurrency ?? {})) {
        byCurrency[cur] = (byCurrency[cur] ?? 0) + amt;
      }
      overdueTotal += e.overdueCount ?? 0;
      pendingInvoiceCount += e.bills.filter(
        (b) => b.status === "PENDING_INVOICE",
      ).length;
    }
    return { byCurrency, overdueTotal, pendingInvoiceCount };
  }, [entries]);

  // ── Aging by bill count ─────────────────────────────────────────────────

  const aging = useMemo(() => {
    const buckets: Record<string, number> = {
      corriente: 0,
      "1-30": 0,
      "31-60": 0,
      "61-90": 0,
      "+90": 0,
      "sin-vencimiento": 0,
    };
    const now = Date.now();
    for (const e of entries) {
      for (const bill of e.bills) {
        if (bill.status === "PAID" || bill.status === "CANCELLED") continue;
        if (!bill.dueDate) {
          buckets["sin-vencimiento"]++;
          continue;
        }
        const days = Math.floor(
          (now - new Date(bill.dueDate).getTime()) / 86_400_000,
        );
        if (days <= 0) buckets["corriente"]++;
        else if (days <= 30) buckets["1-30"]++;
        else if (days <= 60) buckets["31-60"]++;
        else if (days <= 90) buckets["61-90"]++;
        else buckets["+90"]++;
      }
    }
    return buckets;
  }, [entries]);

  const agingTotal = Object.values(aging).reduce((s, v) => s + v, 0);

  // ── Row expansion: bills per supplier ─────────────────────────────────

  const billsRowExpansion = (entry: AccountsPayableEntry) => (
    <div className="p-3">
      <DataTable
        value={entry.bills}
        size="small"
        stripedRows
        scrollable
        dataKey="id"
      >
        <Column
          field="internalNumber"
          header="# Interno"
          style={{ width: "9rem" }}
        />
        <Column
          header="# Factura"
          style={{ width: "9rem" }}
          body={(r: SupplierBill) =>
            r.billNumber ?? (
              <span className="text-400 text-xs italic">Sin registrar</span>
            )
          }
        />
        <Column
          header="Estado"
          style={{ width: "8rem" }}
          body={(r: SupplierBill) => (
            <Tag
              value={STATUS_LABELS[r.status] ?? r.status}
              severity={STATUS_SEVERITY[r.status] ?? "secondary"}
              className="text-xs"
            />
          )}
        />
        <Column
          header="Fecha"
          style={{ width: "8rem" }}
          body={(r: SupplierBill) => fmtDate(r.issueDate)}
        />
        <Column
          header="Vence"
          style={{ width: "8rem" }}
          body={(r: SupplierBill & { isOverdue?: boolean }) => (
            <span className={r.isOverdue ? "text-red-500 font-semibold" : ""}>
              {fmtDate(r.dueDate)}
              {r.isOverdue && (
                <i className="pi pi-exclamation-triangle ml-1 text-xs" />
              )}
            </span>
          )}
        />
        <Column
          header="OC"
          style={{ width: "9rem" }}
          body={(r: SupplierBill) =>
            (r as any).purchaseOrder?.orderNumber ?? "—"
          }
        />
        <Column
          header="Total"
          className="text-right"
          style={{ width: "9rem" }}
          body={(r: SupplierBill) => fmtAmt(r.total, r.currency)}
        />
        <Column
          header="Pagado"
          className="text-right"
          style={{ width: "9rem" }}
          body={(r: SupplierBill) => fmtAmt(r.paidAmount, r.currency)}
        />
        <Column
          header="Pendiente"
          className="text-right font-bold"
          style={{ width: "9rem" }}
          body={(r: SupplierBill) => (
            <span className="text-primary font-semibold">
              {fmtAmt(r.pendingAmount, r.currency)}
            </span>
          )}
        />
        <Column
          header=""
          style={{ width: "160px" }}
          body={(r: SupplierBill) =>
            r.status !== "PAID" &&
            r.status !== "CANCELLED" &&
            r.status !== "PENDING_INVOICE" ? (
              <Button
                label="Registrar Pago"
                icon="pi pi-dollar"
                className="p-button-success p-button-sm"
                onClick={() => {
                  setSelectedBill(r);
                  setShowPayDialog(true);
                }}
              />
            ) : r.status === "PENDING_INVOICE" ? (
              <span className="text-xs text-400 italic">
                Registrar factura primero
              </span>
            ) : null
          }
        />
      </DataTable>
    </div>
  );

  // ── Supplier row templates ─────────────────────────────────────────────

  const pendingBody = (entry: AccountsPayableEntry) => {
    const byCur = entry.totalPendingByCurrency ?? {};
    const currencies = Object.keys(byCur);
    if (currencies.length === 0) return <span className="text-400">—</span>;
    return (
      <div className="flex flex-column gap-1">
        {currencies.map((cur) => (
          <span key={cur} className="font-semibold text-primary">
            {fmtAmt(byCur[cur], cur)}
          </span>
        ))}
      </div>
    );
  };

  const supplierBody = (entry: AccountsPayableEntry) => (
    <div className="flex align-items-center gap-2">
      <div className="flex flex-column">
        <span className="font-semibold text-900">{entry.supplier.name}</span>
        {entry.supplier.taxId && (
          <span className="text-500 text-xs">{entry.supplier.taxId}</span>
        )}
      </div>
      {(entry.overdueCount ?? 0) > 0 && (
        <Tag
          value={`${entry.overdueCount} venc.`}
          severity="danger"
          className="text-xs"
        />
      )}
    </div>
  );

  const billCountBody = (entry: AccountsPayableEntry) => {
    const active = entry.bills.filter(
      (b) => b.status !== "PAID" && b.status !== "CANCELLED",
    );
    const provisional = active.filter(
      (b) => b.status === "PENDING_INVOICE",
    ).length;
    return (
      <div className="flex flex-column gap-1">
        <span className="text-sm">
          {active.length} pendiente{active.length !== 1 ? "s" : ""}
        </span>
        {provisional > 0 && (
          <span className="text-xs text-blue-500">
            {provisional} sin factura
          </span>
        )}
      </div>
    );
  };

  // ── Header ─────────────────────────────────────────────────────────────

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0 font-bold text-900">Proveedores</h4>
        <span className="text-600 text-sm">({filtered.length} total)</span>
        {summary.overdueTotal > 0 && (
          <Tag
            value={`${summary.overdueTotal} vencida${summary.overdueTotal !== 1 ? "s" : ""}`}
            severity="danger"
          />
        )}
        {summary.pendingInvoiceCount > 0 && (
          <Tag
            value={`${summary.pendingInvoiceCount} sin factura`}
            severity="info"
          />
        )}
      </div>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar proveedor..."
          style={{ width: "200px" }}
          className="p-inputtext-sm"
        />
      </span>
    </div>
  );

  if (loading && entries.length === 0) {
    return (
      <div className="p-3">
        <Skeleton width="240px" height="1.8rem" className="mb-4" />
        <div className="grid mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="col-12 md:col-3">
              <div className="card">
                <Skeleton height="80px" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton height="320px" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="p-3"
    >
      <Toast ref={toast} />

      {/* ── Header ── */}
      <div className="flex flex-wrap align-items-center justify-content-between mb-4 gap-2">
        <div>
          <h2 className="text-2xl font-bold text-900 m-0">
            <i className="pi pi-arrow-down mr-2 text-primary" />
            Cuentas por Pagar
          </h2>
          <span className="text-500 text-sm">
            Facturas de proveedores pendientes de pago
          </span>
        </div>
        <Button
          label="Actualizar"
          icon="pi pi-refresh"
          outlined
          size="small"
          loading={loading}
          onClick={() => void mutate()}
        />
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid mb-4">
        {/* Total por Pagar */}
        <div className="col-12 md:col-3">
          <div
            className="card mb-0"
            style={{ borderLeft: "4px solid var(--blue-500)" }}
          >
            <span className="block text-500 font-medium mb-1 text-sm">
              Total por Pagar
            </span>
            <div className="flex flex-column gap-1">
              {Object.entries(summary.byCurrency).length > 0 ? (
                Object.entries(summary.byCurrency).map(([cur, amt]) => (
                  <div key={cur} className="text-900 font-bold text-xl">
                    {fmtAmt(amt, cur)}
                  </div>
                ))
              ) : (
                <div className="text-900 font-bold text-xl">—</div>
              )}
            </div>
            <span className="text-xs text-500">
              {entries.length} proveedor{entries.length !== 1 ? "es" : ""}
            </span>
          </div>
        </div>

        {/* Facturas vencidas */}
        <div className="col-12 md:col-3">
          <div
            className="card mb-0"
            style={{
              borderLeft: `4px solid var(--${summary.overdueTotal > 0 ? "red" : "green"}-500)`,
            }}
          >
            <span className="block text-500 font-medium mb-1 text-sm">
              Vencidas
            </span>
            <div className="text-900 font-bold text-xl">
              {summary.overdueTotal}
            </div>
            <span className="text-xs text-500">Requieren atención</span>
          </div>
        </div>

        {/* Mora moderada 31–90 */}
        <div className="col-12 md:col-3">
          <div
            className="card mb-0"
            style={{ borderLeft: "4px solid var(--orange-500)" }}
          >
            <span className="block text-500 font-medium mb-1 text-sm">
              31–90 días vencidas
            </span>
            <div className="text-900 font-bold text-xl">
              {aging["31-60"] + aging["61-90"]}
            </div>
            <span className="text-xs text-500">Mora moderada (facturas)</span>
          </div>
        </div>

        {/* Mora crítica +90 */}
        <div className="col-12 md:col-3">
          <div
            className="card mb-0"
            style={{ borderLeft: "4px solid var(--red-500)" }}
          >
            <span className="block text-500 font-medium mb-1 text-sm">
              +90 días vencidas
            </span>
            <div className="text-900 font-bold text-xl">{aging["+90"]}</div>
            <span className="text-xs text-500">Mora crítica (facturas)</span>
          </div>
        </div>
      </div>

      {/* ── Aging chart ── */}
      {agingTotal > 0 && (
        <div className="card mb-4">
          <div className="font-semibold mb-3">
            Distribución de Antigüedad (facturas activas)
          </div>
          <div className="flex flex-column gap-2">
            {(
              [
                { key: "corriente", label: "Corriente", color: "var(--green-500)" },
                { key: "1-30", label: "1–30 días vencida", color: "var(--yellow-500)" },
                { key: "31-60", label: "31–60 días vencida", color: "var(--orange-500)" },
                { key: "61-90", label: "61–90 días vencida", color: "var(--orange-700)" },
                { key: "+90", label: "+90 días vencida", color: "var(--red-500)" },
                { key: "sin-vencimiento", label: "Sin vencimiento", color: "var(--blue-400)" },
              ] as const
            ).map(({ key, label }) => {
              const val = aging[key];
              if (!val) return null;
              const pct = Math.round((val / agingTotal) * 100);
              return (
                <div key={key}>
                  <div className="flex justify-content-between text-sm mb-1">
                    <span className="text-700">{label}</span>
                    <span className="font-semibold">
                      {val} factura{val !== 1 ? "s" : ""} ({pct}%)
                    </span>
                  </div>
                  <ProgressBar
                    value={pct}
                    showValue={false}
                    style={{ height: "6px" }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="card">
        <DataTable
          value={filtered}
          loading={loading}
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={billsRowExpansion}
          dataKey="supplier.id"
          emptyMessage="Sin cuentas por pagar pendientes"
          stripedRows
          scrollable
          header={header}
        >
          <Column expander style={{ width: "50px" }} />
          <Column
            header="Proveedor"
            sortable
            sortField="supplier.name"
            body={supplierBody}
          />
          <Column
            header="Pendiente"
            body={pendingBody}
            sortable
            sortField="totalPending"
          />
          <Column
            header="Facturas"
            body={billCountBody}
            style={{ width: "10rem" }}
          />
        </DataTable>
      </div>

      <RegisterPaymentDialog
        visible={showPayDialog}
        onHide={() => {
          setShowPayDialog(false);
          setSelectedBill(null);
        }}
        bill={selectedBill}
        onSuccess={async () => {
          setShowPayDialog(false);
          setSelectedBill(null);
          await mutate();
        }}
        toast={toast}
      />
    </motion.div>
  );
}

export default AccountsPayableListContent;
