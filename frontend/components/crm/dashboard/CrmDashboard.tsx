"use client";
import React, { useState, useEffect } from "react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import { Button } from "primereact/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import crmDashboardService, { CrmDashboardData } from "@/app/api/crm/crmDashboardService";
import {
  LEAD_STATUS_CONFIG,
  LEAD_CHANNEL_CONFIG,
} from "@/libs/interfaces/crm/lead.interface";
import { QUOTE_STATUS_CONFIG } from "@/libs/interfaces/crm/quote.interface";
import {
  CASE_STATUS_CONFIG,
  CASE_PRIORITY_CONFIG,
} from "@/libs/interfaces/crm/case.interface";

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-VE", { style: "currency", currency: "USD" }).format(value);

const isOverdue = (date: string | null | undefined): boolean =>
  !!date && new Date(date) < new Date();

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

// ── Component ─────────────────────────────────────────────────────────────────

export default function CrmDashboard() {
  const router = useRouter();
  const [data, setData] = useState<CrmDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await crmDashboardService.get();
      setData(response.data);
    } catch (error) {
      console.error("Error loading CRM dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Skeleton loading ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="grid">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="col-12 md:col-6 lg:col-3">
            <div className="card">
              <Skeleton width="60%" height="1.2rem" className="mb-2" />
              <Skeleton width="40%" height="2rem" className="mb-2" />
              <Skeleton width="80%" height="1rem" />
            </div>
          </div>
        ))}
        <div className="col-12 md:col-6">
          <div className="card">
            <Skeleton width="50%" height="1.5rem" className="mb-3" />
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} width="100%" height="1.2rem" className="mb-2" />
            ))}
          </div>
        </div>
        <div className="col-12 md:col-6">
          <div className="card">
            <Skeleton width="50%" height="1.5rem" className="mb-3" />
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} width="100%" height="1.2rem" className="mb-2" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { leads, quotes, cases, customers, activities, serviceOrders } = data;

  // ── KPI Cards ─────────────────────────────────────────────────────────────

  const kpiCards = [
    {
      label: "Leads este mes",
      value: leads.thisMonth,
      icon: "pi pi-chart-line",
      color: "blue",
      subtitle: `Tasa conversión: ${leads.conversionRate.toFixed(1)}%`,
      subtitleColor: "text-500",
    },
    {
      label: "Pipeline activo",
      value: formatCurrency(quotes.pipelineValue),
      icon: "pi pi-file",
      color: "green",
      subtitle: `${quotes.active} cotizaciones activas`,
      subtitleColor: "text-500",
    },
    {
      label: "Casos abiertos",
      value: cases.open,
      icon: "pi pi-folder-open",
      color: "orange",
      subtitle: `${cases.overdue} vencidos`,
      subtitleColor: cases.overdue > 0 ? "text-red-500 font-semibold" : "text-500",
    },
    {
      label: "Clientes activos",
      value: customers.active,
      icon: "pi pi-users",
      color: "cyan",
      subtitle: `${customers.newThisMonth} nuevos este mes`,
      subtitleColor: "text-500",
    },
  ];

  // ── Bar chart helper ───────────────────────────────────────────────────────

  const renderBars = (
    items: { label: string; value: number; color: string }[],
    total: number
  ) => (
    <div className="flex flex-column gap-3">
      {items.map((item) => {
        const pct = total > 0 ? (item.value / total) * 100 : 0;
        return (
          <div key={item.label}>
            <div className="flex justify-content-between align-items-center mb-1">
              <span className="text-600 text-sm">{item.label}</span>
              <span className="font-bold text-900 text-sm">{item.value}</span>
            </div>
            <div
              className="border-round overflow-hidden"
              style={{ height: "6px", backgroundColor: "var(--surface-200)" }}
            >
              <div
                className={`bg-${item.color}-500`}
                style={{ width: `${pct}%`, height: "100%", borderRadius: "inherit" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Channel totals ────────────────────────────────────────────────────────

  const channelBars = [
    { label: "Repuestos", value: leads.byChannel["REPUESTOS"] ?? 0, color: "blue" },
    { label: "Taller", value: leads.byChannel["TALLER"] ?? 0, color: "orange" },
    { label: "Vehículos", value: leads.byChannel["VEHICULOS"] ?? 0, color: "green" },
  ];
  const channelTotal = channelBars.reduce((acc, b) => acc + b.value, 0);

  // ── Priority totals ────────────────────────────────────────────────────────

  const priorityBars = [
    { label: "Crítica", value: cases.byPriority["CRITICAL"] ?? 0, color: "red" },
    { label: "Alta", value: cases.byPriority["HIGH"] ?? 0, color: "orange" },
    { label: "Media", value: cases.byPriority["MEDIUM"] ?? 0, color: "blue" },
    { label: "Baja", value: cases.byPriority["LOW"] ?? 0, color: "gray" },
  ];
  const priorityTotal = priorityBars.reduce((acc, b) => acc + b.value, 0);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Row 1: KPI Cards ── */}
      <div className="grid mb-3">
        {kpiCards.map((kpi, idx) => (
          <div key={idx} className="col-12 md:col-6 lg:col-3">
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
              <span className={`text-xs ${kpi.subtitleColor}`}>{kpi.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 2: Pipeline por Canal + Casos por Prioridad ── */}
      <div className="grid mb-3">
        <div className="col-12 md:col-6">
          <div className="card mb-0 h-full">
            <h5 className="mb-3">
              <i className="pi pi-chart-bar mr-2 text-primary" />
              Pipeline por Canal
            </h5>
            {renderBars(channelBars, channelTotal)}
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="card mb-0 h-full">
            <h5 className="mb-3">
              <i className="pi pi-flag mr-2 text-primary" />
              Casos por Prioridad
            </h5>
            {renderBars(priorityBars, priorityTotal)}
          </div>
        </div>
      </div>

      {/* ── Row 3: Leads recientes + Cotizaciones recientes ── */}
      <div className="grid mb-3">
        {/* Leads recientes */}
        <div className="col-12 md:col-6">
          <div className="card mb-0">
            <div className="flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">
                <i className="pi pi-chart-line mr-2 text-primary" />
                Leads recientes
              </h5>
              <Button
                label="Ver todos"
                link
                size="small"
                onClick={() => router.push("/empresa/crm/leads")}
              />
            </div>
            <DataTable
              value={leads.recentLeads}
              size="small"
              emptyMessage="Sin leads recientes"
            >
              <Column field="title" header="Título" style={{ minWidth: "120px" }} />
              <Column
                field="channel"
                header="Canal"
                body={(row) => {
                  const cfg = LEAD_CHANNEL_CONFIG[row.channel as keyof typeof LEAD_CHANNEL_CONFIG];
                  return cfg ? (
                    <Tag value={cfg.label} severity={cfg.severity} />
                  ) : (
                    <span className="text-500 text-xs">{row.channel}</span>
                  );
                }}
                style={{ width: "100px" }}
              />
              <Column
                field="status"
                header="Estado"
                body={(row) => {
                  const cfg = LEAD_STATUS_CONFIG[row.status as keyof typeof LEAD_STATUS_CONFIG];
                  return cfg ? (
                    <Tag value={cfg.label} severity={cfg.severity} />
                  ) : (
                    <span className="text-500 text-xs">{row.status}</span>
                  );
                }}
                style={{ width: "110px" }}
              />
              <Column
                field="customer"
                header="Cliente"
                body={(row) => (
                  <span className="text-600 text-sm">
                    {row.customer?.name ?? "—"}
                  </span>
                )}
                style={{ width: "110px" }}
              />
              <Column
                field="createdAt"
                header="Fecha"
                body={(row) => (
                  <span className="text-500 text-xs">{formatDate(row.createdAt)}</span>
                )}
                style={{ width: "80px" }}
              />
            </DataTable>
          </div>
        </div>

        {/* Cotizaciones recientes */}
        <div className="col-12 md:col-6">
          <div className="card mb-0">
            <div className="flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">
                <i className="pi pi-file mr-2 text-primary" />
                Cotizaciones recientes
              </h5>
              <Button
                label="Ver todas"
                link
                size="small"
                onClick={() => router.push("/empresa/crm/cotizaciones")}
              />
            </div>
            <DataTable
              value={quotes.recentQuotes}
              size="small"
              emptyMessage="Sin cotizaciones recientes"
            >
              <Column
                field="quoteNumber"
                header="N°"
                style={{ width: "80px" }}
                body={(row) => (
                  <span className="text-500 text-xs font-mono">{row.quoteNumber}</span>
                )}
              />
              <Column field="title" header="Título" style={{ minWidth: "100px" }} />
              <Column
                field="status"
                header="Estado"
                body={(row) => {
                  const cfg = QUOTE_STATUS_CONFIG[row.status];
                  return cfg ? (
                    <Tag value={cfg.label} severity={cfg.severity} />
                  ) : (
                    <span className="text-500 text-xs">{row.status}</span>
                  );
                }}
                style={{ width: "110px" }}
              />
              <Column
                field="total"
                header="Total"
                body={(row) => (
                  <span className="font-semibold text-sm">{formatCurrency(row.total)}</span>
                )}
                style={{ width: "100px" }}
              />
              <Column
                field="customer"
                header="Cliente"
                body={(row) => (
                  <span className="text-600 text-sm">
                    {row.customer?.name ?? "—"}
                  </span>
                )}
                style={{ width: "100px" }}
              />
              <Column
                field="createdAt"
                header="Fecha"
                body={(row) => (
                  <span className="text-500 text-xs">{formatDate(row.createdAt)}</span>
                )}
                style={{ width: "80px" }}
              />
            </DataTable>
          </div>
        </div>
      </div>

      {/* ── Row 4: Actividades vencidas + Casos recientes ── */}
      <div className="grid mb-3">
        {/* Actividades vencidas */}
        <div className="col-12 md:col-6">
          <div className="card mb-0">
            <div className="flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">
                <i className="pi pi-exclamation-triangle mr-2 text-red-500" />
                Actividades vencidas
              </h5>
              <Button
                label="Ver actividades"
                link
                size="small"
                onClick={() => router.push("/empresa/crm/actividades")}
              />
            </div>
            {activities.recentOverdue.length === 0 ? (
              <div className="flex align-items-center gap-2 text-green-600 p-3">
                <i className="pi pi-check-circle text-xl" />
                <span className="text-sm font-medium">Sin actividades vencidas</span>
              </div>
            ) : (
              <div className="flex flex-column gap-2">
                {activities.recentOverdue.map((act) => (
                  <div
                    key={act.id}
                    className="flex justify-content-between align-items-center surface-50 border-round p-2 border-left-3 border-red-400"
                  >
                    <div>
                      <div className="font-semibold text-sm">{act.title}</div>
                      <div className="text-xs text-500 mt-1">
                        <span className="surface-100 border-round px-1 mr-1">{act.type}</span>
                        {act.assignedTo && (
                          <span className="text-400">{act.assignedTo}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-red-500 text-xs font-semibold text-right">
                      <i className="pi pi-calendar mr-1" />
                      {formatDate(act.dueAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Casos recientes */}
        <div className="col-12 md:col-6">
          <div className="card mb-0">
            <div className="flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">
                <i className="pi pi-folder-open mr-2 text-primary" />
                Casos recientes
              </h5>
              <Button
                label="Ver todos"
                link
                size="small"
                onClick={() => router.push("/empresa/crm/casos")}
              />
            </div>
            <DataTable
              value={cases.recentCases}
              size="small"
              emptyMessage="Sin casos recientes"
            >
              <Column
                field="caseNumber"
                header="N° Caso"
                style={{ width: "80px" }}
                body={(row) => (
                  <span className="text-500 text-xs font-mono">{row.caseNumber}</span>
                )}
              />
              <Column field="title" header="Título" style={{ minWidth: "100px" }} />
              <Column
                field="priority"
                header="Prioridad"
                body={(row) => {
                  const cfg = CASE_PRIORITY_CONFIG[row.priority];
                  return cfg ? (
                    <Tag value={cfg.label} severity={cfg.severity} />
                  ) : (
                    <span className="text-500 text-xs">{row.priority}</span>
                  );
                }}
                style={{ width: "90px" }}
              />
              <Column
                field="status"
                header="Estado"
                body={(row) => {
                  const cfg = CASE_STATUS_CONFIG[row.status];
                  return cfg ? (
                    <Tag value={cfg.label} severity={cfg.severity} />
                  ) : (
                    <span className="text-500 text-xs">{row.status}</span>
                  );
                }}
                style={{ width: "110px" }}
              />
              <Column
                field="slaDeadline"
                header="SLA"
                body={(row) =>
                  row.slaDeadline ? (
                    <span
                      className={`text-xs font-semibold ${
                        isOverdue(row.slaDeadline) ? "text-red-500" : "text-500"
                      }`}
                    >
                      {formatDate(row.slaDeadline)}
                    </span>
                  ) : (
                    <span className="text-400 text-xs">—</span>
                  )
                }
                style={{ width: "80px" }}
              />
              <Column
                field="customer"
                header="Cliente"
                body={(row) => (
                  <span className="text-600 text-sm">
                    {row.customer?.name ?? "—"}
                  </span>
                )}
                style={{ width: "100px" }}
              />
            </DataTable>
          </div>
        </div>
      </div>

      {/* ── Row 5: Stats footer ── */}
      <div className="grid">
        <div className="col-12 md:col-4">
          <div className="card mb-0">
            <div className="flex align-items-center gap-3">
              <div
                className="flex align-items-center justify-content-center border-round"
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  backgroundColor:
                    activities.pending > 0
                      ? "var(--yellow-100)"
                      : "var(--surface-100)",
                }}
              >
                <i
                  className={`pi pi-check-square text-xl ${
                    activities.pending > 0 ? "text-yellow-600" : "text-500"
                  }`}
                />
              </div>
              <div>
                <div className="text-500 text-xs mb-1">Actividades pendientes</div>
                <div
                  className={`font-bold text-xl ${
                    activities.pending > 0 ? "text-yellow-700" : "text-900"
                  }`}
                >
                  {activities.pending}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 md:col-4">
          <div className="card mb-0">
            <div className="flex align-items-center gap-3">
              <div
                className="flex align-items-center justify-content-center border-round"
                style={{ width: "2.5rem", height: "2.5rem", backgroundColor: "var(--blue-100)" }}
              >
                <i className="pi pi-wrench text-blue-500 text-xl" />
              </div>
              <div>
                <div className="text-500 text-xs mb-1">Taller activo</div>
                <div className="font-bold text-xl text-900">
                  {serviceOrders.active} <span className="text-sm font-normal text-500">órdenes</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 md:col-4">
          <div className="card mb-0">
            <div className="flex align-items-center gap-3">
              <div
                className="flex align-items-center justify-content-center border-round"
                style={{ width: "2.5rem", height: "2.5rem", backgroundColor: "var(--green-100)" }}
              >
                <i className="pi pi-dollar text-green-500 text-xl" />
              </div>
              <div>
                <div className="text-500 text-xs mb-1">Ingresos taller este mes</div>
                <div className="font-bold text-xl text-green-700">
                  {formatCurrency(serviceOrders.totalRevenueThisMonth)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
