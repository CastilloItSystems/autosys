"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { DataTable, DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { ProgressBar } from "primereact/progressbar";
import { motion } from "framer-motion";
import analyticsService, {
  TurnoverMetrics,
  TurnoverClassification,
} from "@/app/api/inventory/analyticsService";
import { LayoutContext } from "@/layout/context/layoutcontext";

const TurnoverAnalysis = () => {
  const toast = useRef<Toast>(null);
  const { layoutConfig } = useContext(LayoutContext);
  const isDark = layoutConfig.colorScheme === "dark";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary, isDark]);

  const loadTurnoverMetrics = async () => {
    setLoading(true);
    try {
      let response;
      if (selectedClassification) {
        response = await analyticsService.getTurnoverByClassification({
          classification: selectedClassification,
          page,
          limit: rows,
        });
      } else {
        response = await analyticsService.getAllTurnoverMetrics({
          page,
          limit: rows,
        });
      }

      setItems(response.data);
      setTotalRecords(response.pagination.total);
      setSummary(response.summary);
    } catch (error) {
      console.error("Error loading turnover metrics:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las métricas de rotación",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeChart = () => {
    const labels = ["Rápido", "Moderado", "Lento", "Estático"];
    const counts = [
      summary.fastMovingCount || 0,
      summary.moderateCount || 0,
      summary.slowMovingCount || 0,
      summary.staticCount || 0,
    ];
    const colors = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

    setChartData({
      labels,
      datasets: [
        {
          data: counts,
          backgroundColor: colors,
          borderColor: isDark ? "#1f2937" : "#fff",
          borderWidth: 2,
        },
      ],
    });
  };

  const classificationOptions = [
    { label: "Todas las clasificaciones", value: null },
    { label: "Rápido Movimiento", value: TurnoverClassification.FAST_MOVING },
    { label: "Moderado", value: TurnoverClassification.MODERATE },
    { label: "Lento Movimiento", value: TurnoverClassification.SLOW_MOVING },
    { label: "Estático", value: TurnoverClassification.STATIC },
  ];

  const getClassificationConfig = (classification: TurnoverClassification) => {
    switch (classification) {
      case TurnoverClassification.FAST_MOVING:
        return { label: "Rápido", color: "success" };
      case TurnoverClassification.MODERATE:
        return { label: "Moderado", color: "info" };
      case TurnoverClassification.SLOW_MOVING:
        return { label: "Lento", color: "warning" };
      case TurnoverClassification.STATIC:
        return { label: "Estático", color: "danger" };
      default:
        return { label: "Desconocido", color: "secondary" };
    }
  };

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: isDark ? "#cbd5e1" : "#475569",
          padding: 15,
        },
      },
    },
  };

  const healthScoreBody = (rowData: TurnoverMetrics) => (
    <div className="flex align-items-center gap-2">
      <ProgressBar
        value={rowData.healthScore}
        style={{ height: "24px", width: "100px" }}
        color={
          rowData.healthScore >= 70
            ? "#10B981"
            : rowData.healthScore >= 40
            ? "#F59E0B"
            : "#EF4444"
        }
      />
      <span className="text-sm font-medium">
        {rowData.healthScore.toFixed(0)}/100
      </span>
    </div>
  );

  const columns = [
    { field: "itemName", header: "Artículo", width: "18%", sortable: true },
    { field: "sku", header: "SKU", width: "12%", sortable: true },
    { field: "code", header: "Código", width: "12%", sortable: true },
    {
      field: "turnoverRatio",
      header: "Ratio de Rotación",
      width: "14%",
      sortable: true,
      body: (rowData: TurnoverMetrics) => (
        <span className="font-semibold">
          {rowData.turnoverRatio.toFixed(2)}x
        </span>
      ),
    },
    {
      field: "daysInventoryOutstanding",
      header: "DIO (Días)",
      width: "12%",
      sortable: true,
      body: (rowData: TurnoverMetrics) => (
        <span>{rowData.daysInventoryOutstanding.toFixed(0)} días</span>
      ),
    },
    {
      field: "healthScore",
      header: "Salud",
      width: "16%",
      sortable: true,
      body: healthScoreBody,
    },
    {
      field: "classification",
      header: "Clasificación",
      width: "14%",
      body: (rowData: TurnoverMetrics) => {
        const cfg = getClassificationConfig(rowData.classification);
        return <Tag value={cfg.label} severity={cfg.color as any} />;
      },
    },
    {
      field: "trend",
      header: "Tendencia",
      width: "10%",
      body: (rowData: TurnoverMetrics) => {
        const icons: { [key: string]: string } = {
          improving: "pi pi-arrow-up text-green-500",
          declining: "pi pi-arrow-down text-red-500",
          stable: "pi pi-minus text-yellow-500",
        };
        return (
          <i className={icons[rowData.trend] ?? "pi pi-minus text-500"}></i>
        );
      },
    },
  ];

  if (loading && !chartData) {
    return (
      <div className="flex flex-column gap-3">
        <Card>
          <Skeleton height="300px" />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-column gap-4">
      <Toast ref={toast} />

      {/* Summary Cards */}
      {summary && (
        <div className="grid">
          {[
            {
              label: "Rotación Promedio",
              value: `${summary.averageTurnover?.toFixed(1) || 0}x`,
              sub: "Ratio promedio",
              color: "var(--text-color)",
            },
            {
              label: "Rápido Movimiento",
              value: summary.fastMovingCount,
              color: "var(--green-500)",
            },
            {
              label: "Moderado",
              value: summary.moderateCount,
              color: "var(--blue-500)",
            },
            {
              label: "Lento Movimiento",
              value: summary.slowMovingCount,
              color: "var(--yellow-500)",
            },
            {
              label: "Estático",
              value: summary.staticCount,
              color: "var(--red-500)",
            },
          ].map((item, index) => (
            <div key={item.label} className="col-12 md:col-6 lg:col">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <div className="text-center">
                    <p className="text-500 text-sm m-0 mb-2">{item.label}</p>
                    <p
                      className="text-4xl font-bold m-0"
                      style={{ color: item.color }}
                    >
                      {item.value}
                    </p>
                  </div>
                </Card>
              </motion.div>
            </div>
          ))}
        </div>
      )}

      {/* Distribution Chart */}
      {chartData && (
        <Card title="Distribución por Clasificación">
          <div style={{ height: "300px" }}>
            <Chart type="doughnut" data={chartData} options={chartOptions} />
          </div>
        </Card>
      )}

      {/* Filter and Data Table */}
      <Card title="Análisis Detallado de Rotación">
        <div className="mb-3 flex align-items-end gap-3">
          <div className="flex flex-column gap-1" style={{ width: "14rem" }}>
            <label className="text-sm font-medium">
              Filtrar por clasificación
            </label>
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
          rowsPerPageOptions={[10, 20, 50]}
          first={(page - 1) * rows}
          totalRecords={totalRecords}
          onPage={(e: DataTablePageEvent) => {
            setPage((e.page ?? 0) + 1);
            setRows(e.rows ?? 20);
          }}
          dataKey="itemId"
          stripedRows
          scrollable
          size="small"
          emptyMessage={
            <div className="flex flex-column align-items-center py-5 text-500 gap-2">
              <i className="pi pi-sync text-4xl text-300" />
              <span>Sin artículos en esta clasificación</span>
            </div>
          }
          className="w-full"
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
      <Card title="Definiciones">
        <div className="flex flex-column gap-2">
          <p className="text-sm text-500 m-0">
            <strong>Ratio de Rotación:</strong> Número de veces que el
            inventario se vende y se reemplaza durante el período.
          </p>
          <p className="text-sm text-500 m-0">
            <strong>DIO (Days Inventory Outstanding):</strong> Número de días
            promedio que un artículo permanece en inventario.
          </p>
          <p className="text-sm text-500 m-0">
            <strong>Salud:</strong> Puntuación 0-100 basada en rotación,
            tendencia y consistencia.
          </p>
          <p className="text-sm text-500 m-0">
            <strong>Clasificación:</strong> Rápido (rotación alta), Moderado
            (rotación media), Lento (rotación baja), Estático (sin movimiento
            reciente).
          </p>
        </div>
      </Card>
    </div>
  );
};

export default TurnoverAnalysis;
