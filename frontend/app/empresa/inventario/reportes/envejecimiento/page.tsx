"use client";

import { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Skeleton } from "primereact/skeleton";
import apiClient from "@/app/api/apiClient";

const AGE_COLORS: Record<string, string> = {
  "0–30 días": "#22C55E",
  "31–60 días": "#84CC16",
  "61–90 días": "#EAB308",
  "91–180 días": "#F97316",
  "181–365 días": "#EF4444",
  "Más de 1 año": "#7C3AED",
};

const ageSeverity = (bracket: string) => {
  if (bracket === "0–30 días") return "success";
  if (bracket === "31–60 días" || bracket === "61–90 días") return "warning";
  return "danger";
};

const AgingReportPage = () => {
  const toast = useRef<Toast>(null);
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [page, rows]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/inventory/reports/aging", {
        params: { page, limit: rows },
      });
      const res = response.data;
      setItems(res.data ?? []);
      setSummary(res.summary ?? []);
      setTotalRecords(res.meta?.total ?? 0);

      // Build chart
      if (res.summary?.length) {
        setChartData({
          labels: res.summary.map((s: any) => s.bracket),
          datasets: [
            {
              label: "Artículos",
              data: res.summary.map((s: any) => s.itemCount),
              backgroundColor: res.summary.map(
                (s: any) => AGE_COLORS[s.bracket] ?? "#94A3B8"
              ),
              borderRadius: 4,
            },
          ],
        });
      }
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el reporte de envejecimiento",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "#6B7280" },
        grid: { color: "#E5E7EB" },
      },
      x: {
        ticks: { color: "#6B7280" },
        grid: { color: "transparent" },
      },
    },
  };

  return (
    <>
      <Toast ref={toast} />

      {/* Summary cards */}
      <div className="grid mb-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="col-12 md:col-6 lg:col-4">
                <Skeleton height="80px" />
              </div>
            ))
          : summary.map((s, i) => (
              <div key={i} className="col-12 md:col-6 lg:col-4">
                <Card className="shadow-1 h-full">
                  <div className="flex align-items-center justify-content-between">
                    <div>
                      <p className="text-500 text-sm m-0">{s.bracket}</p>
                      <p
                        className="font-bold text-2xl m-0"
                        style={{ color: AGE_COLORS[s.bracket] ?? "#94A3B8" }}
                      >
                        {s.itemCount}
                      </p>
                      <p className="text-400 text-xs m-0">
                        Cant: {s.totalQuantity.toLocaleString()} · Valor: $
                        {Number(s.totalValue).toLocaleString("es-VE", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div
                      className="flex align-items-center justify-content-center border-round"
                      style={{
                        width: 48,
                        height: 48,
                        background: (AGE_COLORS[s.bracket] ?? "#94A3B8") + "20",
                      }}
                    >
                      <i
                        className="pi pi-clock"
                        style={{
                          fontSize: "1.4rem",
                          color: AGE_COLORS[s.bracket] ?? "#94A3B8",
                        }}
                      />
                    </div>
                  </div>
                </Card>
              </div>
            ))}
      </div>

      {/* Chart */}
      {chartData && (
        <Card title="Distribución por Antigüedad" className="mb-4">
          <div style={{ height: 260 }}>
            <Chart type="bar" data={chartData} options={chartOptions} />
          </div>
        </Card>
      )}

      {/* Detail table */}
      <Card title="Detalle de Artículos por Antigüedad">
        {loading && items.length === 0 ? (
          <Skeleton height="300px" />
        ) : (
          <DataTable
            value={items}
            loading={loading}
            paginator
            rows={rows}
            rowsPerPageOptions={[20, 50, 100]}
            totalRecords={totalRecords}
            lazy
            first={(page - 1) * rows}
            onPage={(e) => {
              setPage((e.page ?? 0) + 1);
              setRows(e.rows ?? 50);
            }}
            stripedRows
            size="small"
            scrollable
            emptyMessage={
              <div className="flex flex-column align-items-center py-5 text-500 gap-2">
                <i className="pi pi-inbox text-4xl" />
                <span className="text-lg">No hay datos disponibles</span>
              </div>
            }
          >
            <Column field="itemName" header="Artículo" sortable style={{ width: "22%" }} />
            <Column field="itemSKU" header="SKU" sortable style={{ width: "12%" }} />
            <Column field="warehouseName" header="Almacén" sortable style={{ width: "14%" }} />
            <Column
              field="quantity"
              header="Stock"
              sortable
              style={{ width: "8%" }}
              body={(row) => <span className="font-semibold">{row.quantity}</span>}
            />
            <Column
              field="value"
              header="Valor"
              sortable
              style={{ width: "12%" }}
              body={(row) =>
                row.value
                  ? `$${Number(row.value).toLocaleString("es-VE", { minimumFractionDigits: 2 })}`
                  : "—"
              }
            />
            <Column
              field="lastMovement"
              header="Último Mov."
              sortable
              style={{ width: "14%" }}
              body={(row) =>
                row.lastMovement
                  ? new Date(row.lastMovement).toLocaleDateString("es-VE")
                  : "Nunca"
              }
            />
            <Column
              field="daysOld"
              header="Días"
              sortable
              style={{ width: "8%" }}
              body={(row) => (
                <span
                  className="font-semibold"
                  style={{ color: AGE_COLORS[row.ageBracket] ?? "#6B7280" }}
                >
                  {row.daysOld}
                </span>
              )}
            />
            <Column
              field="ageBracket"
              header="Antigüedad"
              sortable
              style={{ width: "16%" }}
              body={(row) => (
                <Tag
                  value={row.ageBracket}
                  severity={ageSeverity(row.ageBracket)}
                />
              )}
            />
          </DataTable>
        )}
      </Card>
    </>
  );
};

export default AgingReportPage;
