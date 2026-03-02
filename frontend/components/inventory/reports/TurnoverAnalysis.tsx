'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { ProgressBar } from 'primereact/progressbar';
import { motion } from 'framer-motion';
import {
  getAllTurnoverMetrics,
  getTurnoverByClassification,
  TurnoverMetrics,
  TurnoverClassification,
} from '@/app/api/inventory/analyticsService';
import { LayoutContext } from '@/layout/context/layoutcontext';

const TurnoverAnalysis = () => {
  const toast = useRef<Toast>(null);
  const { layoutState, layoutConfig } = useContext(LayoutContext);
  const [items, setItems] = useState<TurnoverMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(20);
  const [selectedClassification, setSelectedClassification] =
    useState<TurnoverClassification | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    loadTurnoverMetrics();
  }, [page, rows, selectedClassification]);

  useEffect(() => {
    if (summary) {
      initializeChart();
    }
  }, [summary, layoutConfig]);

  const loadTurnoverMetrics = async () => {
    setLoading(true);
    try {
      let response;
      if (selectedClassification) {
        response = await getTurnoverByClassification(selectedClassification, page, rows);
      } else {
        response = await getAllTurnoverMetrics(page, rows);
      }

      setItems(response.data);
      setTotalRecords(response.pagination.total);
      setSummary(response.summary);
    } catch (error) {
      console.error('Error loading turnover metrics:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar las métricas de rotación',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeChart = () => {
    const labels = ['Rápido', 'Moderado', 'Lento', 'Estático'];
    const counts = [
      summary.fastMovingCount || 0,
      summary.moderateCount || 0,
      summary.slowMovingCount || 0,
      (summary.totalItems || 0) -
        (summary.fastMovingCount || 0) -
        (summary.moderateCount || 0) -
        (summary.slowMovingCount || 0),
    ];
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

    setChartData({
      labels,
      datasets: [
        {
          data: counts,
          backgroundColor: colors,
          borderColor: layoutConfig.colorScheme === 'dark' ? '#1f2937' : '#fff',
          borderWidth: 2,
        },
      ],
    });
  };

  const classificationOptions = [
    { label: 'Todas las clasificaciones', value: null },
    { label: 'Rápido Movimiento', value: TurnoverClassification.FAST_MOVING },
    { label: 'Moderado', value: TurnoverClassification.MODERATE },
    { label: 'Lento Movimiento', value: TurnoverClassification.SLOW_MOVING },
    { label: 'Estático', value: TurnoverClassification.STATIC },
  ];

  const getClassificationColor = (classification: TurnoverClassification) => {
    switch (classification) {
      case TurnoverClassification.FAST_MOVING:
        return { label: 'Rápido', color: 'success', bgColor: 'bg-green-100 text-green-800' };
      case TurnoverClassification.MODERATE:
        return { label: 'Moderado', color: 'info', bgColor: 'bg-blue-100 text-blue-800' };
      case TurnoverClassification.SLOW_MOVING:
        return { label: 'Lento', color: 'warning', bgColor: 'bg-yellow-100 text-yellow-800' };
      case TurnoverClassification.STATIC:
        return { label: 'Estático', color: 'danger', bgColor: 'bg-red-100 text-red-800' };
      default:
        return { label: 'Desconocido', color: 'secondary', bgColor: 'bg-gray-100 text-gray-800' };
    }
  };

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: layoutConfig.colorScheme === 'dark' ? '#fff' : '#333',
          padding: 15,
        },
      },
    },
  };

  const healthScoreBody = (rowData: TurnoverMetrics) => (
    <div className="flex items-center gap-2">
      <ProgressBar
        value={rowData.healthScore}
        style={{ height: '24px', width: '100px' }}
        color={
          rowData.healthScore >= 70
            ? '#10B981'
            : rowData.healthScore >= 40
              ? '#F59E0B'
              : '#EF4444'
        }
      />
      <span className="text-sm font-medium">{rowData.healthScore.toFixed(0)}/100</span>
    </div>
  );

  const columns = [
    {
      field: 'itemName',
      header: 'Artículo',
      width: '18%',
      sortable: true,
    },
    {
      field: 'sku',
      header: 'SKU',
      width: '12%',
      sortable: true,
    },
    {
      field: 'turnoverRatio',
      header: 'Ratio de Rotación',
      width: '14%',
      sortable: true,
      body: (rowData: TurnoverMetrics) => (
        <span className="font-semibold">{rowData.turnoverRatio.toFixed(2)}x</span>
      ),
    },
    {
      field: 'daysInventoryOutstanding',
      header: 'DIO (Días)',
      width: '12%',
      sortable: true,
      body: (rowData: TurnoverMetrics) => (
        <span>{rowData.daysInventoryOutstanding.toFixed(0)} días</span>
      ),
    },
    {
      field: 'healthScore',
      header: 'Salud',
      width: '16%',
      sortable: true,
      body: healthScoreBody,
    },
    {
      field: 'classification',
      header: 'Clasificación',
      width: '14%',
      body: (rowData: TurnoverMetrics) => {
        const cfg = getClassificationColor(rowData.classification);
        return <Tag value={cfg.label} severity={cfg.color as any} />;
      },
    },
    {
      field: 'trend',
      header: 'Tendencia',
      width: '10%',
      body: (rowData: TurnoverMetrics) => {
        const icons: { [key: string]: string } = {
          improving: 'pi pi-arrow-up text-green-600',
          declining: 'pi pi-arrow-down text-red-600',
          stable: 'pi pi-minus text-yellow-600',
        };
        return <i className={icons[rowData.trend]}></i>;
      },
    },
  ];

  if (loading && !chartData) {
    return (
      <div className="space-y-4">
        <Card>
          <Skeleton height="300px" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast ref={toast} />

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <Card className="text-center">
              <p className="text-gray-500 text-sm">Total Analizados</p>
              <p className="text-3xl font-bold text-gray-700">
                {summary.averageTurnover?.toFixed(1) || 0}x
              </p>
              <p className="text-xs text-gray-500 mt-1">Rotación Promedio</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="text-center bg-green-50 dark:bg-green-900/20">
              <p className="text-gray-500 text-sm">Rápido Movimiento</p>
              <p className="text-3xl font-bold text-green-600">
                {summary.fastMovingCount}
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="text-center bg-blue-50 dark:bg-blue-900/20">
              <p className="text-gray-500 text-sm">Moderado</p>
              <p className="text-3xl font-bold text-blue-600">
                {summary.moderateCount}
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="text-center bg-yellow-50 dark:bg-yellow-900/20">
              <p className="text-gray-500 text-sm">Lento Movimiento</p>
              <p className="text-3xl font-bold text-yellow-600">
                {summary.slowMovingCount}
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="text-center bg-red-50 dark:bg-red-900/20">
              <p className="text-gray-500 text-sm">Estático</p>
              <p className="text-3xl font-bold text-red-600">
                {summary.staticCount}
              </p>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Distribution Chart */}
      {chartData && (
        <Card title="Distribución por Clasificación" className="shadow-lg">
          <div style={{ height: '300px' }}>
            <Chart
              type="doughnut"
              data={chartData}
              options={chartOptions}
            />
          </div>
        </Card>
      )}

      {/* Filter and Data Table */}
      <Card title="Análisis Detallado de Rotación" className="shadow-lg">
        <div className="mb-4 flex gap-3">
          <div className="flex flex-col gap-2 w-48">
            <label className="text-sm font-medium">Filtrar por clasificación</label>
            <Dropdown
              options={classificationOptions}
              value={selectedClassification}
              onChange={(e) => {
                setSelectedClassification(e.value);
                setPage(1);
              }}
              placeholder="Seleccionar clasificación"
            />
          </div>
        </div>

        <DataTable
          value={items}
          loading={loading}
          paginator
          rows={rows}
          first={(page - 1) * rows}
          totalRecords={totalRecords}
          onPage={(e: DataTablePageEvent) => {
            setPage((e.page ?? 0) + 1);
            setRows(e.rows ?? 20);
          }}
          dataKey="itemId"
          stripedRows
          responsiveLayout="scroll"
          emptyMessage="No hay datos disponibles"
          className="w-full text-sm"
        >
          {columns.map((col) => (
            <Column
              key={col.field}
              field={col.field}
              header={col.header}
              body={col.body}
              style={{ width: col.width }}
              sortable={col.sortable}
            />
          ))}
        </DataTable>
      </Card>

      {/* Legend */}
      <Card title="Definiciones" className="text-sm text-gray-600 dark:text-gray-400">
        <div className="space-y-2">
          <p>
            <strong>Ratio de Rotación:</strong> Número de veces que el inventario se vende y se
            reemplaza durante el período.
          </p>
          <p>
            <strong>DIO (Days Inventory Outstanding):</strong> Número de días promedio que un
            artículo permanece en inventario.
          </p>
          <p>
            <strong>Salud:</strong> Puntuación 0-100 basada en rotación, tendencia y consistencia.
          </p>
          <p>
            <strong>Clasificación:</strong> Rápido (rotación alta), Moderado (rotación media), Lento
            (rotación baja), Estático (sin movimiento reciente).
          </p>
        </div>
      </Card>
    </div>
  );
};

export default TurnoverAnalysis;
