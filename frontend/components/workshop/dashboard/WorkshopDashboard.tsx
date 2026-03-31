"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Tag } from "primereact/tag";
import { Timeline } from "primereact/timeline";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { Card } from "primereact/card";
import KPICard from "@/components/common/KPICard";
import { dashboardService } from "@/app/api/workshop";
import { handleFormError } from "@/utils/errorHandlers";
import type {
  WorkshopDashboardData,
  DashboardAlert,
  RecentActivity,
  QuickStat,
} from "@/libs/interfaces/workshop";

// ─── helpers ────────────────────────────────────────────────────────────────

function relativeTime(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Hace un momento";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}

function alertSeverity(type: DashboardAlert["type"]) {
  const map: Record<string, "warning" | "danger" | "info"> = {
    delayed: "warning",
    critical: "danger",
    warning: "warning",
    info: "info",
  };
  return map[type] ?? "info";
}

function activityIcon(type: RecentActivity["type"]): string {
  const map: Record<string, string> = {
    appointment: "pi-calendar",
    reception: "pi-inbox",
    service_order: "pi-file-edit",
    quality_check: "pi-check-square",
    delivery: "pi-sign-out",
  };
  return `pi ${map[type] ?? "pi-circle"}`;
}

// ─── component ──────────────────────────────────────────────────────────────

export default function WorkshopDashboard() {
  const router = useRouter();
  const toast = useRef<Toast>(null);
  const [data, setData] = useState<WorkshopDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboard = async () => {
    try {
      const res = await dashboardService.getDashboard();
      setData(res.data);
      setLastUpdated(new Date());
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    loadDashboard();
  };

  if (loading && !data) {
    return (
      <div className="flex flex-column align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
        <ProgressSpinner style={{ width: "60px", height: "60px" }} strokeWidth="4" />
        <p className="mt-3 text-600 font-medium">Cargando dashboard...</p>
      </div>
    );
  }

  const kpis = data?.kpis;

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
          <h2 className="text-2xl font-bold text-900 m-0">Dashboard Operativo</h2>
          {lastUpdated && (
            <span className="text-500 text-sm">
              Actualizado: {lastUpdated.toLocaleTimeString("es-MX")}
            </span>
          )}
        </div>
        <Button
          label="Actualizar"
          icon="pi pi-refresh"
          outlined
          size="small"
          loading={loading}
          onClick={handleRefresh}
        />
      </div>

      {/* ── KPI Cards ── */}
      {kpis && (
        <div className="grid mb-4">
          <div className="col-12 md:col-6 lg:col-4 xl:col-3">
            <KPICard
              title={kpis.openServiceOrders.label}
              value={kpis.openServiceOrders.value}
              icon="pi-file-edit"
              color="blue"
              trend={kpis.openServiceOrders.trend ?? null}
              onClick={() => router.push("/empresa/workshop/service-orders")}
            />
          </div>
          <div className="col-12 md:col-6 lg:col-4 xl:col-3">
            <KPICard
              title={kpis.todayAppointments.label}
              value={kpis.todayAppointments.value}
              icon="pi-calendar"
              color="teal"
              trend={kpis.todayAppointments.trend ?? null}
              onClick={() => router.push("/empresa/workshop/appointments")}
            />
          </div>
          <div className="col-12 md:col-6 lg:col-4 xl:col-3">
            <KPICard
              title={kpis.vehiclesInReception.label}
              value={kpis.vehiclesInReception.value}
              icon="pi-inbox"
              color="purple"
              trend={kpis.vehiclesInReception.trend ?? null}
              onClick={() => router.push("/empresa/workshop/receptions")}
            />
          </div>
          <div className="col-12 md:col-6 lg:col-4 xl:col-3">
            <KPICard
              title={kpis.delayedOrders.label}
              value={kpis.delayedOrders.value}
              icon="pi-clock"
              color="orange"
              trend={kpis.delayedOrders.trend ?? null}
              onClick={() => router.push("/empresa/workshop/service-orders?filter=delayed")}
            />
          </div>
          <div className="col-12 md:col-6 lg:col-4 xl:col-3">
            <KPICard
              title={kpis.techniciansAvailable.label}
              value={kpis.techniciansAvailable.value}
              icon="pi-users"
              color="green"
              trend={kpis.techniciansAvailable.trend ?? null}
            />
          </div>
          <div className="col-12 md:col-6 lg:col-4 xl:col-3">
            <KPICard
              title={kpis.pendingParts.label}
              value={kpis.pendingParts.value}
              icon="pi-box"
              color="yellow"
              trend={kpis.pendingParts.trend ?? null}
            />
          </div>
          <div className="col-12 md:col-6 lg:col-4 xl:col-3">
            <KPICard
              title={kpis.readyForDelivery.label}
              value={kpis.readyForDelivery.value}
              icon="pi-check-circle"
              color="green"
              trend={kpis.readyForDelivery.trend ?? null}
              onClick={() => router.push("/empresa/workshop/deliveries")}
            />
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          label="Nueva Cita"
          icon="pi pi-plus"
          outlined
          onClick={() => router.push("/empresa/workshop/appointments")}
        />
        <Button
          label="Nueva Recepción"
          icon="pi pi-inbox"
          outlined
          onClick={() => router.push("/empresa/workshop/receptions")}
        />
        <Button
          label="Nueva OT"
          icon="pi pi-file-edit"
          outlined
          onClick={() => router.push("/empresa/workshop/service-orders")}
        />
        <Button
          label="Ver Planificación"
          icon="pi pi-th-large"
          outlined
          onClick={() => router.push("/empresa/workshop/bays")}
        />
      </div>

      {/* ── Alerts + Activity ── */}
      <div className="grid mb-4">
        {/* Alerts panel */}
        <div className="col-12 lg:col-8">
          <Panel header="Alertas Activas" toggleable>
            {!data?.alerts?.length ? (
              <div className="flex align-items-center gap-2 text-green-600 py-2">
                <i className="pi pi-check-circle text-xl" />
                <span className="font-medium">Sin alertas activas</span>
              </div>
            ) : (
              <div className="flex flex-column gap-2">
                {data.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex align-items-center justify-content-between p-2 border-round surface-ground gap-2"
                  >
                    <div className="flex align-items-center gap-2 flex-1">
                      <Tag
                        value={alert.type}
                        severity={alertSeverity(alert.type)}
                        rounded
                        style={{ textTransform: "capitalize", minWidth: "80px" }}
                      />
                      <span className="text-900 text-sm flex-1">{alert.message}</span>
                    </div>
                    {alert.relatedId && (
                      <Button
                        icon="pi pi-arrow-right"
                        text
                        rounded
                        size="small"
                        tooltip="Ver detalle"
                        tooltipOptions={{ position: "left" }}
                        onClick={() => {
                          if (alert.relatedTo === "service_order") {
                            router.push(`/empresa/workshop/service-orders`);
                          } else if (alert.relatedTo === "appointment") {
                            router.push(`/empresa/workshop/appointments`);
                          } else if (alert.relatedTo === "reception") {
                            router.push(`/empresa/workshop/receptions`);
                          }
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Recent Activity */}
        <div className="col-12 lg:col-4">
          <Panel header="Actividad Reciente">
            {!data?.recentActivity?.length ? (
              <p className="text-600 text-sm m-0">Sin actividad reciente.</p>
            ) : (
              <Timeline
                value={data.recentActivity}
                content={(item: RecentActivity) => (
                  <div className="pb-2">
                    <p className="text-900 font-semibold text-sm m-0">{item.title}</p>
                    <p className="text-600 text-xs m-0">{item.description}</p>
                    <span className="text-400 text-xs">{relativeTime(item.timestamp)}</span>
                  </div>
                )}
                marker={(item: RecentActivity) => (
                  <span
                    className="flex align-items-center justify-content-center border-circle surface-card shadow-1"
                    style={{ width: "28px", height: "28px" }}
                  >
                    <i className={`${activityIcon(item.type)} text-xs text-primary`} />
                  </span>
                )}
              />
            )}
          </Panel>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      {!!data?.quickStats?.length && (
        <div className="flex flex-wrap gap-3">
          {data.quickStats.map((stat: QuickStat, idx: number) => (
            <Card
              key={idx}
              className="flex-1 border-round shadow-1"
              style={{ minWidth: "140px" }}
            >
              <div className="flex align-items-center gap-2">
                {stat.icon && <i className={`pi ${stat.icon} text-primary text-lg`} />}
                <div>
                  <div className="text-600 text-xs">{stat.label}</div>
                  <div className="text-900 font-bold text-lg">{stat.value}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
