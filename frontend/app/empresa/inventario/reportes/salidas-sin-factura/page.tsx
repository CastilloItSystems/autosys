"use client";

import { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import { motion } from "framer-motion";
import ReportsTable from "@/components/inventory/reports/ReportsTable";
import reportService from "@/app/api/inventory/reportService";

const ExitsWithoutInvoicePage = () => {
  const toast = useRef<Toast>(null);
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<{
    criticalCount: number;
    warningCount: number;
    normalCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(20);

  useEffect(() => {
    loadData();
  }, [page, rows]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await reportService.getExitsWithoutInvoice(page, rows);
      setItems(response.data);
      setTotalRecords((response as any).meta?.total ?? 0);
      setSummary((response as any).summary ?? null);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las salidas sin factura",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const criticalCount = summary?.criticalCount ?? 0;
  const warningCount = summary?.warningCount ?? 0;
  const normalCount = summary?.normalCount ?? 0;

  const columns = [
    {
      field: "exitNoteNumber",
      header: "Nro. Nota de Salida",
      sortable: true,
      width: "18%",
    },
    {
      field: "createdDate",
      header: "Fecha",
      sortable: true,
      width: "12%",
      body: (row: any) =>
        row.createdDate
          ? new Date(row.createdDate).toLocaleDateString("es-VE")
          : "—",
    },
    {
      field: "recipientName",
      header: "Destinatario",
      sortable: true,
      width: "18%",
      body: (row: any) => (
        <span className="text-500 text-sm">{row.recipientName || "—"}</span>
      ),
    },
    {
      field: "warehouseName",
      header: "Almacén",
      sortable: true,
      width: "15%",
    },
    {
      field: "itemCount",
      header: "Artículos",
      sortable: true,
      width: "8%",
      body: (row: any) => (
        <span className="font-semibold">{row.itemCount}</span>
      ),
    },
    {
      field: "totalQuantity",
      header: "Cant. Total",
      sortable: true,
      width: "10%",
      body: (row: any) => (
        <span className="font-semibold">{row.totalQuantity?.toFixed(0)}</span>
      ),
    },
    {
      field: "daysWithoutInvoice",
      header: "Días Sin Factura",
      sortable: true,
      width: "14%",
      body: (row: any) => (
        <Tag
          value={`${row.daysWithoutInvoice}d`}
          severity={
            row.daysWithoutInvoice > 30
              ? "danger"
              : row.daysWithoutInvoice > 7
              ? "warning"
              : "info"
          }
        />
      ),
    },
  ];

  const summaryCards = [
    {
      label: "Total Pendientes",
      value: totalRecords,
      icon: "pi pi-file-edit",
      color: "blue",
      bg: "#EFF6FF",
      iconColor: "#3B82F6",
    },
    {
      label: "Críticas (>30 días)",
      value: criticalCount,
      icon: "pi pi-exclamation-triangle",
      color: "red",
      bg: "#FEF2F2",
      iconColor: "#EF4444",
    },
    {
      label: "En Seguimiento (8–30d)",
      value: warningCount,
      icon: "pi pi-clock",
      color: "orange",
      bg: "#FFF7ED",
      iconColor: "#F97316",
    },
    {
      label: "Recientes (≤7 días)",
      value: normalCount,
      icon: "pi pi-check-circle",
      color: "green",
      bg: "#F0FDF4",
      iconColor: "#22C55E",
    },
  ];

  return (
    <>
      <Toast ref={toast} />

      {/* Summary KPI cards */}
      <div className="grid mb-4">
        {summaryCards.map((card, idx) => (
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
                    style={{
                      width: 48,
                      height: 48,
                      background: card.bg,
                    }}
                  >
                    <i
                      className={card.icon}
                      style={{ fontSize: "1.4rem", color: card.iconColor }}
                    />
                  </div>
                  <div>
                    <p className="text-500 text-sm m-0">{card.label}</p>
                    {loading ? (
                      <Skeleton width="4rem" height="1.5rem" />
                    ) : (
                      <p
                        className="font-bold text-2xl m-0"
                        style={{ color: card.iconColor }}
                      >
                        {card.value}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        ))}
      </div>

      {loading && items.length === 0 ? (
        <Card title="Salidas sin Factura">
          <Skeleton height="300px" />
        </Card>
      ) : (
        <ReportsTable
          title="Salidas Sin Factura"
          data={items}
          columns={columns}
          loading={loading}
          totalRecords={totalRecords}
          page={page}
          rows={rows}
          reportType="movements"
          onPageChange={(e) => {
            setPage((e.page ?? 0) + 1);
            setRows(e.rows ?? 20);
          }}
          showDateFilter={false}
          showWarehouseFilter={false}
          showSearchFilter={false}
        />
      )}
    </>
  );
};

export default ExitsWithoutInvoicePage;
