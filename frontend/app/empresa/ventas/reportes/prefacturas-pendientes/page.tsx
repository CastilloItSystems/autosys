"use client";

import { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import { motion } from "framer-motion";
import ReportsTable from "@/components/inventory/reports/ReportsTable";
import salesReportService, {
  PendingInvoiceItem,
} from "@/app/api/sales/reportService";
import { ReportFormat } from "@/app/api/inventory/reportService";

const STATUS_LABELS: Record<string, string> = {
  PENDING_PREPARATION: "Pend. Preparación",
  IN_PREPARATION: "En Preparación",
  READY_FOR_PAYMENT: "Lista para Pago",
};

const STATUS_SEVERITY: Record<string, "warning" | "info" | "success"> = {
  PENDING_PREPARATION: "warning",
  IN_PREPARATION: "info",
  READY_FOR_PAYMENT: "success",
};

const PendingInvoicesPage = () => {
  const toast = useRef<Toast>(null);
  const [items, setItems] = useState<PendingInvoiceItem[]>([]);
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
      const response = await salesReportService.getPendingInvoices({
        page,
        limit: rows,
      });
      setItems(response.data);
      setTotalRecords(response.meta?.total ?? 0);
      setSummary(response.summary ?? null);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las pre-facturas pendientes",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const columns = [
    {
      field: "preInvoiceNumber",
      header: "Nro. Pre-Factura",
      sortable: true,
      width: "16%",
    },
    {
      field: "customerName",
      header: "Cliente",
      sortable: true,
      width: "20%",
      body: (row: PendingInvoiceItem) => (
        <span className="font-semibold">{row.customerName}</span>
      ),
    },
    { field: "warehouseName", header: "Almacén", sortable: true, width: "14%" },
    {
      field: "total",
      header: "Total",
      sortable: true,
      width: "12%",
      body: (row: PendingInvoiceItem) => (
        <span className="font-bold">{formatCurrency(row.total)}</span>
      ),
    },
    {
      field: "currency",
      header: "Moneda",
      sortable: true,
      width: "8%",
      body: (row: PendingInvoiceItem) => <Tag value={row.currency} />,
    },
    {
      field: "status",
      header: "Estado",
      sortable: true,
      width: "16%",
      body: (row: PendingInvoiceItem) => (
        <Tag
          value={STATUS_LABELS[row.status] ?? row.status}
          severity={STATUS_SEVERITY[row.status] ?? "info"}
        />
      ),
    },
    {
      field: "daysWaiting",
      header: "Días en Espera",
      sortable: true,
      width: "14%",
      body: (row: PendingInvoiceItem) => (
        <Tag
          value={`${row.daysWaiting}d`}
          severity={
            row.daysWaiting > 7
              ? "danger"
              : row.daysWaiting > 3
              ? "warning"
              : "success"
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
      color: "#3B82F6",
      bg: "#EFF6FF",
    },
    {
      label: "Críticas (>7 días)",
      value: summary?.criticalCount ?? 0,
      icon: "pi pi-exclamation-triangle",
      color: "#EF4444",
      bg: "#FEF2F2",
    },
    {
      label: "En Seguimiento (3–7d)",
      value: summary?.warningCount ?? 0,
      icon: "pi pi-clock",
      color: "#F97316",
      bg: "#FFF7ED",
    },
    {
      label: "Recientes (≤3 días)",
      value: summary?.normalCount ?? 0,
      icon: "pi pi-check-circle",
      color: "#22C55E",
      bg: "#F0FDF4",
    },
  ];

  return (
    <>
      <Toast ref={toast} />

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
                    style={{ width: 48, height: 48, background: card.bg }}
                  >
                    <i
                      className={card.icon}
                      style={{ fontSize: "1.4rem", color: card.color }}
                    />
                  </div>
                  <div>
                    <p className="text-500 text-sm m-0">{card.label}</p>
                    {loading ? (
                      <Skeleton width="4rem" height="1.5rem" />
                    ) : (
                      <p
                        className="font-bold text-2xl m-0"
                        style={{ color: card.color }}
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
        <Card title="Pre-Facturas Pendientes">
          <Skeleton height="300px" />
        </Card>
      ) : (
        <ReportsTable
          title="Pre-Facturas Pendientes"
          data={items}
          columns={columns}
          loading={loading}
          totalRecords={totalRecords}
          page={page}
          rows={rows}
          reportType="sales-pending-invoices"
          onPageChange={(e) => {
            setPage((e.page ?? 0) + 1);
            setRows(e.rows ?? 20);
          }}
          showDateFilter={false}
          showWarehouseFilter={false}
          showSearchFilter={false}
          onExport={(format) =>
            salesReportService.download(
              "pending-invoices",
              format as ReportFormat,
            )
          }
        />
      )}
    </>
  );
};

export default PendingInvoicesPage;
