"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { Badge } from "primereact/badge";
import type { AccountsPayableEntry, SupplierBill } from "@/libs/interfaces/finance";
import supplierBillService from "@/app/api/finance/supplierBillService";
import RegisterPaymentDialog from "./RegisterPaymentDialog";

// ── Constants ─────────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = { USD: "$", EUR: "€", VES: "Bs." };

const STATUS_SEVERITY: Record<string, "success" | "warning" | "danger" | "secondary" | "info"> = {
  PENDING_INVOICE: "info",
  PENDING:         "warning",
  PARTIAL:         "warning",
  PAID:            "success",
  CANCELLED:       "secondary",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_INVOICE: "Sin Factura",
  PENDING:         "Pendiente",
  PARTIAL:         "Parcial",
  PAID:            "Pagada",
  CANCELLED:       "Cancelada",
};

// ── Helpers ───────────────────────────────────────────────────────────────

const fmtAmt = (value: number, currency = "USD") => {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${sym} ${Number(value).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── Component ─────────────────────────────────────────────────────────────

export default function AccountsPayableList() {
  const toast = useRef<Toast>(null);
  const [entries, setEntries] = useState<AccountsPayableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [selectedBill, setSelectedBill] = useState<SupplierBill | null>(null);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await supplierBillService.getAccountsPayable();
      setEntries(res.data ?? []);
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "No se pudo cargar cuentas por pagar" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Search filter ──────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.supplier.name.toLowerCase().includes(q) ||
        (e.supplier.taxId ?? "").toLowerCase().includes(q)
    );
  }, [entries, search]);

  // ── Summary totals ─────────────────────────────────────────────────────

  const summary = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    let overdueTotal = 0;
    for (const e of entries) {
      for (const [cur, amt] of Object.entries(e.totalPendingByCurrency ?? {})) {
        byCurrency[cur] = (byCurrency[cur] ?? 0) + amt;
      }
      overdueTotal += e.overdueCount ?? 0;
    }
    return { byCurrency, overdueTotal };
  }, [entries]);

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
            r.billNumber ?? <span className="text-400 text-xs italic">Sin registrar</span>
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
              {r.isOverdue && <i className="pi pi-exclamation-triangle ml-1 text-xs" />}
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
                onClick={() => { setSelectedBill(r); setShowPayDialog(true); }}
              />
            ) : r.status === "PENDING_INVOICE" ? (
              <span className="text-xs text-400 italic">Registrar factura primero</span>
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
      (b) => b.status !== "PAID" && b.status !== "CANCELLED"
    );
    const provisional = active.filter((b) => b.status === "PENDING_INVOICE").length;
    return (
      <div className="flex flex-column gap-1">
        <span className="text-sm">{active.length} pendiente{active.length !== 1 ? "s" : ""}</span>
        {provisional > 0 && (
          <span className="text-xs text-blue-500">{provisional} sin factura</span>
        )}
      </div>
    );
  };

  // ── Header ─────────────────────────────────────────────────────────────

  const header = (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <div className="flex align-items-center gap-3">
        <h4 className="m-0 font-bold text-900">Cuentas por Pagar</h4>
        <span className="text-600 text-sm">({filtered.length} proveedores)</span>
        {summary.overdueTotal > 0 && (
          <Tag
            value={`${summary.overdueTotal} vencida${summary.overdueTotal !== 1 ? "s" : ""}`}
            severity="danger"
          />
        )}
      </div>

      {/* Totals chips */}
      <div className="flex flex-wrap gap-2 align-items-center">
        {Object.entries(summary.byCurrency).map(([cur, amt]) => (
          <div key={cur} className="surface-100 border-round px-3 py-1 text-sm">
            <span className="text-500 mr-1">Total {cur}:</span>
            <span className="font-bold text-primary">{fmtAmt(amt, cur)}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 align-items-center">
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
        <Button
          icon="pi pi-refresh"
          outlined
          onClick={load}
          loading={loading}
          tooltip="Actualizar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    </div>
  );

  return (
    <>
      <Toast ref={toast} />

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
        onHide={() => { setShowPayDialog(false); setSelectedBill(null); }}
        bill={selectedBill}
        onSuccess={async () => { setShowPayDialog(false); setSelectedBill(null); await load(); }}
        toast={toast}
      />
    </>
  );
}
