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
import itemService, { Item } from "@/app/api/inventory/itemService";
import { LayoutContext } from "@/layout/context/layoutcontext";

const ForecastingView = () => {
  const toast = useRef<Toast>(null);
  const { layoutConfig } = useContext(LayoutContext);
  const isDark = layoutConfig.colorScheme === "dark";

  const [items, setItems] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
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
      loadDetailedForecast(selectedItem.id);
    }
  }, [selectedItem]);

  useEffect(() => {
    if (selectedItem) {
      initializeDetailChart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem, detailedMetrics, isDark]);

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
      const response = await analyticsService.getForecastByItem(itemId);
      // Unwrap { data: ForecastData } or plain ForecastData
      setDetailedMetrics((response as any).data ?? response);
    } catch (error) {
      console.error("Error loading detailed forecast:", error);
    }
  };

  const searchItems = async (event: AutoCompleteCompleteEvent) => {
    const query = event.query.trim();
    if (!query) {
      setItemSuggestions([]);
      return;
    }
    try {
      const response = await itemService.search(query);
      setItemSuggestions(response.data ?? []);
    } catch {
      setItemSuggestions([]);
    }
  };

  const initializeDetailChart = () => {
    if (!selectedItem || !detailedMetrics) return;

    const daysForecast = detailedMetrics?.forecast?.daysForecast;
    if (!daysForecast || daysForecast.length === 0) return;

    // Sample up to 10 evenly-spaced points
    const step = Math.max(1, Math.floor(daysForecast.length / 10));
    const sampled = daysForecast.filter((_: any, i: number) => i % step === 0).slice(0, 10);

    const labels = sampled.map((d: any) =>
      new Date(d.date).toLocaleDateString("es-MX", { month: "short", day: "numeric" })
    );
    const forecastValues = sampled.map((d: any) => d.forecastedDemand);
    const upperBound = sampled.map((d: any) =>
      Math.round(d.forecastedDemand * (1 + (1 - (d.confidence ?? 0.8))))
    );
    const lowerBound = sampled.map((d: any) =>
      Math.max(0, Math.round(d.forecastedDemand * (d.confidence ?? 0.8)))
    );

    const textColor = isDark ? "#cbd5e1" : "#475569";
    const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

    setChartData({
      labels,
      datasets: [
        {
          label: "Pronóstico",
          data: forecastValues,
          borderColor: "#10B981",
          borderDash: [5, 5],
          backgroundColor: "rgba(16, 185, 129, 0.08)",
          tension: 0.4,
          fill: false,
          pointRadius: 4,
          pointBackgroundColor: "#10B981",
        },
        {
          label: "Límite superior",
          data: upperBound,
          borderColor: "rgba(16,185,129,0.3)",
          backgroundColor: "rgba(16, 185, 129, 0.12)",
          fill: "+1",
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 1,
        },
        {
          label: "Límite inferior",
          data: lowerBound,
          borderColor: "rgba(16,185,129,0.3)",
          backgroundColor: "transparent",
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 1,
        },
      ],
      _opts: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: {
            position: "bottom" as const,
            labels: { color: textColor, padding: 14 },
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.raw} unid.`,
            },
          },
          filler: { propagate: true },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: textColor },
            grid: { color: gridColor },
            title: { display: true, text: "Unidades", color: textColor },
          },
          x: {
            ticks: { color: textColor },
            grid: { color: gridColor },
          },
        },
      },
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


  const itemTemplate = (option: Item) => (
    <div className="flex align-items-center p-2 gap-3">
      <div>
        <p className="font-medium m-0">{option.name}</p>
        <p className="text-sm text-500 m-0">
          {option.sku || "-"} {option.code ? ` / ${option.code}` : ""}
        </p>
      </div>
    </div>
  );

  const columns = [
    { field: "itemName", header: "Artículo", width: "18%" },
    { field: "sku", header: "SKU", width: "12%" },
    { field: "code", header: "Código", width: "12%" },
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
          value={searchQuery}
          suggestions={itemSuggestions}
          completeMethod={searchItems}
          field="name"
          placeholder="Buscar artículo por nombre, SKU o código..."
          itemTemplate={itemTemplate}
          onSelect={(e: any) => {
            setSelectedItem(e.value as Item);
            setSearchQuery(e.value.name);
          }}
          onChange={(e) => setSearchQuery(e.value)}
          delay={300}
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
                value: (detailedMetrics?.currentStock ?? 0).toFixed(0),
                sub: "unidades",
                color: "var(--blue-500)",
              },
              {
                label: "Demanda Estimada 30d",
                value: (detailedMetrics?.estimatedDemand?.demand30Days ?? 0).toFixed(0),
                sub: "unidades",
                color: "var(--purple-500)",
              },
              {
                label: "Demanda Estimada 60d",
                value: (detailedMetrics?.estimatedDemand?.demand60Days ?? 0).toFixed(0),
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
                        value={getRiskLabel(detailedMetrics?.stockoutRisk ?? "low")}
                        severity={
                          getRiskBadgeSeverity(detailedMetrics?.stockoutRisk ?? "low") as any
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
            <Card title={`Pronóstico de Demanda — ${selectedItem.name}`}>
              <div style={{ height: "400px" }}>
                <Chart type="line" data={chartData} options={chartData._opts ?? {}} />
              </div>
              <Divider />
              <div className="flex gap-4 flex-wrap">
                <div className="flex align-items-center gap-2">
                  <div style={{ width: 16, height: 3, background: "#10B981", borderTop: "2px dashed #10B981" }} />
                  <span className="text-xs text-500">Pronóstico (suavizado exponencial)</span>
                </div>
                <div className="flex align-items-center gap-2">
                  <div style={{ width: 16, height: 12, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)" }} />
                  <span className="text-xs text-500">Banda de confianza</span>
                </div>
              </div>
            </Card>
          )}

          {/* Recommendations */}
          {detailedMetrics?.recommendations &&
            detailedMetrics.recommendations.length > 0 && (
              <Card title="Recomendaciones del Sistema">
                <ul className="list-none p-0 m-0 flex flex-column gap-2">
                  {detailedMetrics.recommendations.map((rec, idx) => (
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
          emptyMessage={
            <div className="flex flex-column align-items-center py-5 text-500 gap-2">
              <i className="pi pi-chart-line text-4xl text-300" />
              <span>No hay pronósticos disponibles</span>
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
