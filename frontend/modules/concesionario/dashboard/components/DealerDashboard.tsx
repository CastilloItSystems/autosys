"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";
import { Toast } from "primereact/toast";
import { motion } from "framer-motion";
import { DealerHistoryItem } from "../services/dealerDashboardService";
import { handleFormError } from "@/utils/errorHandlers";
import { useDealerDashboardData } from "../hooks/useDealerDashboardData";
import {
  DASHBOARD_TYPE_CONFIG,
  DASHBOARD_STATUS_SEVERITY,
  formatDashboardDate,
} from "../utils/dealerDashboard.utils";

// ── Component ──────────────────────────────────────────────────────────────────

export default function DealerDashboard() {
  const toast = useRef<Toast>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const {
    overview,
    kpis,
    history,
    integrations,
    lastUpdated,
    loading,
    error,
    mutate,
  } = useDealerDashboardData(debouncedSearch);

  const fmtMoney = (v: number) => {
    try {
      return new Intl.NumberFormat("es-VE", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(v || 0);
    } catch {
      return `$${(v || 0).toFixed(0)}`;
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (error) {
      handleFormError(error, toast);
    }
  }, [error]);

  const kpiCards = useMemo(
    () => [
      {
        label: "Unidades",
        value: overview?.units.total ?? 0,
        icon: "pi pi-car",
        color: "blue",
        subtitle: `Disp: ${overview?.units.available ?? 0} · Reserv: ${
          overview?.units.reserved ?? 0
        }`,
      },
      {
        label: "Reservas",
        value: overview?.reservations.total ?? 0,
        icon: "pi pi-calendar",
        color: "purple",
        subtitle: "Activas",
      },
      {
        label: "Cotizaciones",
        value: overview?.quotes.total ?? 0,
        icon: "pi pi-file",
        color: "green",
        subtitle: `Aprobadas: ${overview?.quotes.approved ?? 0}`,
      },
      {
        label: "Pruebas de Manejo",
        value: overview?.testDrives.total ?? 0,
        icon: "pi pi-flag",
        color: "teal",
        subtitle: `Completadas: ${overview?.testDrives.completed ?? 0}`,
      },
      {
        label: "Retomas",
        value: overview?.tradeIns.total ?? 0,
        icon: "pi pi-refresh",
        color: "orange",
        subtitle: "Avalúos comerciales",
      },
      {
        label: "Financiamientos",
        value: overview?.financing.total ?? 0,
        icon: "pi pi-credit-card",
        color: "yellow",
        subtitle: `Aprobados: ${overview?.financing.approved ?? 0}`,
      },
      {
        label: "Entregas",
        value: overview?.deliveries.total ?? 0,
        icon: "pi pi-box",
        color: "red",
        subtitle: `Entregadas: ${overview?.deliveries.delivered ?? 0}`,
      },
    ],
    [overview],
  );

  // ── Skeleton ──────────────────────────────────────────────────────────────────

  if (loading && !overview) {
    return (
      <div className="p-3">
        <div className="flex align-items-center justify-content-between mb-4">
          <div>
            <Skeleton width="280px" height="1.8rem" className="mb-2" />
            <Skeleton width="360px" height="1rem" />
          </div>
          <Skeleton width="110px" height="2.2rem" />
        </div>
        <div className="grid mb-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="col-12 md:col-6 lg:col-3">
              <div className="card">
                <div className="flex justify-content-between align-items-center mb-2">
                  <div>
                    <Skeleton width="100px" height="0.9rem" className="mb-2" />
                    <Skeleton width="60px" height="2rem" />
                  </div>
                  <Skeleton shape="circle" size="2.5rem" />
                </div>
                <Skeleton width="80%" height="0.8rem" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const historyHeader = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <i className="pi pi-history text-primary" />
        <span className="font-bold text-900">Historial Comercial</span>
        <span className="text-500 text-sm">({history.length} recientes)</span>
      </div>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente, número o unidad"
        />
      </span>
    </div>
  );

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
            <i className="pi pi-car mr-2 text-primary" />
            Dashboard Concesionario
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
          onClick={() => mutate()}
        />
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid mb-4">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="col-12 md:col-6 lg:col-4 xl:col-3">
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

      {/* ── KPIs Comerciales / Financieros / Operativos ── */}
      {kpis && (
        <div className="grid mb-4">
          <div className="col-12 lg:col-4">
            <div className="card mb-0 h-full">
              <h5 className="mb-3">
                <i className="pi pi-filter mr-2 text-primary" />
                Conversión
              </h5>
              <ul className="list-none p-0 m-0 flex flex-column gap-2">
                <li className="flex justify-content-between">
                  <span className="text-600">Leads VEHICULOS</span>
                  <span className="font-bold text-900">{kpis.conversion.leadsVehiculos}</span>
                </li>
                <li className="flex justify-content-between">
                  <span className="text-600">Oportunidades</span>
                  <span className="font-bold text-900">{kpis.conversion.opportunities}</span>
                </li>
                <li className="flex justify-content-between">
                  <span className="text-600">Lead → Oportunidad</span>
                  <Tag value={`${kpis.conversion.leadToOpportunityPct}%`} severity="info" />
                </li>
                <li className="flex justify-content-between">
                  <span className="text-600">Oportunidad → Venta</span>
                  <Tag value={`${kpis.conversion.opportunityToSalePct}%`} severity="success" />
                </li>
                <li className="flex justify-content-between">
                  <span className="text-600">Cotizaciones convertidas</span>
                  <span className="font-bold text-900">{kpis.conversion.convertedQuotes}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="col-12 lg:col-4">
            <div className="card mb-0 h-full">
              <h5 className="mb-3">
                <i className="pi pi-dollar mr-2 text-primary" />
                Financiero
              </h5>
              <ul className="list-none p-0 m-0 flex flex-column gap-2">
                <li className="flex justify-content-between">
                  <span className="text-600">Monto vendido</span>
                  <span className="font-bold text-900">{fmtMoney(kpis.financial.amountSold)}</span>
                </li>
                <li className="flex justify-content-between">
                  <span className="text-600">Ticket promedio</span>
                  <span className="font-bold text-900">{fmtMoney(kpis.financial.avgTicket)}</span>
                </li>
                <li className="flex justify-content-between">
                  <span className="text-600">Financiadas vs contado</span>
                  <Tag value={`${kpis.financial.financedVsCashPct}%`} severity="warning" />
                </li>
                <li className="flex justify-content-between">
                  <span className="text-600">Ventas (fin/contado)</span>
                  <span className="font-bold text-900">
                    {kpis.financial.financedCount} / {kpis.financial.cashCount}
                  </span>
                </li>
                <li className="flex justify-content-between">
                  <span className="text-600">Comisiones</span>
                  <span className="font-bold text-900">{fmtMoney(kpis.financial.commissionsTotal)}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="col-12 lg:col-4">
            <div className="card mb-0 h-full">
              <h5 className="mb-3">
                <i className="pi pi-cog mr-2 text-primary" />
                Operativo
              </h5>
              <ul className="list-none p-0 m-0 flex flex-column gap-2">
                <li className="flex justify-content-between">
                  <span className="text-600">Unidades disponibles</span>
                  <span className="font-bold text-900">{kpis.operational.availableUnits}</span>
                </li>
                <li className="flex justify-content-between">
                  <span className="text-600">Unidades reservadas</span>
                  <span className="font-bold text-900">{kpis.operational.reservedUnits}</span>
                </li>
                <li className="flex justify-content-between">
                  <span className="text-600">Reservas activas</span>
                  <span className="font-bold text-900">{kpis.operational.activeReservations}</span>
                </li>
                <li className="flex justify-content-between">
                  <span className="text-600">Entregas pendientes</span>
                  <span className="font-bold text-900">{kpis.operational.pendingDeliveries}</span>
                </li>
                <li className="flex justify-content-between">
                  <span className="text-600">Documentos incompletos</span>
                  <Tag
                    value={String(kpis.operational.incompleteDocuments)}
                    severity={kpis.operational.incompleteDocuments > 0 ? "danger" : "success"}
                  />
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── History + Integrations ── */}
      <div className="grid">
        <div className="col-12 lg:col-8">
          <div className="card mb-0">
            <DataTable
              value={history}
              loading={loading}
              header={historyHeader}
              size="small"
              responsiveLayout="scroll"
              emptyMessage="No hay actividad comercial reciente"
            >
              <Column
                field="type"
                header="Tipo"
                style={{ width: "110px" }}
                body={(row: DealerHistoryItem) => {
                  const cfg = DASHBOARD_TYPE_CONFIG[row.type];
                  return cfg ? (
                    <Tag value={cfg.label} severity={cfg.severity} />
                  ) : (
                    <span className="text-xs text-500">{row.type}</span>
                  );
                }}
              />
              <Column
                field="number"
                header="Número"
                style={{ width: "90px" }}
                body={(row: DealerHistoryItem) => (
                  <span className="text-xs font-mono text-500">
                    {row.number}
                  </span>
                )}
              />
              <Column field="customerName" header="Cliente" />
              <Column
                field="unitRef"
                header="Unidad"
                body={(row: DealerHistoryItem) => (
                  <span className="text-sm text-600">{row.unitRef}</span>
                )}
              />
              <Column
                field="status"
                header="Estatus"
                style={{ width: "110px" }}
                body={(row: DealerHistoryItem) => (
                  <Tag
                    value={row.status}
                    severity={DASHBOARD_STATUS_SEVERITY[row.status] ?? "info"}
                  />
                )}
              />
              <Column
                header="Fecha"
                style={{ width: "90px" }}
                body={(row: DealerHistoryItem) => (
                  <span className="text-xs text-500">
                    {formatDashboardDate(row.occurredAt)}
                  </span>
                )}
              />
            </DataTable>
          </div>
        </div>

        {/* ── Integrations ── */}
        <div className="col-12 lg:col-4">
          <div className="card mb-0 h-full">
            <h5 className="mb-3">
              <i className="pi pi-link mr-2 text-primary" />
              Integraciones Funcionales
            </h5>

            <div
              className="flex align-items-center justify-content-between p-3 border-round mb-3"
              style={{
                borderLeft: "4px solid var(--green-500)",
                backgroundColor: "var(--surface-50)",
              }}
            >
              <div>
                <div className="text-500 text-xs mb-1">
                  Leads CRM · Canal VEHICULOS
                </div>
                <div className="text-900 font-bold text-2xl">
                  {loading ? (
                    <Skeleton width="3rem" height="1.5rem" />
                  ) : (
                    integrations?.crm.leadsVehiculos ?? 0
                  )}
                </div>
              </div>
              <div
                className="flex align-items-center justify-content-center border-round"
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  backgroundColor: "var(--green-100)",
                }}
              >
                <i className="pi pi-chart-line text-green-500 text-xl" />
              </div>
            </div>

            <div className="flex flex-column gap-2">
              {(integrations?.alerts || []).map((alert) => (
                <div
                  key={alert.key}
                  className="flex align-items-center justify-content-between p-2 border-round surface-ground"
                >
                  <span className="text-sm text-900">{alert.label}</span>
                  <Tag
                    value={String(alert.count)}
                    severity={alert.severity}
                    rounded
                  />
                </div>
              ))}
              {!integrations?.alerts?.length && !loading && (
                <div className="flex align-items-center gap-2 text-green-600 p-2">
                  <i className="pi pi-check-circle" />
                  <span className="text-sm">Sin alertas activas</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
