"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";
import { motion } from "framer-motion";
import stockService from "@/app/api/inventory/stockService";
import { LayoutContext } from "@/layout/context/layoutcontext";

interface DashboardMetrics {
  totalItems: number;
  totalWarehouses: number;
  totalStockValue: number;
  stockHealth: { inStock: number; lowStock: number; outOfStock: number };
  movements: { today: number; thisWeek: number; thisMonth: number };
  dailyMovements?: Array<{ date: string; count: number }>;
  alerts: { critical: number; warning: number; info: number };
  topMovingItems: Array<{
    itemId: string;
    itemName: string;
    movementCount: number;
    lastMovement?: string;
  }>;
  topWarehouses: Array<{
    warehouseId: string;
    warehouseName: string;
    itemCount: number;
    totalValue: number;
  }>;
  recentActivities?: Array<{ type: string; description: string; timestamp: string }>;
}

const fmt = (n: number) =>
  n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtCompact = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${fmt(n)}`;
};

const MOVEMENT_ICONS: Record<string, string> = {
  PURCHASE: "pi pi-arrow-down-left",
  SALE: "pi pi-arrow-up-right",
  ADJUSTMENT_IN: "pi pi-plus-circle",
  ADJUSTMENT_OUT: "pi pi-minus-circle",
  TRANSFER: "pi pi-arrows-h",
  SUPPLIER_RETURN: "pi pi-replay",
  WORKSHOP_RETURN: "pi pi-replay",
  RESERVATION_RELEASE: "pi pi-lock-open",
  LOAN_OUT: "pi pi-share-alt",
  LOAN_RETURN: "pi pi-share-alt",
};

const MOVEMENT_COLORS: Record<string, string> = {
  PURCHASE: "#22C55E",
  SALE: "#EF4444",
  ADJUSTMENT_IN: "#3B82F6",
  ADJUSTMENT_OUT: "#F97316",
  TRANSFER: "#8B5CF6",
  SUPPLIER_RETURN: "#F59E0B",
  WORKSHOP_RETURN: "#F59E0B",
  RESERVATION_RELEASE: "#06B6D4",
  LOAN_OUT: "#EC4899",
  LOAN_RETURN: "#EC4899",
};

const InventoryDashboard = () => {
  const toast = useRef<Toast>(null);
  const { layoutConfig } = useContext(LayoutContext);
  const isDark = layoutConfig.colorScheme === "dark";

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [stockHealthChart, setStockHealthChart] = useState<any>(null);
  const [movementsChart, setMovementsChart] = useState<any>(null);
  const [topMovingChart, setTopMovingChart] = useState<any>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  useEffect(() => {
    if (metrics) initializeCharts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics, isDark]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const response = await stockService.getDashboardMetrics();
      setMetrics(response.data);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las métricas",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeCharts = () => {
    if (!metrics) return;
    const textColor = isDark ? "#cbd5e1" : "#475569";
    const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

    const baseOpts = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          position: "bottom" as const,
          labels: { color: textColor, padding: 14, font: { size: 12 } },
        },
      },
    };

    // Stock Health — donut
    setStockHealthChart({
      labels: ["En Stock", "Stock Bajo", "Agotado"],
      datasets: [
        {
          data: [
            metrics.stockHealth.inStock,
            metrics.stockHealth.lowStock,
            metrics.stockHealth.outOfStock,
          ],
          backgroundColor: ["#22C55E", "#F59E0B", "#EF4444"],
          borderColor: isDark ? "#1e293b" : "#fff",
          borderWidth: 3,
        },
      ],
      _opts: { ...baseOpts, cutout: "65%" },
    });

    // Movements trend — 7-day bar
    if (metrics.dailyMovements && metrics.dailyMovements.length > 0) {
      const days = metrics.dailyMovements;
      setMovementsChart({
        labels: days.map((d) => {
          const date = new Date(d.date + "T00:00:00");
          return date.toLocaleDateString("es-VE", { weekday: "short", day: "numeric" });
        }),
        datasets: [
          {
            label: "Movimientos",
            data: days.map((d) => d.count),
            backgroundColor: "rgba(59,130,246,0.7)",
            borderColor: "#3B82F6",
            borderWidth: 2,
            borderRadius: 6,
          },
        ],
        _opts: {
          ...baseOpts,
          plugins: { ...baseOpts.plugins, legend: { display: false } },
          scales: {
            x: { ticks: { color: textColor }, grid: { color: gridColor } },
            y: { ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } },
          },
        },
      });
    } else {
      setMovementsChart({
        labels: ["Hoy", "Últimos 7d", "Últimos 30d"],
        datasets: [
          {
            label: "Movimientos",
            data: [metrics.movements.today, metrics.movements.thisWeek, metrics.movements.thisMonth],
            backgroundColor: ["rgba(59,130,246,0.8)", "rgba(59,130,246,0.55)", "rgba(59,130,246,0.3)"],
            borderColor: "#3B82F6",
            borderWidth: 2,
            borderRadius: 6,
          },
        ],
        _opts: {
          ...baseOpts,
          plugins: { ...baseOpts.plugins, legend: { display: false } },
          scales: {
            x: { ticks: { color: textColor }, grid: { color: gridColor } },
            y: { ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } },
          },
        },
      });
    }

    // Top moving items — horizontal bar
    if (metrics.topMovingItems?.length > 0) {
      const palette = ["#8B5CF6","#3B82F6","#22C55E","#F97316","#EF4444","#06B6D4","#F59E0B","#EC4899","#84CC16","#14B8A6"];
      setTopMovingChart({
        labels: metrics.topMovingItems.map((i) =>
          i.itemName.length > 24 ? i.itemName.substring(0, 24) + "…" : i.itemName
        ),
        datasets: [
          {
            label: "Movimientos",
            data: metrics.topMovingItems.map((i) => i.movementCount),
            backgroundColor: metrics.topMovingItems.map((_, idx) => palette[idx % palette.length]),
            borderRadius: 4,
          },
        ],
        _opts: {
          ...baseOpts,
          indexAxis: "y" as const,
          plugins: { ...baseOpts.plugins, legend: { display: false } },
          scales: {
            x: { ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } },
            y: { ticks: { color: textColor } },
          },
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-column gap-3">
        <div className="grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="col-12 md:col-6 lg:col-3">
              <Skeleton height="88px" className="border-round-lg" />
            </div>
          ))}
        </div>
        <div className="grid">
          {[1, 2].map((i) => (
            <div key={i} className="col-12 md:col-6">
              <Skeleton height="300px" className="border-round-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <div className="text-center p-5">
          <i className="pi pi-exclamation-circle text-4xl text-500 mb-3" />
          <p className="text-500 mb-3">No se pudieron cargar las métricas</p>
          <Button label="Reintentar" icon="pi pi-refresh" onClick={loadMetrics} />
        </div>
      </Card>
    );
  }

  const totalAlerts = metrics.alerts.critical + metrics.alerts.warning;
  const maxWarehouseValue = Math.max(...metrics.topWarehouses.map((w) => w.totalValue), 1);

  return (
    <div className="flex flex-column gap-4">
      <Toast ref={toast} />

      {/* KPI Cards */}
      <div className="grid">
        {[
          {
            title: "Total Artículos",
            value: metrics.totalItems.toLocaleString("es-VE"),
            sub: `${metrics.totalWarehouses} almacén${metrics.totalWarehouses !== 1 ? "es" : ""}`,
            icon: "pi pi-box",
            iconColor: "#3B82F6",
            bg: "#EFF6FF",
          },
          {
            title: "Valor Total Inventario",
            value: fmtCompact(metrics.totalStockValue),
            sub: `$${fmt(metrics.totalStockValue)}`,
            icon: "pi pi-dollar",
            iconColor: "#8B5CF6",
            bg: "#F5F3FF",
          },
          {
            title: "Movimientos Hoy",
            value: metrics.movements.today,
            sub: `${metrics.movements.thisWeek} esta semana · ${metrics.movements.thisMonth} este mes`,
            icon: "pi pi-arrow-right-arrow-left",
            iconColor: "#F59E0B",
            bg: "#FFFBEB",
          },
          {
            title: "Alertas Activas",
            value: totalAlerts,
            sub: `${metrics.alerts.critical} agotados · ${metrics.alerts.warning} stock bajo`,
            icon: "pi pi-bell",
            iconColor: totalAlerts > 0 ? "#EF4444" : "#22C55E",
            bg: totalAlerts > 0 ? "#FEF2F2" : "#F0FDF4",
          },
        ].map((card, idx) => (
          <div key={idx} className="col-12 md:col-6 lg:col-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <Card className="shadow-1 h-full">
                <div className="flex align-items-center justify-content-between">
                  <div>
                    <p className="text-500 text-sm font-medium mb-1">{card.title}</p>
                    <p className="text-3xl font-bold m-0">{card.value}</p>
                    <p className="text-400 text-xs mt-1 m-0">{card.sub}</p>
                  </div>
                  <div
                    className="border-round p-3 flex align-items-center justify-content-center flex-shrink-0"
                    style={{ backgroundColor: card.bg, width: "3.5rem", height: "3.5rem" }}
                  >
                    <i className={card.icon} style={{ fontSize: "1.5rem", color: card.iconColor }} />
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        ))}
      </div>

      {/* Alerts banner — colored left border, not full background */}
      {totalAlerts > 0 && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <div
            className="flex align-items-center justify-content-between p-3 border-round border-left-4"
            style={{
              borderColor: metrics.alerts.critical > 0 ? "#EF4444" : "#F59E0B",
              backgroundColor: metrics.alerts.critical > 0 ? "#FEF2F2" : "#FFFBEB",
            }}
          >
            <div className="flex align-items-center gap-3">
              <i
                className="pi pi-bell text-xl"
                style={{ color: metrics.alerts.critical > 0 ? "#EF4444" : "#F59E0B" }}
              />
              <div>
                <p className="font-semibold m-0 text-sm">Alertas de Inventario</p>
                <p className="text-500 text-xs m-0">
                  {metrics.alerts.critical > 0 && (
                    <span className="text-red-600 font-medium">
                      {metrics.alerts.critical} artículo{metrics.alerts.critical !== 1 ? "s" : ""} agotado{metrics.alerts.critical !== 1 ? "s" : ""}
                    </span>
                  )}
                  {metrics.alerts.critical > 0 && metrics.alerts.warning > 0 && " · "}
                  {metrics.alerts.warning > 0 && (
                    <span className="text-orange-600 font-medium">
                      {metrics.alerts.warning} con stock bajo
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Button
              label="Ver Stock Bajo"
              icon="pi pi-arrow-right"
              size="small"
              text
              style={{ color: metrics.alerts.critical > 0 ? "#EF4444" : "#F59E0B" }}
            />
          </div>
        </motion.div>
      )}

      {/* Charts row */}
      <div className="grid">
        {/* Stock Health donut */}
        <div className="col-12 xl:col-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card title="Salud del Stock" className="shadow-1">
              <div style={{ height: 260 }}>
                {stockHealthChart && (
                  <Chart type="doughnut" data={stockHealthChart} options={stockHealthChart._opts} />
                )}
              </div>
              <div className="flex justify-content-around mt-3 pt-2 border-top-1 surface-border">
                {[
                  { label: "En Stock", value: metrics.stockHealth.inStock, color: "#22C55E" },
                  { label: "Stock Bajo", value: metrics.stockHealth.lowStock, color: "#F59E0B" },
                  { label: "Agotado", value: metrics.stockHealth.outOfStock, color: "#EF4444" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="font-bold text-xl m-0" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-400 text-xs m-0">{s.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Movements trend bar */}
        <div className="col-12 xl:col-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
            <Card
              title={metrics.dailyMovements ? "Movimientos — Últimos 7 Días" : "Movimientos por Período"}
              className="shadow-1"
            >
              <div style={{ height: 300 }}>
                {movementsChart && (
                  <Chart type="bar" data={movementsChart} options={movementsChart._opts} />
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Top Moving Items chart */}
      {topMovingChart && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}>
          <Card title="Top 10 Artículos Más Movidos" className="shadow-1">
            <div style={{ height: 320 }}>
              <Chart type="bar" data={topMovingChart} options={topMovingChart._opts} />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Bottom tables row */}
      <div className="grid">
        {/* Top Warehouses with progress bars */}
        <div className="col-12 xl:col-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}>
            <Card title="Almacenes Principales" className="shadow-1">
              <div className="flex flex-column gap-3">
                {metrics.topWarehouses.map((w, i) => {
                  const pct = (w.totalValue / maxWarehouseValue) * 100;
                  const colors = ["#3B82F6","#8B5CF6","#22C55E","#F97316","#EF4444"];
                  const color = colors[i % colors.length];
                  return (
                    <div key={w.warehouseId}>
                      <div className="flex justify-content-between align-items-center mb-1">
                        <span className="font-medium text-sm">{w.warehouseName}</span>
                        <div className="flex align-items-center gap-2">
                          <Tag value={`${w.itemCount} arts.`} severity="info" rounded />
                          <span className="font-semibold text-sm" style={{ color }}>
                            {fmtCompact(w.totalValue)}
                          </span>
                        </div>
                      </div>
                      <ProgressBar value={pct} showValue={false} style={{ height: 7 }} color={color} />
                    </div>
                  );
                })}
                {metrics.topWarehouses.length === 0 && (
                  <p className="text-400 text-center py-3 text-sm">Sin datos de almacenes</p>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Recent Activities with icons */}
        <div className="col-12 xl:col-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}>
            <Card title="Actividad Reciente" className="shadow-1">
              <div style={{ maxHeight: "22rem", overflowY: "auto" }}>
                {(metrics.recentActivities ?? []).slice(0, 12).map((activity, idx) => {
                  const icon = MOVEMENT_ICONS[activity.type] ?? "pi pi-circle";
                  const color = MOVEMENT_COLORS[activity.type] ?? "#94A3B8";
                  return (
                    <div
                      key={idx}
                      className="flex align-items-start gap-3 py-2 border-bottom-1 surface-border"
                    >
                      <div
                        className="flex align-items-center justify-content-center border-round-sm flex-shrink-0 mt-1"
                        style={{ width: 28, height: 28, background: color + "22" }}
                      >
                        <i className={icon} style={{ fontSize: "0.8rem", color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium m-0 white-space-nowrap overflow-hidden text-overflow-ellipsis">
                          {activity.description}
                        </p>
                        <p className="text-xs text-400 mt-1 m-0">
                          {new Date(activity.timestamp).toLocaleString("es-VE", {
                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {(!metrics.recentActivities || metrics.recentActivities.length === 0) && (
                  <div className="flex flex-column align-items-center py-5 text-400 gap-2">
                    <i className="pi pi-history text-3xl" />
                    <span className="text-sm">Sin actividad reciente</span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;
