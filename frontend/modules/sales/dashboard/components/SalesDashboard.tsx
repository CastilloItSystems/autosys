"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { motion } from "framer-motion";
import type { SalesDashboard } from "../services/reportService";
import { useSalesDashboardData } from "../hooks/useSalesDashboardData";
import { handleFormError } from "@/utils/errorHandlers";

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const CURRENCY_SEVERITY: Record<string, "success" | "warning" | "info"> = {
  USD: "success",
  VES: "warning",
  EUR: "info",
};

// ── Component ──────────────────────────────────────────────────────────────────

const SalesDashboardSkeleton = () => (
  <div className="p-3">
    <div className="flex align-items-center justify-content-between mb-4">
      <div>
        <Skeleton width="260px" height="1.8rem" className="mb-2" />
        <Skeleton width="200px" height="1rem" />
      </div>
      <Skeleton width="110px" height="2.2rem" />
    </div>
    <div className="grid mb-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="col-12 md:col-6 lg:col-3">
          <div className="card">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <Skeleton width="120px" height="0.9rem" className="mb-2" />
                <Skeleton width="80px" height="2rem" />
              </div>
              <Skeleton shape="circle" size="2.5rem" />
            </div>
            <Skeleton width="80%" height="0.8rem" />
          </div>
        </div>
      ))}
    </div>
    <div className="grid">
      <div className="col-12 md:col-4">
        <Skeleton height="160px" />
      </div>
      <div className="col-12 md:col-8">
        <Skeleton height="220px" />
      </div>
    </div>
  </div>
);

function SalesDashboardContent() {
  const toast = useRef<Toast>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { data, loading, error, mutate } = useSalesDashboardData() as {
    data: SalesDashboard | null;
    loading: boolean;
    error: unknown;
    mutate: () => Promise<SalesDashboard | undefined>;
  };

  useEffect(() => {
    if (data) setLastUpdated(new Date());
  }, [data]);

  useEffect(() => {
    if (error) handleFormError(error, toast);
  }, [error]);

  const kpiCards = useMemo(
    () => [
      {
        label: "Facturado Hoy",
        value: `$${formatCurrency(data?.today.revenue ?? 0)}`,
        icon: "pi pi-dollar",
        color: "blue",
        subtitle: `${data?.today.invoices ?? 0} facturas · ${
          data?.today.payments ?? 0
        } pagos`,
      },
      {
        label: "Facturado Esta Semana",
        value: `$${formatCurrency(data?.week.revenue ?? 0)}`,
        icon: "pi pi-chart-line",
        color: "green",
        subtitle: `${data?.week.invoices ?? 0} facturas`,
      },
      {
        label: "Facturado Este Mes",
        value: `$${formatCurrency(data?.month.revenue ?? 0)}`,
        icon: "pi pi-calendar",
        color: "orange",
        subtitle: `${data?.month.invoices ?? 0} facturas`,
      },
      {
        label: "Órd. Pendientes Aprobación",
        value: data?.pending.ordersAwaitingApproval ?? 0,
        icon: "pi pi-clock",
        color: "red",
        subtitle: `${
          data?.pending.preInvoicesAwaitingPayment ?? 0
        } prefacturas pendientes`,
      },
    ],
    [data],
  );

  // ── Skeleton ──────────────────────────────────────────────────────────────────

  if (loading && !data) {
    return <SalesDashboardSkeleton />;
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
            <i className="pi pi-shopping-cart mr-2 text-primary" />
            Dashboard de Ventas
          </h2>
          {lastUpdated && (
            <span className="text-500 text-sm">
              Actualizado: {lastUpdated.toLocaleTimeString("es-VE")}
            </span>
          )}
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
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="col-12 md:col-6 lg:col-3">
            <div
              className="card mb-0"
              style={{ borderLeft: `4px solid var(--${kpi.color}-500)` }}
            >
              <div className="flex justify-content-between align-items-center mb-2">
                <div>
                  <span className="block text-500 font-medium mb-1 text-sm">
                    {kpi.label}
                  </span>
                  <div className="text-900 font-bold text-2xl">{kpi.value}</div>
                </div>
                <div
                  className="flex align-items-center justify-content-center border-round"
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    backgroundColor: `var(--${kpi.color}-100)`,
                  }}
                >
                  <i className={`${kpi.icon} text-${kpi.color}-500 text-xl`} />
                </div>
              </div>
              <span className="text-xs text-500">{kpi.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Ingresos por Moneda + Facturas Recientes ── */}
      <div className="grid">
        <div className="col-12 md:col-4">
          <Card title="Ingresos por Moneda (Mes)" className="h-full">
            <div className="flex flex-column gap-3">
              {Object.entries(data?.byCurrency ?? {}).map(
                ([currency, amount]) => (
                  <div
                    key={currency}
                    className="flex justify-content-between align-items-center"
                  >
                    <Tag
                      value={currency}
                      severity={CURRENCY_SEVERITY[currency] ?? "info"}
                    />
                    <span className="font-semibold">
                      {formatCurrency(amount as number)}
                    </span>
                  </div>
                ),
              )}
            </div>
          </Card>
        </div>

        <div className="col-12 md:col-8">
          <div className="card mb-0">
            <div className="flex align-items-center gap-2 mb-3">
              <i className="pi pi-file text-primary" />
              <span className="font-bold text-900">Facturas Recientes</span>
              <span className="text-500 text-sm">
                ({data?.recentInvoices?.length ?? 0} registros)
              </span>
            </div>
            <DataTable
              value={data?.recentInvoices ?? []}
              loading={loading}
              size="small"
              responsiveLayout="scroll"
              emptyMessage="Sin facturas recientes"
            >
              <Column
                field="invoiceNumber"
                header="Nro. Factura"
                style={{ width: "130px" }}
              />
              <Column field="customerName" header="Cliente" />
              <Column
                field="invoiceDate"
                header="Fecha"
                style={{ width: "110px" }}
                body={(row) =>
                  row.invoiceDate
                    ? new Date(row.invoiceDate).toLocaleDateString("es-VE")
                    : "—"
                }
              />
              <Column
                field="currency"
                header="Moneda"
                style={{ width: "90px" }}
                body={(row) => (
                  <Tag
                    value={row.currency}
                    severity={CURRENCY_SEVERITY[row.currency] ?? "info"}
                  />
                )}
              />
              <Column
                field="total"
                header="Total"
                style={{ width: "120px" }}
                body={(row) => (
                  <span className="font-semibold">
                    {formatCurrency(row.total)}
                  </span>
                )}
              />
            </DataTable>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default SalesDashboardContent;
