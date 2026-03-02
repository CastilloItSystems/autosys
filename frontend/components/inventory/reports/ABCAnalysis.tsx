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
import { motion } from 'framer-motion';
import { getABCAnalysis, ABCItem, ABCClassification } from '@/app/api/inventory/analyticsService';
import ReportsTable from './ReportsTable';
import { LayoutContext } from '@/layout/context/layoutcontext';

const ABCAnalysis = () => {
  const toast = useRef<Toast>(null);
  const { layoutState, layoutConfig } = useContext(LayoutContext);
  const [items, setItems] = useState<ABCItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(20);
  const [chartData, setChartData] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    loadABCAnalysis();
  }, [page, rows]);

  useEffect(() => {
    if (items.length > 0) {
      initializeParetoChart();
    }
  }, [items, layoutState]);

  const loadABCAnalysis = async () => {
    setLoading(true);
    try {
      const response = await getABCAnalysis(page, rows);
      setItems(response.data);
      setTotalRecords(response.pagination.total);
      setSummary(response.summary);
    } catch (error) {
      console.error('Error loading ABC analysis:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los datos del análisis ABC',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeParetoChart = () => {
    // Prepare data for Pareto chart
    const sortedItems = [...items].sort(
      (a, b) => b.totalMovementValue - a.totalMovementValue
    );

    let cumulativeValue = 0;
    const totalValue = summary?.totalMovementValue || 0;
    const cumulativePercentages = sortedItems.map((item) => {
      cumulativeValue += item.totalMovementValue;
      return (cumulativeValue / totalValue) * 100;
    });

    setChartData({
      labels: sortedItems.map((item) => item.itemName.substring(0, 15)),
      datasets: [
        {
          label: 'Valor Total ($)',
          data: sortedItems.map((item) => item.totalMovementValue),
          backgroundColor: sortedItems.map((item) => {
            if (item.classification === ABCClassification.A) return '#10B981';
            if (item.classification === ABCClassification.B) return '#F59E0B';
            return '#EF4444';
          }),
          borderColor: layoutConfig.colorScheme === 'dark' ? '#1f2937' : '#fff',
          borderWidth: 1,
          yAxisID: 'y',
          order: 2,
        },
        {
          label: 'Porcentaje Acumulado (%)',
          data: cumulativePercentages,
          borderColor: '#3B82F6',
          backgroundColor: 'transparent',
          borderWidth: 3,
          type: 'line' as const,
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#3B82F6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          yAxisID: 'y1',
          order: 1,
        },
      ],
    });
  };

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: layoutConfig.colorScheme === 'dark' ? '#fff' : '#333',
          padding: 15,
        },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        ticks: {
          color: layoutConfig.colorScheme === 'dark' ? '#fff' : '#333',
        },
        grid: {
          color: layoutConfig.colorScheme === 'dark' ? '#444' : '#ddd',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: 0,
        max: 100,
        ticks: {
          color: layoutConfig.colorScheme === 'dark' ? '#fff' : '#333',
          callback: (value: any) => value + '%',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const classificationBadge = (classification: ABCClassification) => {
    const severities: { [key in ABCClassification]: string } = {
      [ABCClassification.A]: 'success',
      [ABCClassification.B]: 'warning',
      [ABCClassification.C]: 'danger',
    };
    const labels: { [key in ABCClassification]: string } = {
      [ABCClassification.A]: 'Clase A (80%)',
      [ABCClassification.B]: 'Clase B (95%)',
      [ABCClassification.C]: 'Clase C (resto)',
    };

    return (
      <Tag
        value={labels[classification]}
        severity={severities[classification] as any}
      />
    );
  };

  const recommendationTemplate = (rowData: ABCItem) => (
    <div className="space-y-1">
      {rowData.recommendations &&
        rowData.recommendations.slice(0, 2).map((rec, idx) => (
          <p key={idx} className="text-xs text-gray-600 dark:text-gray-400">
            • {rec}
          </p>
        ))}
    </div>
  );

  const columns = [
    {
      field: 'itemName',
      header: 'Artículo',
      width: '20%',
      sortable: true,
    },
    {
      field: 'sku',
      header: 'SKU',
      width: '12%',
      sortable: true,
    },
    {
      field: 'totalMovementValue',
      header: 'Valor Total',
      width: '15%',
      sortable: true,
      body: (rowData: ABCItem) => (
        <span className="font-semibold">
          ${(rowData.totalMovementValue / 1000).toFixed(2)}K
        </span>
      ),
    },
    {
      field: 'percentageOfTotal',
      header: '% del Total',
      width: '12%',
      sortable: true,
      body: (rowData: ABCItem) => (
        <span>{(rowData.percentageOfTotal * 100).toFixed(1)}%</span>
      ),
    },
    {
      field: 'cumulativePercentage',
      header: '% Acumulado',
      width: '12%',
      sortable: true,
      body: (rowData: ABCItem) => (
        <span>{(rowData.cumulativePercentage * 100).toFixed(1)}%</span>
      ),
    },
    {
      field: 'classification',
      header: 'Clasificación',
      width: '15%',
      body: (rowData: ABCItem) => classificationBadge(rowData.classification),
    },
    {
      field: 'recommendations',
      header: 'Recomendaciones',
      width: '20%',
      body: recommendationTemplate,
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <Card className="text-center">
              <p className="text-gray-500 text-sm">Total Artículos</p>
              <p className="text-3xl font-bold text-blue-600">
                {summary.totalItems}
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="text-center">
              <p className="text-gray-500 text-sm">Clase A</p>
              <p className="text-3xl font-bold text-green-600">
                {summary.classA}
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="text-center">
              <p className="text-gray-500 text-sm">Clase B</p>
              <p className="text-3xl font-bold text-yellow-600">
                {summary.classB}
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="text-center">
              <p className="text-gray-500 text-sm">Clase C</p>
              <p className="text-3xl font-bold text-red-600">
                {summary.classC}
              </p>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Pareto Chart */}
      {chartData && (
        <Card title="Análisis de Pareto - Clasificación ABC" className="shadow-lg">
          <div style={{ height: '400px' }}>
            <Chart
              type="bar"
              data={chartData}
              options={chartOptions}
            />
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>
              <strong>Clase A:</strong> Los 20% de artículos que representan el 80% del valor total.
              Requieren control estricto y pronóstico de demanda.
            </p>
            <p>
              <strong>Clase B:</strong> Los artículos intermedios que representan el 15% del valor
              total. Control estándar.
            </p>
            <p>
              <strong>Clase C:</strong> Los artículos que representan solo el 5% del valor total.
              Control simplificado.
            </p>
          </div>
        </Card>
      )}

      {/* Data Table */}
      <Card title="Detalles del Análisis ABC" className="shadow-lg">
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
    </div>
  );
};

export default ABCAnalysis;
