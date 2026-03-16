"use client";
import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import { motion } from "framer-motion";
import stockService, {
  DashboardMetrics,
} from "@/app/api/inventory/stockService";
import { DiscrepancyWidget } from "./DiscrepancyWidget";

export default function InventoryDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await stockService.getDashboardMetrics();
      setMetrics(response.data);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  // ── Skeleton loading ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="grid">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="col-12 md:col-6 lg:col-3">
            <div className="card">
              <Skeleton width="60%" height="1.2rem" className="mb-2" />
              <Skeleton width="40%" height="2rem" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const { stockHealth, movements, alerts, topMovingItems, topWarehouses } =
    metrics;

  // ── KPI Cards ─────────────────────────────────────────────────────────

  const kpiCards = [
    {
      label: "Total Artículos",
      value: metrics.totalItems,
      icon: "pi pi-box",
      color: "blue",
    },
    {
      label: "Almacenes",
      value: metrics.totalWarehouses,
      icon: "pi pi-building",
      color: "cyan",
    },
    {
      label: "Valor Total Stock",
      value: formatCurrency(metrics.totalStockValue),
      icon: "pi pi-dollar",
      color: "green",
    },
    {
      label: "Movimientos Hoy",
      value: movements.today,
      icon: "pi pi-arrows-h",
      color: "purple",
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* KPI Cards */}
      <div className="grid mb-3">
        {kpiCards.map((kpi, idx) => (
          <div key={idx} className="col-12 md:col-6 lg:col-3">
            <div className="card mb-0">
              <div className="flex justify-content-between align-items-center mb-3">
                <div>
                  <span className="block text-500 font-medium mb-1 text-sm">
                    {kpi.label}
                  </span>
                  <div className="text-900 font-bold text-2xl">{kpi.value}</div>
                </div>
                <div
                  className={`flex align-items-center justify-content-center border-round`}
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    backgroundColor: `var(--${kpi.color}-100)`,
                  }}
                >
                  <i
                    className={`${kpi.icon} text-${kpi.color}-500 text-xl`}
                  ></i>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stock Health + Alerts + Discrepancies Row */}
      <div className="grid mb-3">
        {/* Stock Health */}
        <div className="col-12 md:col-6 lg:col-4">
          <div className="card mb-0 h-full">
            <h5 className="mb-3">
              <i className="pi pi-heart mr-2 text-primary"></i>
              Salud del Stock
            </h5>
            <div className="flex flex-column gap-3">
              <div className="flex justify-content-between align-items-center">
                <span className="text-600">En Stock</span>
                <Tag
                  value={String(stockHealth.inStock)}
                  severity="success"
                  rounded
                />
              </div>
              <div className="flex justify-content-between align-items-center">
                <span className="text-600">Stock Bajo</span>
                <Tag
                  value={String(stockHealth.lowStock)}
                  severity="warning"
                  rounded
                />
              </div>
              <div className="flex justify-content-between align-items-center">
                <span className="text-600">Agotado</span>
                <Tag
                  value={String(stockHealth.outOfStock)}
                  severity="danger"
                  rounded
                />
              </div>
            </div>
            {/* Progress bar visual */}
            <div className="mt-3">
              {(() => {
                const total =
                  stockHealth.inStock +
                  stockHealth.lowStock +
                  stockHealth.outOfStock;
                if (total === 0) return null;
                const pctIn = (stockHealth.inStock / total) * 100;
                const pctLow = (stockHealth.lowStock / total) * 100;
                const pctOut = (stockHealth.outOfStock / total) * 100;
                return (
                  <div
                    className="flex border-round overflow-hidden"
                    style={{ height: "8px" }}
                  >
                    <div
                      className="bg-green-500"
                      style={{ width: `${pctIn}%` }}
                    ></div>
                    <div
                      className="bg-yellow-500"
                      style={{ width: `${pctLow}%` }}
                    ></div>
                    <div
                      className="bg-red-500"
                      style={{ width: `${pctOut}%` }}
                    ></div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Movimientos */}
        <div className="col-12 md:col-6 lg:col-4">
          <div className="card mb-0 h-full">
            <h5 className="mb-3">
              <i className="pi pi-arrows-h mr-2 text-primary"></i>
              Movimientos
            </h5>
            <div className="flex flex-column gap-3">
              <div className="flex justify-content-between align-items-center">
                <span className="text-600">Hoy</span>
                <span className="font-bold text-xl text-900">
                  {movements.today}
                </span>
              </div>
              <div className="flex justify-content-between align-items-center">
                <span className="text-600">Esta Semana</span>
                <span className="font-bold text-xl text-900">
                  {movements.thisWeek}
                </span>
              </div>
              <div className="flex justify-content-between align-items-center">
                <span className="text-600">Este Mes</span>
                <span className="font-bold text-xl text-900">
                  {movements.thisMonth}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className="col-12 md:col-12 lg:col-4">
          <div className="card mb-0 h-full">
            <h5 className="mb-3">
              <i className="pi pi-bell mr-2 text-primary"></i>
              Alertas
            </h5>
            <div className="flex flex-column gap-3">
              <div className="flex justify-content-between align-items-center">
                <span className="text-600">Críticas</span>
                <Tag
                  value={String(alerts.critical)}
                  severity="danger"
                  rounded
                />
              </div>
              <div className="flex justify-content-between align-items-center">
                <span className="text-600">Advertencias</span>
                <Tag
                  value={String(alerts.warning)}
                  severity="warning"
                  rounded
                />
              </div>
              <div className="flex justify-content-between align-items-center">
                <span className="text-600">Informativas</span>
                <Tag value={String(alerts.info)} severity="info" rounded />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discrepancies Widget */}
      <div className="grid mb-3">
        <div className="col-12">
          <div className="card mb-0">
            <h5 className="mb-3">
              <i className="pi pi-exclamation-triangle mr-2 text-primary"></i>
              Top Discrepancias (últimos 30 días)
            </h5>
            <DiscrepancyWidget />
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid">
        {/* Top Moving Items */}
        <div className="col-12 lg:col-6">
          <div className="card mb-0">
            <h5 className="mb-3">
              <i className="pi pi-chart-line mr-2 text-primary"></i>
              Artículos con Más Movimiento
            </h5>
            <DataTable
              value={topMovingItems}
              rows={5}
              size="small"
              emptyMessage="Sin datos"
            >
              <Column field="itemName" header="Artículo" />
              <Column
                field="movementCount"
                header="Movimientos"
                body={(row) => (
                  <Tag
                    value={String(row.movementCount)}
                    severity="info"
                    rounded
                  />
                )}
                style={{ width: "120px" }}
              />
              <Column
                field="lastMovement"
                header="Último Mov."
                body={(row) =>
                  row.lastMovement
                    ? new Date(row.lastMovement).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                      })
                    : "—"
                }
                style={{ width: "100px" }}
              />
            </DataTable>
          </div>
        </div>

        {/* Top Warehouses */}
        <div className="col-12 lg:col-6">
          <div className="card mb-0">
            <h5 className="mb-3">
              <i className="pi pi-building mr-2 text-primary"></i>
              Almacenes Principales
            </h5>
            <DataTable
              value={topWarehouses}
              rows={5}
              size="small"
              emptyMessage="Sin datos"
            >
              <Column field="warehouseName" header="Almacén" />
              <Column
                field="itemCount"
                header="Artículos"
                body={(row) => (
                  <Tag value={String(row.itemCount)} severity="info" rounded />
                )}
                style={{ width: "100px" }}
              />
              <Column
                field="totalValue"
                header="Valor Total"
                body={(row) => formatCurrency(row.totalValue)}
                style={{ width: "130px" }}
              />
            </DataTable>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
