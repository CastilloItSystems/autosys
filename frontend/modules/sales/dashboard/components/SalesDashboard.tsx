"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { motion } from "framer-motion";
import type { SalesDashboard as SalesDashboardData } from "../services/reportService";
import { useSalesDashboardData } from "../hooks/useSalesDashboardData";
import { handleFormError } from "@/utils/errorHandlers";

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatAmount = (value: number) =>
  new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatCurrency = (value: number, currency = "USD") => {
  try {
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${formatAmount(value)}`;
  }
};

const pluralize = (n: number, sing: string, plur: string) =>
  `${n} ${n === 1 ? sing : plur}`;

const CURRENCY_SEVERITY: Record<string, "success" | "warning" | "info"> = {
  USD: "success",
  VES: "warning",
  EUR: "info",
};

type HookResult = {
  data: SalesDashboardData | null;
  loading: boolean;
  error: unknown;
  mutate: () => Promise<SalesDashboardData | undefined>;
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
      {Array.from({ length: 4 }).map((_, i) => (
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
  const { data, loading, error, mutate } =
    useSalesDashboardData() as HookResult;

  useEffect(() => {
    if (data) setLastUpdated(new Date());
  }, [data]);

  useEffect(() => {
    if (error) handleFormError(error, toast);
  }, [error]);

  const handleRefresh = useCallback(async () => {
    try {
      await mutate();
      toast.current?.show({
        severity: "success",
        summary: "Actualizado",
        life: 2000,
      });
    } catch (e) {
      handleFormError(e, toast);
    }
  }, [mutate]);

  const kpiCards = useMemo(
    () => [
      {
        label: "Facturado Hoy",
        revenue: data?.today.revenue,
        revenueUSD: data?.today.revenueUSD ?? 0,
        icon: "pi pi-dollar",
        color: "blue",
        subtitle: `${pluralize(data?.today.invoices ?? 0, "factura", "facturas")} · ${pluralize(data?.today.payments ?? 0, "pago", "pagos")}`,
      },
      {
        label: "Facturado Esta Semana",
        revenue: data?.week.revenue,
        revenueUSD: data?.week.revenueUSD ?? 0,
        icon: "pi pi-chart-line",
        color: "green",
        subtitle: pluralize(data?.week.invoices ?? 0, "factura", "facturas"),
      },
      {
        label: "Facturado Este Mes",
        revenue: data?.month.revenue,
        revenueUSD: data?.month.revenueUSD ?? 0,
        icon: "pi pi-calendar",
        color: "orange",
        subtitle: pluralize(data?.month.invoices ?? 0, "factura", "facturas"),
      },
      {
        label: "Órd. Pendientes Aprobación",
        scalar: data?.pending.ordersAwaitingApproval ?? 0,
        icon: "pi pi-clock",
        color: "red",
        subtitle: pluralize(
          data?.pending.preInvoicesAwaitingPayment ?? 0,
          "prefactura pendiente",
          "prefacturas pendientes",
        ),
      },
    ],
    [data],
  );

  const sortedByCurrency = useMemo(
    () =>
      Object.entries(data?.byCurrency ?? {}).sort(
        ([, a], [, b]) => (b as number) - (a as number),
      ),
    [data],
  );

  const invoiceDateBody = useCallback(
    (row: { invoiceDate?: string | Date | null }) =>
      row.invoiceDate
        ? new Date(row.invoiceDate).toLocaleDateString("es-VE")
        : "—",
    [],
  );

  const currencyBody = useCallback(
    (row: { currency: string }) => (
      <Tag
        value={row.currency}
        severity={CURRENCY_SEVERITY[row.currency] ?? "info"}
      />
    ),
    [],
  );

  const totalBody = useCallback(
    (row: { total: number; currency: string }) => (
      <span className="font-semibold">
        {formatCurrency(row.total, row.currency)}
      </span>
    ),
    [],
  );

  const totalUSDBody = useCallback(
    (row: { totalUSD: number | null; currency: string }) =>
      row.totalUSD == null ? (
        <span
          className="text-500"
          title="Sin tasa disponible para conversión"
        >
          —
        </span>
      ) : (
        <span
          className={
            row.currency === "USD" ? "text-500" : "text-700 font-medium"
          }
        >
          {formatCurrency(row.totalUSD, "USD")}
        </span>
      ),
    [],
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
          aria-label="Actualizar dashboard"
          onClick={() => void handleRefresh()}
        />
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid mb-4">
        {kpiCards.map((kpi) => {
          const entries = kpi.revenue
            ? Object.entries(kpi.revenue)
                .filter(([, v]) => v > 0)
                .sort(([, a], [, b]) => b - a)
            : [];
          const hasMultiCurrency =
            entries.length > 1 ||
            (entries.length === 1 && entries[0][0] !== "USD");
          return (
            <div key={kpi.label} className="col-12 md:col-6 lg:col-3">
              <div
                className="card mb-0 h-full"
                style={{ borderLeft: `4px solid var(--${kpi.color}-500)` }}
              >
                <div className="flex justify-content-between align-items-start mb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="block text-500 font-medium mb-1 text-sm">
                      {kpi.label}
                    </span>
                    {kpi.revenue ? (
                      <>
                        <div
                          className="text-900 font-bold text-2xl white-space-nowrap"
                          title="Equivalente USD (tasa BCV)"
                        >
                          {formatCurrency(kpi.revenueUSD, "USD")}
                        </div>
                        {hasMultiCurrency && (
                          <div className="flex flex-column gap-1 mt-2">
                            {entries.map(([cur, amt]) => (
                              <div
                                key={cur}
                                className="text-700 text-sm white-space-nowrap"
                                title={`${cur} ${formatAmount(amt)}`}
                              >
                                <span className="text-500">{cur}: </span>
                                {formatCurrency(amt, cur)}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-900 font-bold text-2xl">
                        {kpi.scalar}
                      </div>
                    )}
                  </div>
                  <div
                    className="flex align-items-center justify-content-center border-round flex-shrink-0"
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      backgroundColor: `var(--${kpi.color}-100)`,
                    }}
                  >
                    <i
                      className={`${kpi.icon} text-${kpi.color}-500 text-xl`}
                    />
                  </div>
                </div>
                <span className="text-xs text-500">{kpi.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Ingresos por Moneda + Facturas Recientes ── */}
      <div className="grid">
        <div className="col-12 md:col-4">
          <Card title="Ingresos por Moneda (Mes)" className="h-full">
            <div className="flex flex-column gap-3">
              {sortedByCurrency.length === 0 ? (
                <span className="text-500 text-sm">Sin datos</span>
              ) : (
                <>
                  {sortedByCurrency.map(([currency, amount]) => (
                    <div
                      key={currency}
                      className="flex justify-content-between align-items-center"
                    >
                      <Tag
                        value={currency}
                        severity={CURRENCY_SEVERITY[currency] ?? "info"}
                      />
                      <span className="font-semibold">
                        {formatCurrency(amount as number, currency)}
                      </span>
                    </div>
                  ))}
                  <div className="border-top-1 surface-border pt-3 flex justify-content-between align-items-center">
                    <span className="text-500 text-sm">Total equiv. USD</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(data?.byCurrencyUSD ?? 0, "USD")}
                    </span>
                  </div>
                  {data?.fxRates && Object.keys(data.fxRates).length > 0 && (
                    <div className="text-xs text-500">
                      Tasas:{" "}
                      {Object.entries(data.fxRates)
                        .map(
                          ([cur, r]) =>
                            `${cur} ${formatAmount(r)}/USD`,
                        )
                        .join(" · ")}
                    </div>
                  )}
                </>
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
              scrollable
              emptyMessage="Sin facturas recientes"
              dataKey="invoiceNumber"
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
                body={invoiceDateBody}
              />
              <Column
                field="currency"
                header="Moneda"
                style={{ width: "90px" }}
                body={currencyBody}
              />
              <Column
                field="total"
                header="Total"
                style={{ width: "140px" }}
                body={totalBody}
              />
              <Column
                field="totalUSD"
                header="≈ USD"
                style={{ width: "120px" }}
                body={totalUSDBody}
              />
            </DataTable>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default SalesDashboardContent;
