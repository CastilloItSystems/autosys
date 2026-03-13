"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { motion } from "framer-motion";
import stockService from "@/app/api/inventory/stockService";
import { LayoutContext } from "@/layout/context/layoutcontext";

interface DashboardMetrics {
  totalItems: number;
  totalWarehouses: number;
  totalStockValue: number;
  stockHealth: {
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  movements: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  alerts: {
    critical: number;
    warning: number;
    info: number;
  };
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
  recentActivities?: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

const InventoryDashboard = () => {
  const toast = useRef<Toast>(null);
  const { layoutState, layoutConfig } = useContext(LayoutContext);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [stockHealthChart, setStockHealthChart] = useState<any>(null);
  const [movementsChart, setMovementsChart] = useState<any>(null);
  const [topMovingChart, setTopMovingChart] = useState<any>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  useEffect(() => {
    if (metrics) {
      initializeCharts();
    }
  }, [metrics, layoutState]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const response = await stockService.getDashboardMetrics();
      setMetrics(response.data);
    } catch (error) {
      console.error("Error loading dashboard metrics:", error);
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

    // Stock Health - Donut Chart
    setStockHealthChart({
      labels: ["En Stock", "Stock Bajo", "Agotado"],
      datasets: [
        {
          data: [
            metrics.stockHealth.inStock,
            metrics.stockHealth.lowStock,
            metrics.stockHealth.outOfStock,
          ],
          backgroundColor: ["#10B981", "#F59E0B", "#EF4444"],
          borderColor: layoutConfig.colorScheme === "dark" ? "#1f2937" : "#fff",
          borderWidth: 2,
        },
      ],
    });

    // Movements Trend - Line Chart
    setMovementsChart({
      labels: ["Hoy", "Esta Semana", "Este Mes"],
      datasets: [
        {
          label: "Movimientos",
          data: [
            metrics.movements.today,
            metrics.movements.thisWeek,
            metrics.movements.thisMonth,
          ],
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointBackgroundColor: "#3B82F6",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
        },
      ],
    });

    // Top Moving Items - Horizontal Bar Chart
    if (metrics.topMovingItems && metrics.topMovingItems.length > 0) {
      setTopMovingChart({
        labels: metrics.topMovingItems.map((item) =>
          item.itemName.substring(0, 20),
        ),
        datasets: [
          {
            label: "Movimientos",
            data: metrics.topMovingItems.map((item) => item.movementCount),
            backgroundColor: "#8B5CF6",
            borderColor: "#7C3AED",
            borderWidth: 1,
          },
        ],
      });
    }
  };

  const KPICard = ({
    title,
    value,
    icon,
    iconBg,
    index,
  }: {
    title: string;
    value: string | number;
    icon: string;
    iconBg: string;
    index: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card>
        <div className="flex align-items-center justify-content-between">
          <div>
            <p className="text-500 text-sm font-medium mb-1">{title}</p>
            <p className="text-4xl font-bold m-0">{value}</p>
          </div>
          <div
            className="border-round p-3 flex align-items-center justify-content-center"
            style={{
              backgroundColor: iconBg,
              width: "3.5rem",
              height: "3.5rem",
            }}
          >
            <i className={`${icon} text-2xl text-white`}></i>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex flex-column gap-3">
        <div className="grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="col-12 md:col-6 lg:col-3">
              <Card>
                <Skeleton height="80px" />
              </Card>
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
          <p className="text-500 mb-3">No se pudieron cargar las métricas</p>
          <Button
            label="Reintentar"
            icon="pi pi-refresh"
            onClick={loadMetrics}
          />
        </div>
      </Card>
    );
  }

  const alertSeverityBg =
    metrics.alerts.critical > 0
      ? "#EF4444"
      : metrics.alerts.warning > 0
      ? "#F59E0B"
      : "#3B82F6";

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: layoutConfig.colorScheme === "dark" ? "#fff" : "#333",
          padding: 15,
          font: { size: 12 },
        },
      },
    },
  };

  return (
    <div className="flex flex-column gap-4">
      <Toast ref={toast} />

      {/* KPI Cards */}
      <div className="grid">
        <div className="col-12 md:col-6 lg:col-3">
          <KPICard
            title="Total Artículos"
            value={metrics.totalItems}
            icon="pi pi-box"
            iconBg="#3B82F6"
            index={0}
          />
        </div>
        <div className="col-12 md:col-6 lg:col-3">
          <KPICard
            title="Almacenes"
            value={metrics.totalWarehouses}
            icon="pi pi-building"
            iconBg="#10B981"
            index={1}
          />
        </div>
        <div className="col-12 md:col-6 lg:col-3">
          <KPICard
            title="Valor Total Inventario"
            value={`$${(metrics.totalStockValue / 1000).toFixed(0)}K`}
            icon="pi pi-dollar"
            iconBg="#8B5CF6"
            index={2}
          />
        </div>
        <div className="col-12 md:col-6 lg:col-3">
          <KPICard
            title="Movimientos Hoy"
            value={metrics.movements.today}
            icon="pi pi-arrow-right-arrow-left"
            iconBg="#F59E0B"
            index={3}
          />
        </div>
      </div>

      {/* Alerts Card */}
      {(metrics.alerts.critical > 0 ||
        metrics.alerts.warning > 0 ||
        metrics.alerts.info > 0) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card style={{ backgroundColor: alertSeverityBg, color: "#fff" }}>
            <div className="flex align-items-center justify-content-between">
              <div>
                <h3 className="font-bold text-lg m-0">Alertas de Inventario</h3>
                <p className="text-sm mt-1 m-0" style={{ opacity: 0.9 }}>
                  {metrics.alerts.critical} crítica
                  {metrics.alerts.critical > 1 ? "s" : ""},{" "}
                  {metrics.alerts.warning} advertencia
                  {metrics.alerts.warning > 1 ? "s" : ""}
                </p>
              </div>
              <Button
                label="Ver Alertas"
                icon="pi pi-bell"
                text
                style={{ color: "#fff" }}
              />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Charts Grid */}
      <div className="grid">
        {/* Stock Health Donut */}
        <div className="col-12 xl:col-4">
          <Card title="Salud del Stock">
            <div style={{ height: "300px" }}>
              {stockHealthChart && (
                <Chart
                  type="doughnut"
                  data={stockHealthChart}
                  options={chartOptions}
                />
              )}
            </div>
          </Card>
        </div>

        {/* Movements Trend Line */}
        <div className="col-12 xl:col-8">
          <Card title="Tendencia de Movimientos">
            <div style={{ height: "300px" }}>
              {movementsChart && (
                <Chart
                  type="line"
                  data={movementsChart}
                  options={chartOptions}
                />
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Top Moving Items Chart */}
      {topMovingChart && (
        <Card title="Top 10 Artículos Más Movidos">
          <div style={{ height: "300px" }}>
            <Chart
              type="bar"
              data={topMovingChart}
              options={{
                ...chartOptions,
                indexAxis: "y" as const,
              }}
            />
          </div>
        </Card>
      )}

      {/* Tables Grid */}
      <div className="grid">
        {/* Top Warehouses */}
        <div className="col-12 xl:col-6">
          <Card title="Almacenes Principales">
            <DataTable
              value={metrics.topWarehouses}
              scrollable
              size="small"
              className="w-full"
            >
              <Column
                field="warehouseName"
                header="Almacén"
                body={(rowData) => (
                  <span className="font-semibold">{rowData.warehouseName}</span>
                )}
              />
              <Column
                field="itemCount"
                header="Artículos"
                body={(rowData) => (
                  <Tag value={rowData.itemCount} severity="info" rounded />
                )}
              />
              <Column
                field="totalValue"
                header="Valor"
                body={(rowData) => (
                  <span className="font-medium">
                    ${(rowData.totalValue / 1000).toFixed(1)}K
                  </span>
                )}
              />
            </DataTable>
          </Card>
        </div>

        {/* Recent Activities */}
        {metrics.recentActivities && metrics.recentActivities.length > 0 && (
          <div className="col-12 xl:col-6">
            <Card title="Actividades Recientes">
              <div style={{ maxHeight: "24rem", overflowY: "auto" }}>
                {metrics.recentActivities.slice(0, 10).map((activity, idx) => (
                  <div
                    key={idx}
                    className="border-left-3 border-primary pl-3 py-2 mb-2 surface-hover border-round"
                  >
                    <p className="text-sm font-medium m-0">
                      {activity.description}
                    </p>
                    <p className="text-xs text-500 mt-1 m-0">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryDashboard;
