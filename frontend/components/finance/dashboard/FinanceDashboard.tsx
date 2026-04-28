"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import financeDashboardService, {
  type FinanceDashboardData,
} from "@/app/api/finance/financeDashboardService";
import { handleFormError } from "@/utils/errorHandlers";

const CURRENCY_COLORS: Record<string, string> = {
  USD: "green",
  VES: "blue",
  EUR: "purple",
};

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  UTILITIES: "Servicios",
  RENT: "Alquiler",
  PAYROLL: "Nómina",
  SERVICES: "Servicios Prof.",
  MAINTENANCE: "Mantenimiento",
  SUPPLIES: "Insumos",
  MARKETING: "Marketing",
  TAXES: "Impuestos",
  BANK_FEES: "Comisiones",
  TRANSPORT: "Transporte",
  OTHER: "Otros",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  MOBILE_PAYMENT: "Pago Móvil",
  CHECK: "Cheque",
  CREDIT: "Crédito",
  MIXED: "Mixto",
};

const BILL_STATUS_SEVERITY: Record<string, "warning" | "info" | "danger"> = {
  PENDING: "warning",
  PARTIAL: "info",
};

const fmt = (v: number) =>
  v.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function FinanceDashboard() {
  const toast = useRef<Toast>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinanceDashboardData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const result = await financeDashboardService.getDashboard();
      setData(result);
      setLastUpdated(new Date());
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalPendingAP = useMemo(() => {
    if (!data) return 0;
    return data.ap.totalPending + data.ap.totalPartial;
  }, [data]);

  const kpiCards = useMemo(() => {
    if (!data) return [];
    const balanceEntries = Object.entries(data.balancesByCurrency);
    return [
      ...balanceEntries.map(([currency, balance]) => ({
        label: `Saldo ${currency}`,
        value: `${currency} ${fmt(balance)}`,
        icon: "pi pi-wallet",
        color: CURRENCY_COLORS[currency] ?? "teal",
        subtitle: `${data.bankAccounts.filter((a) => a.currency === currency).length} cuenta(s)`,
        onClick: () => router.push("/empresa/finanzas/cuentas-bancarias"),
      })),
      {
        label: "Por Cobrar",
        value: `${fmt(data.ar?.totalPending ?? 0)}`,
        icon: "pi pi-arrow-up",
        color: (data.ar?.overdueCount ?? 0) > 0 ? "red" : "blue",
        subtitle: `${data.ar?.countPending ?? 0} pre-facturas · ${data.ar?.overdueCount ?? 0} vencidas`,
        onClick: () => router.push("/empresa/finanzas/cuentas-por-cobrar"),
      },
      {
        label: "Por Pagar",
        value: `${fmt(totalPendingAP)}`,
        icon: "pi pi-file-import",
        color: data.ap.overdueCount > 0 ? "red" : "orange",
        subtitle: `${data.ap.countPending + data.ap.countPartial} facturas · ${data.ap.overdueCount} vencidas`,
        onClick: () => router.push("/empresa/finanzas/cuentas-por-pagar"),
      },
      {
        label: "Gastos del Mes",
        value: `${fmt(data.expenses.total)}`,
        icon: "pi pi-receipt",
        color: "orange",
        subtitle: `${data.expenses.count} gastos`,
        onClick: () => router.push("/empresa/finanzas/gastos"),
      },
      {
        label: "Cobrado este Mes",
        value: `${fmt(data.ar?.collectedThisMonth ?? 0)}`,
        icon: "pi pi-check-circle",
        color: "green",
        subtitle: `${data.ar?.countCollectedThisMonth ?? 0} cobros`,
        onClick: () => router.push("/empresa/finanzas/cuentas-por-cobrar"),
      },
      {
        label: "Pagado este Mes",
        value: `${fmt(data.paymentsThisMonth.total)}`,
        icon: "pi pi-check-circle",
        color: "teal",
        subtitle: `${data.paymentsThisMonth.count} pagos`,
        onClick: () => router.push("/empresa/finanzas/pagos-proveedor"),
      },
    ];
  }, [data, totalPendingAP]);

  if (loading && !data) {
    return (
      <div className="p-3">
        <div className="flex align-items-center justify-content-between mb-4">
          <Skeleton width="240px" height="1.8rem" />
          <Skeleton width="110px" height="2.2rem" />
        </div>
        <div className="grid mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="col-12 md:col-6 lg:col-3">
              <div className="card">
                <Skeleton width="120px" height="0.9rem" className="mb-2" />
                <Skeleton width="160px" height="2rem" className="mb-1" />
                <Skeleton width="80%" height="0.8rem" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="col-12 md:col-6">
              <Skeleton height="260px" />
            </div>
          ))}
        </div>
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

      {/* Header */}
      <div className="flex flex-wrap align-items-center justify-content-between mb-4 gap-2">
        <div>
          <h2 className="text-2xl font-bold text-900 m-0">
            <i className="pi pi-dollar mr-2 text-primary" />
            Dashboard de Finanzas
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
          onClick={load}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid mb-4">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="col-12 md:col-6 lg:col-3">
            <div
              className="card mb-0 cursor-pointer hover:surface-100 transition-colors transition-duration-150"
              style={{ borderLeft: `4px solid var(--${kpi.color}-500)` }}
              onClick={kpi.onClick}
            >
              <div className="flex justify-content-between align-items-center mb-2">
                <div>
                  <span className="block text-500 font-medium mb-1 text-sm">{kpi.label}</span>
                  <div className="text-900 font-bold text-xl">{kpi.value}</div>
                </div>
                <div
                  className="flex align-items-center justify-content-center border-round"
                  style={{ width: "2.5rem", height: "2.5rem", backgroundColor: `var(--${kpi.color}-100)` }}
                >
                  <i className={`${kpi.icon} text-${kpi.color}-500 text-xl`} />
                </div>
              </div>
              <span className="text-xs text-500">{kpi.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Alerta AR — cuentas por cobrar vencidas */}
      {data && (data.ar?.overdueCount ?? 0) > 0 && (
        <div className="grid mb-3">
          <div className="col-12 md:col-6">
            <div
              className="flex align-items-center gap-3 p-3 border-round border-1 border-blue-300 bg-blue-50 cursor-pointer"
              onClick={() => router.push("/empresa/finanzas/cuentas-por-cobrar")}
            >
              <i className="pi pi-exclamation-triangle text-blue-500 text-2xl" />
              <div>
                <div className="font-semibold text-blue-700">
                  {data.ar.overdueCount} pre-factura(s) vencida(s) por cobrar
                </div>
                <div className="text-sm text-blue-600">Revisar cuentas por cobrar</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alertas AP */}
      {data && (data.ap.overdueCount > 0 || data.ap.dueSoonCount > 0) && (
        <div className="grid mb-3">
          {data.ap.overdueCount > 0 && (
            <div className="col-12 md:col-6">
              <div
                className="flex align-items-center gap-3 p-3 border-round border-1 border-red-300 bg-red-50 cursor-pointer"
                onClick={() => router.push("/empresa/finanzas/cuentas-por-pagar")}
              >
                <i className="pi pi-exclamation-triangle text-red-500 text-2xl" />
                <div>
                  <div className="font-semibold text-red-700">
                    {data.ap.overdueCount} factura(s) vencida(s)
                  </div>
                  <div className="text-sm text-red-600">Requieren pago inmediato</div>
                </div>
              </div>
            </div>
          )}
          {data.ap.dueSoonCount > 0 && (
            <div className="col-12 md:col-6">
              <div
                className="flex align-items-center gap-3 p-3 border-round border-1 border-orange-300 bg-orange-50 cursor-pointer"
                onClick={() => router.push("/empresa/finanzas/cuentas-por-pagar")}
              >
                <i className="pi pi-clock text-orange-500 text-2xl" />
                <div>
                  <div className="font-semibold text-orange-700">
                    {data.ap.dueSoonCount} factura(s) vencen en 7 días
                  </div>
                  <div className="text-sm text-orange-600">Revisar para evitar mora</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid">
        {/* Facturas pendientes */}
        <div className="col-12 md:col-7">
          <Card
            title={
              <div className="flex align-items-center justify-content-between">
                <span>Facturas Pendientes de Pago</span>
                <Button
                  label="Ver todas"
                  size="small"
                  text
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  onClick={() => router.push("/empresa/finanzas/cuentas-por-pagar")}
                />
              </div>
            }
          >
            {data?.recentBills.length === 0 ? (
              <div className="text-center text-500 py-4">
                <i className="pi pi-check-circle text-green-400 text-3xl block mb-2" />
                Sin facturas pendientes
              </div>
            ) : (
              <DataTable value={data?.recentBills ?? []} size="small" stripedRows>
                <Column
                  header="Proveedor"
                  body={(r) => (
                    <div>
                      <div className="font-medium text-sm">{r.supplierName}</div>
                      <div className="text-xs text-500">{r.billNumber ?? r.internalNumber}</div>
                    </div>
                  )}
                />
                <Column
                  header="Pendiente"
                  body={(r) => (
                    <span className="font-semibold text-orange-600">
                      {r.currency} {fmt(r.pendingAmount)}
                    </span>
                  )}
                  style={{ width: "130px" }}
                />
                <Column
                  header="Vence"
                  body={(r) => {
                    if (!r.dueDate) return <span className="text-500">—</span>;
                    const due = new Date(r.dueDate);
                    const isOverdue = due < new Date();
                    return (
                      <span className={isOverdue ? "text-red-600 font-semibold" : "text-700"}>
                        {due.toLocaleDateString("es-VE")}
                        {isOverdue && <i className="pi pi-exclamation-circle ml-1 text-red-500" />}
                      </span>
                    );
                  }}
                  style={{ width: "110px" }}
                />
                <Column
                  header="Estado"
                  body={(r) => (
                    <Tag
                      value={r.status === "PENDING" ? "Pendiente" : "Parcial"}
                      severity={BILL_STATUS_SEVERITY[r.status] ?? "warning"}
                    />
                  )}
                  style={{ width: "90px" }}
                />
              </DataTable>
            )}
          </Card>
        </div>

        {/* Gastos por categoría */}
        <div className="col-12 md:col-5">
          <Card title="Gastos del Mes por Categoría">
            {!data || data.expenses.byCategory.length === 0 ? (
              <div className="text-center text-500 py-4">
                <i className="pi pi-inbox text-300 text-3xl block mb-2" />
                Sin gastos este mes
              </div>
            ) : (
              <div className="flex flex-column gap-2">
                {[...data.expenses.byCategory]
                  .sort((a, b) => b.total - a.total)
                  .map((cat) => {
                    const pct = data.expenses.total > 0
                      ? Math.round((cat.total / data.expenses.total) * 100)
                      : 0;
                    return (
                      <div key={cat.category}>
                        <div className="flex justify-content-between text-sm mb-1">
                          <span className="text-700">{EXPENSE_CATEGORY_LABELS[cat.category] ?? cat.category}</span>
                          <span className="font-semibold">{fmt(cat.total)} ({pct}%)</span>
                        </div>
                        <ProgressBar value={pct} showValue={false} style={{ height: "6px" }} />
                      </div>
                    );
                  })}
                <div className="flex justify-content-between text-sm font-bold border-top-1 surface-border pt-2 mt-1">
                  <span>Total</span>
                  <span>{fmt(data.expenses.total)}</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Flujo mensual + Top deudores */}
        <div className="col-12 mt-3">
          <div className="grid">
            {/* Gráfico flujo mensual */}
            <div className="col-12 md:col-8">
              <Card title="Flujo de Caja — Últimos 6 Meses">
                {!data || data.monthlyCashFlow.length === 0 ? (
                  <div className="text-center text-500 py-4">
                    <i className="pi pi-chart-bar text-300 text-3xl block mb-2" />
                    Sin datos de flujo de caja
                  </div>
                ) : (
                  <div className="flex flex-column gap-3">
                    {/* USD chart */}
                    {data.monthlyCashFlow.some(m => m.USD_income > 0 || m.USD_outcome > 0) && (
                      <div>
                        <span className="text-xs font-semibold text-500 uppercase mb-2 block">USD</span>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={data.monthlyCashFlow} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-200)" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v: number) => `$ ${v.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="USD_income" name="Entradas USD" fill="var(--green-400)" radius={[3,3,0,0]} />
                            <Bar dataKey="USD_outcome" name="Salidas USD" fill="var(--red-400)" radius={[3,3,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {/* VES chart */}
                    {data.monthlyCashFlow.some(m => m.VES_income > 0 || m.VES_outcome > 0) && (
                      <div>
                        <span className="text-xs font-semibold text-500 uppercase mb-2 block">VES</span>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={data.monthlyCashFlow} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-200)" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `Bs.${(v/1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v: number) => `Bs. ${v.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="VES_income" name="Entradas VES" fill="var(--blue-400)" radius={[3,3,0,0]} />
                            <Bar dataKey="VES_outcome" name="Salidas VES" fill="var(--orange-400)" radius={[3,3,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Top deudores */}
            <div className="col-12 md:col-4">
              <Card
                title={
                  <div className="flex align-items-center justify-content-between">
                    <span>Top Deudores</span>
                    <Button label="Ver CxC" size="small" text icon="pi pi-arrow-right" iconPos="right"
                      onClick={() => router.push("/empresa/finanzas/cuentas-por-cobrar")} />
                  </div>
                }
              >
                {!data || data.topDebtors.length === 0 ? (
                  <div className="text-center text-500 py-4">
                    <i className="pi pi-check-circle text-green-400 text-3xl block mb-2" />
                    Sin deudores
                  </div>
                ) : (
                  <div className="flex flex-column gap-2">
                    {data.topDebtors.map((d, idx) => (
                      <div key={d.customerId} className="flex justify-content-between align-items-center py-2 border-bottom-1 surface-border">
                        <div className="flex align-items-center gap-2">
                          <span
                            className="flex align-items-center justify-content-center border-round font-bold text-sm"
                            style={{ width: "1.6rem", height: "1.6rem", backgroundColor: `var(--${["red","orange","yellow","blue","teal"][idx]}-100)`, color: `var(--${["red","orange","yellow","blue","teal"][idx]}-600)` }}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-900">{d.customerName}</div>
                            <div className="text-xs text-500">{d.count} pre-factura(s)</div>
                          </div>
                        </div>
                        <span className="font-bold text-orange-600 text-sm">{fmt(d.pendingAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>

        {/* Pagos recientes */}
        <div className="col-12 mt-3">
          <Card
            title={
              <div className="flex align-items-center justify-content-between">
                <span>Últimos Pagos</span>
                <Button
                  label="Ver todos"
                  size="small"
                  text
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  onClick={() => router.push("/empresa/finanzas/pagos-proveedor")}
                />
              </div>
            }
          >
            {!data || data.recentPayments.length === 0 ? (
              <div className="text-center text-500 py-4">Sin pagos registrados</div>
            ) : (
              <DataTable value={data.recentPayments} size="small" stripedRows>
                <Column
                  header="N° Pago"
                  field="paymentNumber"
                  style={{ width: "140px" }}
                  body={(r) => <span className="font-mono text-sm">{r.paymentNumber}</span>}
                />
                <Column
                  header="Destino"
                  body={(r) => (
                    <div>
                      <div className="text-sm font-medium">{r.supplierName ?? (r.isExpense ? "Gasto" : "—")}</div>
                      {r.reference && <div className="text-xs text-500">{r.reference}</div>}
                    </div>
                  )}
                />
                <Column
                  header="Método"
                  body={(r) => <Tag value={PAYMENT_METHOD_LABELS[r.method] ?? r.method} severity="info" />}
                  style={{ width: "120px" }}
                />
                <Column
                  header="Monto"
                  body={(r) => (
                    <span className="font-semibold text-green-600">
                      {r.currency} {fmt(r.amount)}
                    </span>
                  )}
                  style={{ width: "130px" }}
                />
                <Column
                  header="Fecha"
                  body={(r) => new Date(r.processedAt).toLocaleDateString("es-VE")}
                  style={{ width: "100px" }}
                />
              </DataTable>
            )}
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
