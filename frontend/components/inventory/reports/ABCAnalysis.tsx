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
  ABCItem,
  ABCClassification,
} from "@/app/api/inventory/analyticsService";
import { LayoutContext } from "@/layout/context/layoutcontext";

const fmt = (n: number) =>
  n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtCompact = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${fmt(n)}`;
};

const CLASS_COLORS: Record<ABCClassification, string> = {
  [ABCClassification.A]: "#22C55E",
  [ABCClassification.B]: "#F59E0B",
  [ABCClassification.C]: "#EF4444",
};

const CLASS_SEVERITY: Record<ABCClassification, any> = {
  [ABCClassification.A]: "success",
  [ABCClassification.B]: "warning",
  [ABCClassification.C]: "danger",
};

const CLASS_LABELS: Record<ABCClassification, string> = {
  [ABCClassification.A]: "Clase A",
  [ABCClassification.B]: "Clase B",
  [ABCClassification.C]: "Clase C",
};

const FILTER_OPTIONS = [
  { label: "Todas las clases", value: "" },
  { label: "Clase A (80%)", value: "A" },
  { label: "Clase B (95%)", value: "B" },
  { label: "Clase C (resto)", value: "C" },
];

const ABCAnalysis = () => {
  const toast = useRef<Toast>(null);
  const { layoutConfig } = useContext(LayoutContext);
  const isDark = layoutConfig.colorScheme === "dark";

  const [allItems, setAllItems] = useState<ABCItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(20);
  const [chartData, setChartData] = useState<any>(null);
  const [chartOptions, setChartOptions] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [filterClass, setFilterClass] = useState<string>("");

  useEffect(() => {
    loadABCAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rows]);

  useEffect(() => {
    if (summary?.paretoData?.length > 0) {
      buildParetoChart(summary.paretoData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary, isDark]);

  const loadABCAnalysis = async () => {
    setLoading(true);
    try {
      const response = await analyticsService.getABCAnalysis({ page, limit: rows });
      setAllItems(response.data);
      setTotalRecords(response.pagination.total);
      setSummary(response.summary);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los datos del análisis ABC",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const buildParetoChart = (paretoData: any[]) => {
    const textColor = isDark ? "#cbd5e1" : "#475569";
    const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

    setChartData({
      labels: paretoData.map((i: any) =>
        i.itemName.length > 16 ? i.itemName.substring(0, 16) + "…" : i.itemName
      ),
      datasets: [
        {
          type: "bar" as const,
          label: "Valor ($)",
          data: paretoData.map((i: any) => i.totalMovementValue),
          backgroundColor: paretoData.map((i: any) => CLASS_COLORS[i.classification as ABCClassification] + "cc"),
          borderColor: paretoData.map((i: any) => CLASS_COLORS[i.classification as ABCClassification]),
          borderWidth: 1,
          yAxisID: "y",
          order: 2,
        },
        {
          type: "line" as const,
          label: "% Acumulado",
          data: paretoData.map((i: any) => i.cumulativePercentage * 100),
          borderColor: "#3B82F6",
          backgroundColor: "transparent",
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: "#3B82F6",
          yAxisID: "y1",
          order: 1,
        },
      ],
    });

    setChartOptions({
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          position: "top" as const,
          labels: { color: textColor, padding: 14, font: { size: 12 } },
        },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              if (ctx.datasetIndex === 0) return ` Valor: ${fmtCompact(ctx.raw)}`;
              return ` Acumulado: ${Number(ctx.raw).toFixed(1)}%`;
            },
          },
        },
      },
      scales: {
        x: { ticks: { color: textColor, maxRotation: 45 }, grid: { color: gridColor } },
        y: {
          type: "linear" as const,
          position: "left" as const,
          ticks: {
            color: textColor,
            callback: (v: any) => fmtCompact(v),
          },
          grid: { color: gridColor },
        },
        y1: {
          type: "linear" as const,
          position: "right" as const,
          min: 0,
          max: 100,
          ticks: {
            color: textColor,
            callback: (v: any) => v + "%",
          },
          grid: { drawOnChartArea: false },
        },
      },
    });
  };

  // Client-side filter by class
  const filteredItems = filterClass
    ? allItems.filter((i) => i.classification === filterClass)
    : allItems;

  const summaryCards = summary
    ? [
        {
          label: "Total Artículos",
          value: summary.totalItems,
          sub: `Valor: ${fmtCompact(summary.totalMovementValue ?? 0)}`,
          icon: "pi pi-box",
          iconColor: "#3B82F6",
          bg: "#EFF6FF",
        },
        {
          label: "Clase A",
          value: summary.classA,
          sub: `${summary.totalItems > 0 ? ((summary.classA / summary.totalItems) * 100).toFixed(0) : 0}% de artículos · 80% del valor`,
          icon: "pi pi-star-fill",
          iconColor: "#22C55E",
          bg: "#F0FDF4",
        },
        {
          label: "Clase B",
          value: summary.classB,
          sub: `${summary.totalItems > 0 ? ((summary.classB / summary.totalItems) * 100).toFixed(0) : 0}% de artículos · 15% del valor`,
          icon: "pi pi-star",
          iconColor: "#F59E0B",
          bg: "#FFFBEB",
        },
        {
          label: "Clase C",
          value: summary.classC,
          sub: `${summary.totalItems > 0 ? ((summary.classC / summary.totalItems) * 100).toFixed(0) : 0}% de artículos · 5% del valor`,
          icon: "pi pi-circle",
          iconColor: "#EF4444",
          bg: "#FEF2F2",
        },
      ]
    : [];

  if (loading && !summary) {
    return (
      <div className="flex flex-column gap-3">
        <div className="grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="col-12 md:col-6 lg:col-3">
              <Skeleton height="80px" />
            </div>
          ))}
        </div>
        <Skeleton height="400px" />
      </div>
    );
  }

  return (
    <div className="flex flex-column gap-4">
      <Toast ref={toast} />

      {/* Summary Cards */}
      {summary && (
        <div className="grid">
          {summaryCards.map((card, idx) => (
            <div key={idx} className="col-12 md:col-6 lg:col-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
              >
                <Card className="shadow-1 h-full">
                  <div className="flex align-items-center gap-3">
                    <div
                      className="flex align-items-center justify-content-center border-round flex-shrink-0"
                      style={{ width: 48, height: 48, background: card.bg }}
                    >
                      <i className={card.icon} style={{ fontSize: "1.4rem", color: card.iconColor }} />
                    </div>
                    <div>
                      <p className="text-500 text-sm m-0">{card.label}</p>
                      <p className="font-bold text-2xl m-0" style={{ color: card.iconColor }}>
                        {card.value}
                      </p>
                      <p className="text-400 text-xs m-0 mt-1">{card.sub}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          ))}
        </div>
      )}

      {/* Pareto Chart */}
      {chartData && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
          <Card title="Curva de Pareto — Clasificación ABC" className="shadow-1">
            <div style={{ height: 380 }}>
              <Chart type="bar" data={chartData} options={chartOptions} />
            </div>
            <div className="flex gap-4 mt-3 pt-3 border-top-1 surface-border">
              {[
                { cls: "A", color: "#22C55E", desc: "~20% de artículos · 80% del valor · Control estricto" },
                { cls: "B", color: "#F59E0B", desc: "~30% de artículos · 15% del valor · Control estándar" },
                { cls: "C", color: "#EF4444", desc: "~50% de artículos · 5% del valor · Control simplificado" },
              ].map((s) => (
                <div key={s.cls} className="flex align-items-center gap-2">
                  <div className="border-round" style={{ width: 12, height: 12, background: s.color, flexShrink: 0 }} />
                  <span className="text-xs text-500">{s.desc}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Table with filter */}
      <Card title="Detalle por Artículo" className="shadow-1">
        <div className="flex align-items-center gap-3 mb-3">
          <label className="text-sm font-medium">Filtrar por clase:</label>
          <Dropdown
            options={FILTER_OPTIONS}
            value={filterClass}
            onChange={(e) => setFilterClass(e.value)}
            style={{ width: "12rem" }}
          />
          {filterClass && (
            <span className="text-sm text-500">
              {filteredItems.length} artículos
            </span>
          )}
        </div>

        <DataTable
          value={filteredItems}
          loading={loading}
          paginator
          rows={rows}
          rowsPerPageOptions={[10, 20, 50]}
          first={(page - 1) * rows}
          totalRecords={filterClass ? filteredItems.length : totalRecords}
          onPage={(e: DataTablePageEvent) => {
            if (!filterClass) {
              setPage((e.page ?? 0) + 1);
              setRows(e.rows ?? 20);
            } else {
              setRows(e.rows ?? 20);
            }
          }}
          dataKey="itemId"
          stripedRows
          scrollable
          size="small"
          emptyMessage={
            <div className="flex flex-column align-items-center py-5 text-500 gap-2">
              <i className="pi pi-chart-bar text-4xl text-300" />
              <span>Sin artículos en esta clasificación</span>
            </div>
          }
        >
          <Column field="itemName" header="Artículo" sortable style={{ width: "18%" }} />
          <Column field="sku" header="SKU" sortable style={{ width: "11%" }} />
          <Column field="code" header="Código" sortable style={{ width: "10%" }} />
          <Column
            field="totalMovementValue"
            header="Valor Inventario"
            sortable
            style={{ width: "14%" }}
            body={(row: ABCItem) => (
              <span className="font-semibold">{fmtCompact(row.totalMovementValue)}</span>
            )}
          />
          <Column
            field="percentageOfTotal"
            header="% del Total"
            sortable
            style={{ width: "12%" }}
            body={(row: ABCItem) => {
              const pct = row.percentageOfTotal * 100;
              return (
                <div className="flex align-items-center gap-2">
                  <ProgressBar
                    value={Math.min(pct, 100)}
                    showValue={false}
                    style={{ height: 6, width: 50 }}
                    color={CLASS_COLORS[row.classification]}
                  />
                  <span className="text-sm">{pct.toFixed(1)}%</span>
                </div>
              );
            }}
          />
          <Column
            field="cumulativePercentage"
            header="% Acumulado"
            sortable
            style={{ width: "12%" }}
            body={(row: ABCItem) => `${(row.cumulativePercentage * 100).toFixed(1)}%`}
          />
          <Column
            field="classification"
            header="Clase"
            style={{ width: "9%" }}
            body={(row: ABCItem) => (
              <Tag
                value={CLASS_LABELS[row.classification]}
                severity={CLASS_SEVERITY[row.classification]}
              />
            )}
          />
          <Column
            field="recommendations"
            header="Recomendaciones"
            style={{ width: "22%" }}
            body={(row: ABCItem) => (
              <div className="flex flex-column gap-1">
                {(row.recommendations ?? []).slice(0, 2).map((rec, idx) => (
                  <p key={idx} className="text-xs text-500 m-0">• {rec}</p>
                ))}
              </div>
            )}
          />
        </DataTable>
      </Card>
    </div>
  );
};

export default ABCAnalysis;
