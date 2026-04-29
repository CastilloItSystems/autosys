"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import type {
  CashTransaction,
  CashFlowSummary,
  CashFlowCurrencySummary,
} from "../interfaces/cashTransaction";
import type { BankAccount } from "@/modules/finance/bankAccounts/interfaces/bankAccount";
import cashFlowService from "../services/cashFlowService";
import bankAccountService from "@/modules/finance/bankAccounts/services/bankAccountService";
import TransferDialog from "./TransferDialog";
import ManualAdjustmentDialog from "./ManualAdjustmentDialog";
import { handleFormError } from "@/utils/errorHandlers";

const TYPE_LABELS: Record<string, string> = {
  INCOME: "Entrada",
  OUTCOME: "Salida",
  TRANSFER_IN: "Transf. Entrada",
  TRANSFER_OUT: "Transf. Salida",
  ADJUSTMENT: "Ajuste",
};

const SOURCE_LABELS: Record<string, string> = {
  SALES_PAYMENT: "Cobro Venta",
  SUPPLIER_PAYMENT: "Pago Proveedor",
  EXPENSE: "Gasto",
  MANUAL: "Manual",
  TRANSFER: "Transferencia",
};

function SummaryCards({
  s,
  fmt,
}: {
  s: CashFlowCurrencySummary;
  fmt: (v: number) => string;
}) {
  return (
    <div className="grid">
      <div className="col-12 md:col-4">
        <Card className="border-left-3 border-green-400">
          <div className="text-color-secondary mb-1 text-sm">
            Total Entradas
          </div>
          <div className="text-2xl font-bold text-green-600">
            {s.currency} {fmt(s.totalIncome)}
          </div>
        </Card>
      </div>
      <div className="col-12 md:col-4">
        <Card className="border-left-3 border-red-400">
          <div className="text-color-secondary mb-1 text-sm">Total Salidas</div>
          <div className="text-2xl font-bold text-red-600">
            {s.currency} {fmt(s.totalOutcome)}
          </div>
        </Card>
      </div>
      <div className="col-12 md:col-4">
        <Card
          className={`border-left-3 ${
            s.netFlow >= 0 ? "border-primary" : "border-orange-400"
          }`}
        >
          <div className="text-color-secondary mb-1 text-sm">Flujo Neto</div>
          <div
            className={`text-2xl font-bold ${
              s.netFlow >= 0 ? "text-primary" : "text-orange-600"
            }`}
          >
            {s.currency} {fmt(s.netFlow)}
          </div>
        </Card>
      </div>
    </div>
  );
}

const today = new Date().toISOString().split("T")[0];
const firstOfMonth = new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  1,
)
  .toISOString()
  .split("T")[0];

export default function CashFlowReport() {
  const toast = useRef<Toast>(null);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);
  const [bankAccountsFull, setBankAccountsFull] = useState<BankAccount[]>([]);
  const [bankAccounts, setBankAccounts] = useState<
    { label: string; value: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    from: firstOfMonth,
    to: today,
    bankAccountId: "",
    convertTo: "" as string,
  });
  const [periodBalance, setPeriodBalance] = useState<{
    opening: number;
    closing: number;
    currency: string;
  } | null>(null);
  const [transferVisible, setTransferVisible] = useState(false);
  const [adjustmentVisible, setAdjustmentVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, sumRes] = await Promise.all([
        cashFlowService.getAll({
          ...filters,
          page,
          limit: 50,
          bankAccountId: filters.bankAccountId || undefined,
        }),
        cashFlowService.getSummary({
          ...filters,
          bankAccountId: filters.bankAccountId || undefined,
          convertTo: filters.convertTo || undefined,
        }),
      ]);
      const txData: CashTransaction[] = txRes.data ?? [];
      setTransactions(txData);
      setTotal(txRes.meta?.total ?? 0);
      setSummary(sumRes.data ?? null);

      // Period balance: opening = balance at oldest tx minus its amount; closing = balance at newest tx
      if (filters.bankAccountId && txData.length > 0) {
        const newest = txData[0]; // DESC order
        const oldest = txData[txData.length - 1];
        const closing = Number(newest.runningBalance ?? 0);
        const opening =
          Number(oldest.runningBalance ?? 0) - Number(oldest.amount);
        const currency = newest.currency;
        setPeriodBalance({ opening, closing, currency });
      } else {
        setPeriodBalance(null);
      }
    } catch (err) {
      handleFormError(err, toast);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    bankAccountService.getAll({ isActive: "true", limit: 100 }).then((res) => {
      const accounts: BankAccount[] = res.data ?? [];
      setBankAccountsFull(accounts);
      setBankAccounts([
        { label: "Todas las cuentas", value: "" },
        ...accounts.map((a) => ({
          label: `${a.name} (${a.currency})`,
          value: a.id,
        })),
      ]);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await cashFlowService.getAll({
        ...filters,
        bankAccountId: filters.bankAccountId || undefined,
        page: 1,
        limit: 500,
      });
      const rows: CashTransaction[] = res.data ?? [];
      const headers = [
        "Fecha",
        "Cuenta",
        "Tipo",
        "Origen",
        "Descripción",
        "Monto",
        "Moneda",
        "Saldo Acum.",
      ];
      const lines = rows.map((r) =>
        [
          new Date(r.transactionDate).toLocaleDateString("es-VE"),
          r.bankAccount?.name ?? "",
          TYPE_LABELS[r.type] ?? r.type,
          SOURCE_LABELS[r.source] ?? r.source,
          `"${(r.description ?? "").replace(/"/g, '""')}"`,
          Number(r.amount).toFixed(2),
          r.currency,
          r.runningBalance != null ? Number(r.runningBalance).toFixed(2) : "",
        ].join(","),
      );
      const csv = [headers.join(","), ...lines].join("\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `flujo-caja-${filters.from}-${filters.to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo exportar",
      });
    } finally {
      setExporting(false);
    }
  };

  const amountBody = (row: CashTransaction) => {
    const isIncome = row.type === "INCOME" || row.type === "TRANSFER_IN";
    const color = isIncome ? "text-green-600" : "text-red-600";
    const sign = isIncome ? "+" : "";
    return (
      <span className={`font-semibold ${color}`}>
        {sign}
        {row.currency}{" "}
        {Math.abs(Number(row.amount)).toLocaleString("es-VE", {
          minimumFractionDigits: 2,
        })}
      </span>
    );
  };

  const runningBalanceBody = (row: CashTransaction) => {
    if (row.runningBalance == null) return null;
    const val = Number(row.runningBalance);
    return (
      <span className={`font-medium ${val >= 0 ? "text-900" : "text-red-600"}`}>
        {row.currency}{" "}
        {val.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
      </span>
    );
  };

  const fmt = (v: number) =>
    v.toLocaleString("es-VE", { minimumFractionDigits: 2 });

  const onActionSuccess = async () => {
    await load();
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: "Operación registrada correctamente",
    });
  };

  const tableHeader = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Flujo de Caja</h4>
        <span className="text-600 text-sm">({total} total)</span>
      </div>
      <div className="flex gap-2 align-items-end flex-wrap">
        <div className="flex flex-column gap-1">
          <label className="font-medium text-sm">Desde</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) =>
              setFilters((f) => ({ ...f, from: e.target.value }))
            }
            className="p-inputtext p-component"
          />
        </div>
        <div className="flex flex-column gap-1">
          <label className="font-medium text-sm">Hasta</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            className="p-inputtext p-component"
          />
        </div>
        <div className="flex flex-column gap-1">
          <label className="font-medium text-sm">Cuenta</label>
          <Dropdown
            value={filters.bankAccountId}
            options={bankAccounts}
            onChange={(e) =>
              setFilters((f) => ({ ...f, bankAccountId: e.value }))
            }
            className="w-16rem"
          />
        </div>
        <div className="flex flex-column gap-1">
          <label className="font-medium text-sm">Ver en</label>
          <Dropdown
            value={filters.convertTo}
            options={[
              { label: "Por moneda", value: "" },
              { label: "USD - Dólar", value: "USD" },
              { label: "VES - Bolívar", value: "VES" },
              { label: "EUR - Euro", value: "EUR" },
            ]}
            onChange={(e) => setFilters((f) => ({ ...f, convertTo: e.value }))}
            className="w-12rem"
          />
        </div>
        <Button
          label="Filtrar"
          icon="pi pi-search"
          onClick={() => {
            setPage(1);
            load();
          }}
        />
        <Button
          icon="pi pi-download"
          tooltip="Exportar CSV"
          tooltipOptions={{ position: "top" }}
          outlined
          severity="secondary"
          loading={exporting}
          onClick={exportCsv}
        />
        <Button
          icon="pi pi-arrow-right-arrow-left"
          label="Transferir"
          outlined
          severity="info"
          onClick={() => setTransferVisible(true)}
        />
        <Button
          icon="pi pi-sliders-h"
          label="Ajuste"
          outlined
          severity="warning"
          onClick={() => setAdjustmentVisible(true)}
        />
      </div>
    </div>
  );

  return (
    <>
      <Toast ref={toast} />

      <TransferDialog
        visible={transferVisible}
        onHide={() => setTransferVisible(false)}
        bankAccounts={bankAccountsFull}
        onSuccess={onActionSuccess}
        toast={toast}
      />

      <ManualAdjustmentDialog
        visible={adjustmentVisible}
        onHide={() => setAdjustmentVisible(false)}
        bankAccounts={bankAccountsFull}
        preselectedAccountId={filters.bankAccountId || undefined}
        onSuccess={onActionSuccess}
        toast={toast}
      />

      <div className="card">
        {/* Resumen de período (saldo apertura / cierre) */}
        {periodBalance && filters.bankAccountId && (
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="surface-100 border-round p-3 flex-1">
              <div className="text-500 text-sm mb-1">Saldo de Apertura</div>
              <div
                className={`text-xl font-bold ${
                  periodBalance.opening >= 0 ? "text-900" : "text-red-600"
                }`}
              >
                {periodBalance.currency} {fmt(periodBalance.opening)}
              </div>
              <div className="text-xs text-500">{filters.from}</div>
            </div>
            <div className="flex align-items-center text-300 text-2xl px-2">
              →
            </div>
            <div className="surface-100 border-round p-3 flex-1">
              <div className="text-500 text-sm mb-1">Saldo de Cierre</div>
              <div
                className={`text-xl font-bold ${
                  periodBalance.closing >= 0 ? "text-primary" : "text-red-600"
                }`}
              >
                {periodBalance.currency} {fmt(periodBalance.closing)}
              </div>
              <div className="text-xs text-500">{filters.to}</div>
            </div>
            <div className="surface-50 border-round p-3 border-left-3 border-primary flex-1">
              <div className="text-500 text-sm mb-1">Variación del Período</div>
              {(() => {
                const diff = periodBalance.closing - periodBalance.opening;
                return (
                  <div
                    className={`text-xl font-bold ${
                      diff >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {diff >= 0 ? "+" : ""}
                    {periodBalance.currency} {fmt(diff)}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Resumen */}
        {summary && summary.perCurrency.length > 0 && (
          <div className="mb-4">
            {summary.unified ? (
              <>
                <div className="flex align-items-center gap-2 mb-2">
                  <span className="font-semibold text-sm text-600 uppercase">
                    Todo en {summary.unified.currency}
                  </span>
                  <span className="text-xs text-500">
                    (conversión usando tasa promedio del período)
                  </span>
                </div>
                <SummaryCards s={summary.unified} fmt={fmt} />
              </>
            ) : (
              summary.perCurrency.map((s) => (
                <div key={s.currency} className="mb-3">
                  <span className="font-semibold text-sm text-600 uppercase block mb-2">
                    {s.currency}
                  </span>
                  <SummaryCards s={s} fmt={fmt} />
                </div>
              ))
            )}
          </div>
        )}

        <DataTable
          value={transactions}
          loading={loading}
          lazy
          paginator
          rows={50}
          rowsPerPageOptions={[5, 10, 25, 50]}
          totalRecords={total}
          onPage={(e) => setPage((e.page ?? 0) + 1)}
          emptyMessage="Sin movimientos en el período"
          stripedRows
          scrollable
          sortMode="multiple"
          size="small"
          header={tableHeader}
        >
          <Column
            field="transactionDate"
            header="Fecha"
            body={(r: CashTransaction) =>
              new Date(r.transactionDate).toLocaleDateString("es-VE")
            }
            style={{ width: "110px" }}
            sortable
          />
          <Column
            field="bankAccount.name"
            header="Cuenta"
            body={(r: CashTransaction) => r.bankAccount?.name ?? "-"}
          />
          <Column
            header="Tipo"
            body={(r: CashTransaction) => (
              <Tag
                value={TYPE_LABELS[r.type] ?? r.type}
                severity={
                  r.type === "INCOME" || r.type === "TRANSFER_IN"
                    ? "success"
                    : r.type === "ADJUSTMENT"
                    ? "warning"
                    : "danger"
                }
              />
            )}
            style={{ width: "140px" }}
          />
          <Column
            header="Origen"
            body={(r: CashTransaction) => SOURCE_LABELS[r.source] ?? r.source}
            style={{ width: "130px" }}
          />
          <Column field="description" header="Descripción" />
          <Column
            header="Monto"
            body={amountBody}
            style={{ width: "160px", textAlign: "right" }}
          />
          <Column
            header="Saldo Acum."
            body={runningBalanceBody}
            style={{ width: "160px", textAlign: "right" }}
          />
        </DataTable>
      </div>
    </>
  );
}
