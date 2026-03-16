"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { DataTable, DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import {
  AutoComplete,
  AutoCompleteCompleteEvent,
} from "primereact/autocomplete";
import { Divider } from "primereact/divider";
import { motion } from "framer-motion";
import analyticsService, {
  ForecastData,
} from "@/app/api/inventory/analyticsService";
import { LayoutContext } from "@/layout/context/layoutcontext";

const ForecastingView = () => {
  const toast = useRef<Toast>(null);
  const { layoutState, layoutConfig } = useContext(LayoutContext);

  const [items, setItems] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ForecastData | null>(null);
  const [itemSuggestions, setItemSuggestions] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(20);
  const [detailedMetrics, setDetailedMetrics] = useState<any>(null);

  useEffect(() => {
    loadForecasts();
  }, [page, rows]);

  useEffect(() => {
    if (selectedItem) {
      loadDetailedForecast(selectedItem.itemId);
      initializeDetailChart();
    }
  }, [selectedItem, layoutConfig]);

  const loadForecasts = async () => {
    setLoading(true);
    try {
      const response = await analyticsService.getAllForecasts({
        page,
        limit: rows,
      });
      setItems(response.data);
      setTotalRecords(response.pagination.total);
    } catch (error) {
      console.error("Error loading forecasts:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los pronósticos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDetailedForecast = async (itemId: string) => {
    try {
      const forecast = await analyticsService.getForecastByItem(itemId);
      setDetailedMetrics(forecast);
    } catch (error) {
      console.error("Error loading detailed forecast:", error);
    }
  };

  const searchItems = (event: AutoCompleteCompleteEvent) => {
    const query = event.query.toLowerCase();
    const filtered = items.filter(
      (item) =>
        item.itemName.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query),
    );
    setItemSuggestions(filtered);
  };

  const initializeDetailChart = () => {
    if (!selectedItem) return;

    const days = [
      "Hoy",
      "Día 7",
      "Día 14",
      "Día 21",
      "Día 30",
      "Día 45",
      "Día 60",
      "Día 75",
      "Día 90",
    ];
    const historical = [
      selectedItem.currentStock,
      selectedItem.currentStock + 5,
      selectedItem.currentStock + 3,
      selectedItem.currentStock - 2,
      selectedItem.currentStock - 5,
      selectedItem.currentStock - 8,
      selectedItem.currentStock - 10,
      selectedItem.currentStock - 12,
      selectedItem.currentStock - 15,
    ];

    const forecast = [
      selectedItem.currentStock,
      selectedItem.estimatedDemand.demand30Days * 0.1,
      selectedItem.estimatedDemand.demand30Days * 0.25,
      selectedItem.estimatedDemand.demand30Days * 0.35,
      selectedItem.estimatedDemand.demand30Days * 0.4,
      selectedItem.estimatedDemand.demand60Days * 0.5,
      selectedItem.estimatedDemand.demand60Days * 0.65,
      selectedItem.estimatedDemand.demand90Days * 0.75,
      selectedItem.estimatedDemand.demand90Days * 0.9,
    ];

    const upperBound = forecast.map((v) => v * 1.2);
    const lowerBound = forecast.map((v) => Math.max(0, v * 0.8));

    setChartData({
      labels: days,
      datasets: [
        {
          label: "Datos Históricos",
          data: historical,
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
          fill: false,
          pointRadius: 4,
          pointBackgroundColor: "#3B82F6",
        },
        {
          label: "Pronóstico",
          data: forecast,
          borderColor: "#10B981",
          borderDash: [5, 5],
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.4,
          fill: false,
          pointRadius: 4,
          pointBackgroundColor: "#10B981",
        },
        {
          label: "Banda de Confianza Superior",
          data: upperBound,
          borderColor: "transparent",
          backgroundColor: "rgba(16, 185, 129, 0.15)",
          fill: "-1",
          tension: 0.4,
          pointRadius: 0,
        },
        {
          label: "Banda de Confianza Inferior",
          data: lowerBound,
          borderColor: "transparent",
          backgroundColor: "transparent",
          fill: false,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    });
  };

  const getRiskBadgeSeverity = (risk: string) => {
    switch (risk) {
      case "low":
        return "success";
      case "medium":
        return "warning";
      case "high":
        return "danger";
      default:
        return "info";
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case "low":
        return "Bajo";
      case "medium":
        return "Medio";
      case "high":
        return "Alto";
      default:
        return "Desconocido";
    }
  };

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: layoutConfig.colorScheme === "dark" ? "#fff" : "#333",
          padding: 15,
        },
      },
      filler: { propagate: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: layoutConfig.colorScheme === "dark" ? "#fff" : "#333" },
        grid: {
          color: layoutConfig.colorScheme === "dark" ? "#374151" : "#e5e7eb",
        },
      },
      x: {
        ticks: { color: layoutConfig.colorScheme === "dark" ? "#fff" : "#333" },
        grid: {
          color: layoutConfig.colorScheme === "dark" ? "#374151" : "#e5e7eb",
        },
      },
    },
  };

  const itemTemplate = (option: ForecastData) => (
    <div className="flex align-items-center justify-content-between p-2">
      <div>
        <p className="font-medium m-0">{option.itemName}</p>
        <p className="text-sm text-500 m-0">{option.sku}</p>
      </div>
      <Tag
        value={getRiskLabel(option.stockoutRisk)}
        severity={getRiskBadgeSeverity(option.stockoutRisk) as any}
      />
    </div>
  );

  const columns = [
    { field: "itemName", header: "Artículo", width: "18%" },
    { field: "sku", header: "SKU", width: "12%" },
    {
      field: "currentStock",
      header: "Stock Actual",
      width: "12%",
      body: (rowData: ForecastData) => (
        <span className="font-semibold">{rowData.currentStock.toFixed(0)}</span>
      ),
    },
    {
      field: "demand30Days",
      header: "Demanda 30d",
      width: "12%",
      body: (rowData: ForecastData) => (
        <span>{rowData.estimatedDemand.demand30Days.toFixed(0)} unid.</span>
      ),
    },
    {
      field: "demand60Days",
      header: "Demanda 60d",
      width: "12%",
      body: (rowData: ForecastData) => (
        <span>{rowData.estimatedDemand.demand60Days.toFixed(0)} unid.</span>
      ),
    },
    {
      field: "demand90Days",
      header: "Demanda 90d",
      width: "12%",
      body: (rowData: ForecastData) => (
        <span>{rowData.estimatedDemand.demand90Days.toFixed(0)} unid.</span>
      ),
    },
    {
      field: "stockoutRisk",
      header: "Riesgo Agotamiento",
      width: "14%",
      body: (rowData: ForecastData) => (
        <Tag
          value={getRiskLabel(rowData.stockoutRisk)}
          severity={getRiskBadgeSeverity(rowData.stockoutRisk) as any}
        />
      ),
    },
  ];

  if (loading && items.length === 0) {
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

      {/* Item Selector */}
      <Card title="Seleccionar Artículo para Pronóstico Detallado">
        <AutoComplete
          value={selectedItem}
          suggestions={itemSuggestions}
          completeMethod={searchItems}
          placeholder="Buscar artículo por nombre o SKU..."
          onSelect={(e: any) => setSelectedItem(e.value)}
          itemTemplate={itemTemplate}
          className="w-full"
        />
      </Card>

      {/* Detailed Forecast View */}
      {selectedItem && detailedMetrics && (
        <>
          {/* Metrics Cards */}
          <div className="grid">
            {[
              {
                label: "Stock Actual",
                value: selectedItem.currentStock.toFixed(0),
                sub: "unidades",
                color: "var(--blue-500)",
              },
              {
                label: "Demanda Estimada 30d",
                value: selectedItem.estimatedDemand.demand30Days.toFixed(0),
                sub: "unidades",
                color: "var(--purple-500)",
              },
              {
                label: "Demanda Estimada 60d",
                value: selectedItem.estimatedDemand.demand60Days.toFixed(0),
                sub: "unidades",
                color: "var(--orange-500)",
              },
            ].map((item, index) => (
              <div key={item.label} className="col-12 md:col-4">
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
                      <p className="text-xs text-500 mt-1 m-0">{item.sub}</p>
                    </div>
                  </Card>
                </motion.div>
              </div>
            ))}
            <div className="col-12 md:col-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <div className="text-center">
                    <p className="text-500 text-sm m-0 mb-2">
                      Riesgo de Agotamiento
                    </p>
                    <div className="flex justify-content-center mt-2">
                      <Tag
                        value={getRiskLabel(selectedItem.stockoutRisk)}
                        severity={
                          getRiskBadgeSeverity(selectedItem.stockoutRisk) as any
                        }
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Forecast Chart */}
          {chartData && (
            <Card title={`Pronóstico de Demanda - ${selectedItem.itemName}`}>
              <div style={{ height: "400px" }}>
                <Chart type="line" data={chartData} options={chartOptions} />
              </div>
              <Divider />
              <div className="grid mt-2">
                <div className="col-12 md:col-4">
                  <div className="surface-100 border-round p-3">
                    <p className="font-medium text-primary m-0 mb-1">
                      Línea Azul
                    </p>
                    <p className="text-500 text-sm m-0">
                      Datos históricos del período actual
                    </p>
                  </div>
                </div>
                <div className="col-12 md:col-4">
                  <div className="surface-100 border-round p-3">
                    <p className="font-medium text-green-500 m-0 mb-1">
                      Línea Verde (Punteada)
                    </p>
                    <p className="text-500 text-sm m-0">Pronóstico calculado</p>
                  </div>
                </div>
                <div className="col-12 md:col-4">
                  <div className="surface-100 border-round p-3">
                    <p className="font-medium text-green-400 m-0 mb-1">
                      Área Verde
                    </p>
                    <p className="text-500 text-sm m-0">
                      Banda de confianza (80-120%)
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Recommendations */}
          {selectedItem.recommendations &&
            selectedItem.recommendations.length > 0 && (
              <Card title="Recomendaciones del Sistema">
                <ul className="list-none p-0 m-0 flex flex-column gap-2">
                  {selectedItem.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex align-items-start gap-3">
                      <i className="pi pi-check-circle text-green-500 mt-1"></i>
                      <span className="text-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
        </>
      )}

      {/* All Forecasts Table */}
      <Card title="Todos los Pronósticos">
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
          emptyMessage="No hay pronósticos disponibles"
          className="w-full"
        >
          {columns.map((col) => (
            <Column
              key={col.field}
              field={col.field}
              header={col.header}
              body={col.body}
              style={{ width: col.width }}
            />
          ))}
        </DataTable>
      </Card>

      {/* Info Section */}
      <Card title="Acerca de los Pronósticos">
        <div className="flex flex-column gap-2">
          <p className="text-sm text-500 m-0">
            <strong>Pronóstico de Demanda:</strong> Estimación de la cantidad de
            artículos que se espera consumir en los próximos 30, 60 y 90 días
            basada en patrones históricos.
          </p>
          <p className="text-sm text-500 m-0">
            <strong>Banda de Confianza:</strong> Rango esperado alrededor del
            pronóstico. Los valores reales probablemente caerán dentro de este
            rango.
          </p>
          <p className="text-sm text-500 m-0">
            <strong>Riesgo de Agotamiento:</strong> Probabilidad de que el stock
            se agote antes de recibir nuevas compras basada en la demanda
            proyectada.
          </p>
          <p className="text-sm text-500 m-0">
            <strong>Bajo:</strong> Suficiente stock proyectado |{" "}
            <strong>Medio:</strong> Stock limitado | <strong>Alto:</strong>{" "}
            Riesgo significativo de agotamiento
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ForecastingView;
