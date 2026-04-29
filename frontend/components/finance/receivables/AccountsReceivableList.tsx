"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import receivablesService, {
  type ReceivableItem,
  type ReceivablesData,
} from "@/modules/finance/receivables/services/receivablesService";
import { handleFormError } from "@/utils/errorHandlers";
import preInvoiceService from "@/app/api/sales/preInvoiceService";
import paymentService from "@/app/api/sales/paymentService";
import PaymentDialog from "@/components/sales/payments/PaymentDialog";
import type { PreInvoice } from "@/libs/interfaces/sales/preInvoice.interface";
import type { Payment } from "@/libs/interfaces/sales/payment.interface";

const fmt = (v: number) =>
  v.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const AGING_LABELS: Record<string, string> = {
  "0-30": "Corriente",
  "31-60": "31–60 días",
  "61-90": "61–90 días",
  "+90": "+90 días",
  "sin-vencimiento": "Sin vencimiento",
};

const AGING_SEVERITY: Record<
  string,
  "success" | "warning" | "danger" | "info"
> = {
  "0-30": "success",
  "31-60": "warning",
  "61-90": "danger",
  "+90": "danger",
  "sin-vencimiento": "info",
};

export default function AccountsReceivableList() {
  const toast = useRef<Toast>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReceivablesData | null>(null);

  // Payment dialog state
  const [paymentDialogVisible, setPaymentDialogVisible] = useState(false);
  const [selectedPreInvoice, setSelectedPreInvoice] =
    useState<PreInvoice | null>(null);
  const [existingPayments, setExistingPayments] = useState<Payment[]>([]);
  const [loadingCobro, setLoadingCobro] = useState<string | null>(null);

  const exportCsv = () => {
    if (!data || data.items.length === 0) return;
    const headers = [
      "Pre-Factura",
      "Cliente",
      "RIF",
      "Total",
      "Pagado",
      "Pendiente",
      "Moneda",
      "Vencimiento",
      "Días Vencida",
      "Antigüedad",
    ];
    const rows = (data.items as ReceivableItem[]).map((r) =>
      [
        r.preInvoiceNumber,
        r.customer?.name ?? "",
        r.customer?.taxId ?? "",
        Number(r.total).toFixed(2),
        Number(r.paidAmount).toFixed(2),
        Number(r.pendingAmount).toFixed(2),
        r.currency,
        r.dueDate ? new Date(r.dueDate).toLocaleDateString("es-VE") : "",
        r.daysOverdue != null && r.daysOverdue > 0 ? r.daysOverdue : "",
        AGING_LABELS[r.agingBucket] ?? r.agingBucket,
      ].join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cuentas-por-cobrar-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const load = async () => {
    setLoading(true);
    try {
      const result = await receivablesService.getReceivables();
      setData(result);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCobro = async (row: ReceivableItem) => {
    setLoadingCobro(row.id);
    try {
      const [piRes, paymentsRes] = await Promise.all([
        preInvoiceService.getById(row.id),
        paymentService.getByPreInvoice(row.id),
      ]);
      setSelectedPreInvoice(piRes.data);
      setExistingPayments(paymentsRes.data ?? []);
      setPaymentDialogVisible(true);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setLoadingCobro(null);
    }
  };

  const onPaymentSuccess = async () => {
    setPaymentDialogVisible(false);
    setSelectedPreInvoice(null);
    setExistingPayments([]);
    await load();
    toast.current?.show({
      severity: "success",
      summary: "Cobro registrado",
      detail: "El pago fue procesado exitosamente",
      life: 4000,
    });
  };

  if (loading && !data) {
    return (
      <div className="p-3">
        <Skeleton width="260px" height="1.8rem" className="mb-4" />
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

  const agingTotal = data
    ? Object.values(data.aging).reduce((s, v) => s + v, 0)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="p-3"
    >
      <Toast ref={toast} />

      {/* Header */}
      <div className="flex flex-wrap align-items-center justify-content-between mb-4 gap-2">
        <div>
          <h2 className="text-2xl font-bold text-900 m-0">
            <i className="pi pi-arrow-up mr-2 text-primary" />
            Cuentas por Cobrar
          </h2>
          <span className="text-500 text-sm">
            Pre-facturas pendientes de pago
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            icon="pi pi-download"
            tooltip="Exportar CSV"
            tooltipOptions={{ position: "top" }}
            outlined
            severity="secondary"
            size="small"
            onClick={exportCsv}
            disabled={!data || data.items.length === 0}
          />
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            outlined
            size="small"
            loading={loading}
            onClick={load}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid mb-4">
        <div className="col-12 md:col-3">
          <div
            className="card mb-0"
            style={{ borderLeft: "4px solid var(--blue-500)" }}
          >
            <span className="block text-500 font-medium mb-1 text-sm">
              Total por Cobrar
            </span>
            <div className="text-900 font-bold text-xl">
              {fmt(data?.total ?? 0)}
            </div>
            <span className="text-xs text-500">
              {data?.count ?? 0} pre-factura(s)
            </span>
          </div>
        </div>
        <div className="col-12 md:col-3">
          <div
            className="card mb-0"
            style={{
              borderLeft: `4px solid var(--${
                (data?.overdueCount ?? 0) > 0 ? "red" : "green"
              }-500)`,
            }}
          >
            <span className="block text-500 font-medium mb-1 text-sm">
              Vencidas
            </span>
            <div className="text-900 font-bold text-xl">
              {data?.overdueCount ?? 0}
            </div>
            <span className="text-xs text-500">Requieren seguimiento</span>
          </div>
        </div>
        <div className="col-12 md:col-3">
          <div
            className="card mb-0"
            style={{ borderLeft: "4px solid var(--orange-500)" }}
          >
            <span className="block text-500 font-medium mb-1 text-sm">
              31–90 días
            </span>
            <div className="text-900 font-bold text-xl">
              {fmt((data?.aging["31-60"] ?? 0) + (data?.aging["61-90"] ?? 0))}
            </div>
            <span className="text-xs text-500">En mora moderada</span>
          </div>
        </div>
        <div className="col-12 md:col-3">
          <div
            className="card mb-0"
            style={{ borderLeft: "4px solid var(--red-500)" }}
          >
            <span className="block text-500 font-medium mb-1 text-sm">
              +90 días
            </span>
            <div className="text-900 font-bold text-xl">
              {fmt(data?.aging["+90"] ?? 0)}
            </div>
            <span className="text-xs text-500">Mora crítica</span>
          </div>
        </div>
      </div>

      {/* Aging chart */}
      {data && agingTotal > 0 && (
        <div className="card mb-4">
          <div className="font-semibold mb-3">Distribución de Antigüedad</div>
          <div className="flex flex-column gap-2">
            {(
              ["0-30", "31-60", "61-90", "+90", "sin-vencimiento"] as const
            ).map((bucket) => {
              const val = data.aging[bucket];
              if (!val) return null;
              const pct = Math.round((val / agingTotal) * 100);
              return (
                <div key={bucket}>
                  <div className="flex justify-content-between text-sm mb-1">
                    <span className="text-700">{AGING_LABELS[bucket]}</span>
                    <span className="font-semibold">
                      {fmt(val)} ({pct}%)
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

      {/* Table */}
      <div className="card">
        {!data || data.items.length === 0 ? (
          <div className="text-center text-500 py-5">
            <i className="pi pi-check-circle text-green-400 text-3xl block mb-2" />
            Sin cuentas por cobrar pendientes
          </div>
        ) : (
          <DataTable
            value={data.items}
            size="small"
            stripedRows
            paginator
            rows={20}
            sortField="daysOverdue"
            sortOrder={-1}
          >
            <Column
              header="Pre-Factura"
              body={(r: ReceivableItem) => (
                <span
                  className="font-mono text-sm text-primary cursor-pointer hover:underline"
                  onClick={() =>
                    router.push(
                      `/empresa/ventas/pre-facturas?search=${r.preInvoiceNumber}`,
                    )
                  }
                >
                  {r.preInvoiceNumber}
                </span>
              )}
              style={{ width: "150px" }}
            />
            <Column
              header="Cliente"
              body={(r: ReceivableItem) => (
                <div>
                  <div className="font-medium text-sm">
                    {r.customer?.name ?? "—"}
                  </div>
                  {r.customer?.taxId && (
                    <div className="text-xs text-500">{r.customer.taxId}</div>
                  )}
                </div>
              )}
            />
            <Column
              header="Total"
              body={(r: ReceivableItem) => (
                <span className="text-sm">
                  {r.currency} {fmt(r.total)}
                </span>
              )}
              style={{ width: "130px" }}
            />
            <Column
              header="Pendiente"
              body={(r: ReceivableItem) => (
                <span className="font-semibold text-orange-600">
                  {r.currency} {fmt(r.pendingAmount)}
                </span>
              )}
              style={{ width: "130px" }}
            />
            <Column
              header="Vencimiento"
              field="dueDate"
              body={(r: ReceivableItem) => {
                if (!r.dueDate) return <span className="text-500">—</span>;
                const d = new Date(r.dueDate);
                return (
                  <span
                    className={
                      r.isOverdue ? "text-red-600 font-semibold" : "text-700"
                    }
                  >
                    {d.toLocaleDateString("es-VE")}
                    {r.isOverdue && (
                      <i className="pi pi-exclamation-circle ml-1 text-red-500" />
                    )}
                  </span>
                );
              }}
              style={{ width: "120px" }}
            />
            <Column
              header="Días Vencida"
              field="daysOverdue"
              body={(r: ReceivableItem) =>
                r.daysOverdue !== null && r.daysOverdue > 0 ? (
                  <span className="font-semibold text-red-600">
                    +{r.daysOverdue}d
                  </span>
                ) : (
                  <span className="text-500">—</span>
                )
              }
              style={{ width: "100px" }}
            />
            <Column
              header="Antigüedad"
              body={(r: ReceivableItem) => (
                <Tag
                  value={AGING_LABELS[r.agingBucket]}
                  severity={AGING_SEVERITY[r.agingBucket]}
                />
              )}
              style={{ width: "130px" }}
            />
            <Column
              header="Acción"
              frozen
              alignFrozen="right"
              style={{ width: "110px", textAlign: "center" }}
              headerStyle={{ textAlign: "center" }}
              body={(r: ReceivableItem) => (
                <Button
                  label="Cobrar"
                  icon="pi pi-dollar"
                  size="small"
                  severity="success"
                  loading={loadingCobro === r.id}
                  onClick={() => openCobro(r)}
                />
              )}
            />
          </DataTable>
        )}
      </div>

      {/* Payment dialog reused from sales */}
      <PaymentDialog
        visible={paymentDialogVisible}
        onHide={() => {
          setPaymentDialogVisible(false);
          setSelectedPreInvoice(null);
          setExistingPayments([]);
        }}
        preInvoice={selectedPreInvoice}
        existingPayments={existingPayments}
        onSuccess={onPaymentSuccess}
        toast={toast}
      />
    </motion.div>
  );
}
