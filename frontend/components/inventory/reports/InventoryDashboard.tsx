'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { motion } from 'framer-motion';
import { getDashboardMetrics } from '@/app/api/inventory/stockService';
import { LayoutContext } from '@/layout/context/layoutcontext';

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
      const response = await getDashboardMetrics();
      setMetrics(response.data);
    } catch (error) {
      console.error('Error loading dashboard metrics:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar las métricas',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeCharts = () => {
    if (!metrics) return;

    const textColor = layoutConfig.colorScheme === 'dark' ? '#fff' : '#333';
    const gridColor = layoutConfig.colorScheme === 'dark' ? '#444' : '#ddd';

    // Stock Health - Donut Chart
    const healthTotal =
      metrics.stockHealth.inStock +
      metrics.stockHealth.lowStock +
      metrics.stockHealth.outOfStock;

    setStockHealthChart({
      labels: ['En Stock', 'Stock Bajo', 'Agotado'],
      datasets: [
        {
          data: [
            metrics.stockHealth.inStock,
            metrics.stockHealth.lowStock,
            metrics.stockHealth.outOfStock,
          ],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
          borderColor: layoutConfig.colorScheme === 'dark' ? '#1f2937' : '#fff',
          borderWidth: 2,
        },
      ],
    });

    // Movements Trend - Line Chart (simulated)
    setMovementsChart({
      labels: ['Hoy', 'Esta Semana', 'Este Mes'],
      datasets: [
        {
          label: 'Movimientos',
          data: [
            metrics.movements.today,
            metrics.movements.thisWeek,
            metrics.movements.thisMonth,
          ],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointBackgroundColor: '#3B82F6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    });

    // Top Moving Items - Horizontal Bar Chart
    if (metrics.topMovingItems && metrics.topMovingItems.length > 0) {
      setTopMovingChart({
        labels: metrics.topMovingItems.map((item) => item.itemName.substring(0, 20)),
        datasets: [
          {
            label: 'Movimientos',
            data: metrics.topMovingItems.map((item) => item.movementCount),
            backgroundColor: '#8B5CF6',
            borderColor: '#7C3AED',
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
    color,
    index,
  }: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    index: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <div className={`p-4 rounded-lg ${color}`}>
            <i className={`${icon} text-2xl text-white`}></i>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <Skeleton height="100px" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card className="text-center p-8">
        <p className="text-gray-500">No se pudieron cargar las métricas</p>
        <Button
          label="Reintentar"
          icon="pi pi-refresh"
          onClick={loadMetrics}
          className="mt-4"
        />
      </Card>
    );
  }

  const alertColor =
    metrics.alerts.critical > 0
      ? 'bg-red-500'
      : metrics.alerts.warning > 0
        ? 'bg-yellow-500'
        : 'bg-blue-500';

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: layoutConfig.colorScheme === 'dark' ? '#fff' : '#333',
          padding: 15,
          font: { size: 12 },
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      <Toast ref={toast} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Artículos"
          value={metrics.totalItems}
          icon="pi pi-box"
          color="bg-blue-500"
          index={0}
        />
        <KPICard
          title="Almacenes"
          value={metrics.totalWarehouses}
          icon="pi pi-building"
          color="bg-green-500"
          index={1}
        />
        <KPICard
          title="Valor Total Inventario"
          value={`$${(metrics.totalStockValue / 1000).toFixed(0)}K`}
          icon="pi pi-dollar"
          color="bg-purple-500"
          index={2}
        />
        <KPICard
          title="Movimientos Hoy"
          value={metrics.movements.today}
          icon="pi pi-arrow-right-arrow-left"
          color="bg-orange-500"
          index={3}
        />
      </div>

      {/* Alerts Card */}
      {(metrics.alerts.critical > 0 ||
        metrics.alerts.warning > 0 ||
        metrics.alerts.info > 0) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className={`${alertColor} text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Alertas de Inventario</h3>
                <p className="text-sm mt-1 opacity-90">
                  {metrics.alerts.critical} crítica
                  {metrics.alerts.critical > 1 ? 's' : ''},{' '}
                  {metrics.alerts.warning} advertencia
                  {metrics.alerts.warning > 1 ? 's' : ''}
                </p>
              </div>
              <Button
                label="Ver Alertas"
                icon="pi pi-bell"
                text
                className="text-white hover:bg-white hover:bg-opacity-20"
              />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Stock Health Donut */}
        <Card title="Salud del Stock" className="shadow-lg">
          <div style={{ height: '300px' }}>
            {stockHealthChart && (
              <Chart
                type="doughnut"
                data={stockHealthChart}
                options={chartOptions}
              />
            )}
          </div>
        </Card>

        {/* Movements Trend Line */}
        <div className="xl:col-span-2">
          <Card title="Tendencia de Movimientos" className="shadow-lg">
            <div style={{ height: '300px' }}>
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
        <Card title="Top 10 Artículos Más Movidos" className="shadow-lg">
          <div style={{ height: '300px' }}>
            <Chart
              type="bar"
              data={topMovingChart}
              options={{
                ...chartOptions,
                indexAxis: 'y' as const,
              }}
            />
          </div>
        </Card>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Warehouses */}
        <Card title="Almacenes Principales" className="shadow-lg">
          <DataTable
            value={metrics.topWarehouses}
            responsiveLayout="scroll"
            className="text-sm"
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
                <Tag
                  value={rowData.itemCount}
                  severity="info"
                  rounded
                />
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

        {/* Recent Activities */}
        {metrics.recentActivities && metrics.recentActivities.length > 0 && (
          <Card title="Actividades Recientes" className="shadow-lg">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {metrics.recentActivities.slice(0, 10).map((activity, idx) => (
                <div
                  key={idx}
                  className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition"
                >
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InventoryDashboard;
