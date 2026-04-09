"use client";

import { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import apiClient from "@/app/api/apiClient";

interface SupplierRow {
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  contactName: string | null;
  email: string | null;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalAmount: number;
  avgOrderAmount: number;
  itemCount: number;
  lastOrderDate: string | null;
  avgDeliveryDays: number | null;
  onTimeRate: number | null;
}

interface Summary {
  totalSuppliers: number;
  activeSuppliers: number;
  totalOrdersAllTime: number;
  totalAmountAllTime: number;
  avgOnTimeRate: number | null;
}

const fmtCurrency = (n: number) =>
  n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const onTimeColor = (rate: number | null) => {
  if (rate === null) return "#94A3B8";
  if (rate >= 80) return "#22C55E";
  if (rate >= 50) return "#F97316";
  return "#EF4444";
};

const onTimeSeverity = (rate: number | null): any => {
  if (rate === null) return "secondary";
  if (rate >= 80) return "success";
  if (rate >= 50) return "warning";
  return "danger";
};

const SupplierPerformanceReport = () => {
  const toast = useRef<Toast>(null);
  const [items, setItems] = useState<SupplierRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    loadData();
  }, [page, rows]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/inventory/reports/supplier-performance", {
        params: { page, limit: rows },
      });
      const res = response.data;
      setItems(res.data ?? []);
      setSummary(res.summary ?? null);
      setTotalRecords(res.meta?.total ?? 0);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el reporte de rendimiento de proveedores",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const summaryCards = summary
    ? [
        {
          label: "Proveedores Activos",
          value: summary.activeSuppliers,
          icon: "pi pi-users",
          iconColor: "#3B82F6",
          bg: "#EFF6FF",
        },
        {
          label: "Total Órdenes",
          value: summary.totalOrdersAllTime,
          icon: "pi pi-shopping-cart",
          iconColor: "#8B5CF6",
          bg: "#F5F3FF",
        },
        {
          label: "Monto Total Compras",
          value: `$${fmtCurrency(summary.totalAmountAllTime)}`,
          icon: "pi pi-dollar",
          iconColor: "#22C55E",
          bg: "#F0FDF4",
        },
        {
          label: "Tasa Puntualidad Prom.",
          value: summary.avgOnTimeRate !== null ? `${summary.avgOnTimeRate}%` : "N/A",
          icon: "pi pi-clock",
          iconColor:
            summary.avgOnTimeRate !== null ? onTimeColor(summary.avgOnTimeRate) : "#94A3B8",
          bg: "#FFFBEB",
        },
      ]
    : [];

  return (
    <>
      <Toast ref={toast} />

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
      <Card title="Rendimiento por Proveedor">
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
                <i className="pi pi-users text-4xl text-blue-300" />
                <span className="text-lg">No hay proveedores registrados</span>
              </div>
            }
          >
            <Column field="supplierCode" header="Código" sortable style={{ width: "8%" }} />
            <Column field="supplierName" header="Proveedor" sortable style={{ width: "18%" }} />
            <Column
              field="contactName"
              header="Contacto"
              style={{ width: "12%" }}
              body={(row) => row.contactName ?? <span className="text-400">—</span>}
            />
            <Column
              field="totalOrders"
              header="Órdenes"
              sortable
              style={{ width: "8%" }}
              body={(row) => <span className="font-semibold">{row.totalOrders}</span>}
            />
            <Column
              field="completedOrders"
              header="Completadas"
              sortable
              style={{ width: "10%" }}
              body={(row) => (
                <span className="text-green-600 font-semibold">{row.completedOrders}</span>
              )}
            />
            <Column
              field="cancelledOrders"
              header="Canceladas"
              sortable
              style={{ width: "10%" }}
              body={(row) =>
                row.cancelledOrders > 0 ? (
                  <span className="text-red-500 font-semibold">{row.cancelledOrders}</span>
                ) : (
                  <span className="text-400">0</span>
                )
              }
            />
            <Column
              field="totalAmount"
              header="Monto Total"
              sortable
              style={{ width: "12%" }}
              body={(row) => (
                <span className="font-semibold">${fmtCurrency(row.totalAmount)}</span>
              )}
            />
            <Column
              field="avgDeliveryDays"
              header="Días Entrega Prom."
              sortable
              style={{ width: "13%" }}
              body={(row) =>
                row.avgDeliveryDays !== null ? (
                  <span
                    className="font-semibold"
                    style={{
                      color:
                        row.avgDeliveryDays <= 7
                          ? "#22C55E"
                          : row.avgDeliveryDays <= 14
                          ? "#F97316"
                          : "#EF4444",
                    }}
                  >
                    {row.avgDeliveryDays}d
                  </span>
                ) : (
                  <span className="text-400">—</span>
                )
              }
            />
            <Column
              field="onTimeRate"
              header="Puntualidad"
              sortable
              style={{ width: "10%" }}
              body={(row) =>
                row.onTimeRate !== null ? (
                  <Tag
                    value={`${row.onTimeRate}%`}
                    severity={onTimeSeverity(row.onTimeRate)}
                  />
                ) : (
                  <span className="text-400">—</span>
                )
              }
            />
            <Column
              field="lastOrderDate"
              header="Última Orden"
              sortable
              style={{ width: "11%" }}
              body={(row) =>
                row.lastOrderDate
                  ? new Date(row.lastOrderDate).toLocaleDateString("es-VE")
                  : <span className="text-400">—</span>
              }
            />
          </DataTable>
        )}
      </Card>
    </>
  );
};

export default SupplierPerformanceReport;
