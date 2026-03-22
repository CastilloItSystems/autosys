"use client";

import { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Skeleton } from "primereact/skeleton";
import { Dropdown } from "primereact/dropdown";
import { motion } from "framer-motion";
import apiClient from "@/app/api/apiClient";

const URGENCY_SEVERITY: Record<string, any> = {
  expired: "danger",
  critical: "danger",
  warning: "warning",
  info: "info",
};

const URGENCY_LABELS: Record<string, string> = {
  expired: "Vencido",
  critical: "Crítico (≤7d)",
  warning: "Advertencia (≤30d)",
  info: "Próximo",
};

const DAYS_OPTIONS = [
  { label: "Próximos 30 días", value: 30 },
  { label: "Próximos 60 días", value: 60 },
  { label: "Próximos 90 días", value: 90 },
  { label: "Próximos 180 días", value: 180 },
];

const BatchExpiryPage = () => {
  const toast = useRef<Toast>(null);
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const [daysAhead, setDaysAhead] = useState(90);

  useEffect(() => {
    loadData();
  }, [page, rows, daysAhead]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/inventory/reports/batch-expiry", {
        params: { page, limit: rows, daysAhead },
      });
      const res = response.data;
      setItems(res.data ?? []);
      setSummary(res.summary ?? null);
      setTotalRecords(res.meta?.total ?? 0);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el reporte de vencimientos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const summaryCards = summary
    ? [
        {
          label: "Vencidos",
          value: summary.expiredCount,
          icon: "pi pi-ban",
          iconColor: "#EF4444",
          bg: "#FEF2F2",
        },
        {
          label: "Críticos (≤7d)",
          value: summary.criticalCount,
          icon: "pi pi-exclamation-triangle",
          iconColor: "#EF4444",
          bg: "#FEF2F2",
        },
        {
          label: "Advertencia (≤30d)",
          value: summary.warningCount,
          icon: "pi pi-clock",
          iconColor: "#F97316",
          bg: "#FFF7ED",
        },
        {
          label: "Próximos",
          value: summary.infoCount,
          icon: "pi pi-calendar",
          iconColor: "#3B82F6",
          bg: "#EFF6FF",
        },
      ]
    : [];

  return (
    <>
      <Toast ref={toast} />

      {/* Controls */}
      <div className="flex align-items-center gap-3 mb-4">
        <label className="font-medium text-sm">Ver vencimientos en:</label>
        <Dropdown
          value={daysAhead}
          options={DAYS_OPTIONS}
          onChange={(e) => { setDaysAhead(e.value); setPage(1); }}
          style={{ width: 200 }}
        />
      </div>

      {/* Summary cards */}
      <div className="grid mb-4">
        {loading && !summary
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="col-12 md:col-6 lg:col-3">
                <Skeleton height="80px" />
              </div>
            ))
          : summaryCards.map((card, idx) => (
              <div key={idx} className="col-12 md:col-6 lg:col-3">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <Card className="shadow-1">
                    <div className="flex align-items-center gap-3">
                      <div
                        className="flex align-items-center justify-content-center border-round"
                        style={{ width: 48, height: 48, background: card.bg }}
                      >
                        <i
                          className={card.icon}
                          style={{ fontSize: "1.4rem", color: card.iconColor }}
                        />
                      </div>
                      <div>
                        <p className="text-500 text-sm m-0">{card.label}</p>
                        <p
                          className="font-bold text-2xl m-0"
                          style={{ color: card.iconColor }}
                        >
                          {card.value}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            ))}
      </div>

      {/* Table */}
      <Card title="Lotes por Vencer">
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
                <i className="pi pi-check-circle text-4xl text-green-400" />
                <span className="text-lg">Sin vencimientos en este período</span>
              </div>
            }
          >
            <Column field="itemName" header="Artículo" sortable style={{ width: "20%" }} />
            <Column field="itemSKU" header="SKU" sortable style={{ width: "11%" }} />
            <Column field="batchNumber" header="Lote" sortable style={{ width: "12%" }} />
            <Column
              field="currentQuantity"
              header="Stock Actual"
              sortable
              style={{ width: "10%" }}
              body={(row) => <span className="font-semibold">{row.currentQuantity}</span>}
            />
            <Column
              field="expiryDate"
              header="Fecha Venc."
              sortable
              style={{ width: "13%" }}
              body={(row) =>
                row.expiryDate
                  ? new Date(row.expiryDate).toLocaleDateString("es-VE")
                  : "—"
              }
            />
            <Column
              field="daysUntilExpiry"
              header="Días Rest."
              sortable
              style={{ width: "10%" }}
              body={(row) => {
                const days = row.daysUntilExpiry;
                const color =
                  days < 0 ? "#7C3AED" : days <= 7 ? "#EF4444" : days <= 30 ? "#F97316" : "#3B82F6";
                return (
                  <span className="font-bold" style={{ color }}>
                    {days < 0 ? `${Math.abs(days)}d venc.` : `${days}d`}
                  </span>
                );
              }}
            />
            <Column
              field="urgency"
              header="Urgencia"
              sortable
              style={{ width: "14%" }}
              body={(row) => (
                <Tag
                  value={URGENCY_LABELS[row.urgency] ?? row.urgency}
                  severity={URGENCY_SEVERITY[row.urgency] ?? "info"}
                />
              )}
            />
            <Column
              field="manufacturingDate"
              header="Fabricación"
              sortable
              style={{ width: "12%" }}
              body={(row) =>
                row.manufacturingDate
                  ? new Date(row.manufacturingDate).toLocaleDateString("es-VE")
                  : "—"
              }
            />
          </DataTable>
        )}
      </Card>
    </>
  );
};

export default BatchExpiryPage;
