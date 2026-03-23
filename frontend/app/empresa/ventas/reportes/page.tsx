"use client";

import { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { motion } from "framer-motion";
import salesReportService, { SalesDashboard } from "@/app/api/sales/reportService";

const SalesDashboardPage = () => {
  const toast = useRef<Toast>(null);
  const [data, setData] = useState<SalesDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await salesReportService.getDashboard();
      setData(result);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el dashboard de ventas",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      label: "Facturado Hoy",
      value: data?.today.revenue ?? 0,
      sub: `${data?.today.invoices ?? 0} facturas`,
      icon: "pi pi-dollar",
      bg: "#EFF6FF",
      iconColor: "#3B82F6",
    },
    {
      label: "Facturado Esta Semana",
      value: data?.week.revenue ?? 0,
      sub: `${data?.week.invoices ?? 0} facturas`,
      icon: "pi pi-chart-line",
      bg: "#F0FDF4",
      iconColor: "#22C55E",
    },
    {
      label: "Facturado Este Mes",
      value: data?.month.revenue ?? 0,
      sub: `${data?.month.invoices ?? 0} facturas`,
      icon: "pi pi-calendar",
      bg: "#FFF7ED",
      iconColor: "#F97316",
    },
    {
      label: "Órd. Pendientes Aprob.",
      value: data?.pending.ordersAwaitingApproval ?? 0,
      sub: `${data?.pending.preInvoicesAwaitingPayment ?? 0} prefacturas pend.`,
      icon: "pi pi-clock",
      bg: "#FEF2F2",
      iconColor: "#EF4444",
      isCount: true,
    },
  ];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
      value
    );

  return (
    <>
      <Toast ref={toast} />

      {/* KPI Cards */}
      <div className="grid mb-4">
        {kpiCards.map((card, idx) => (
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
                    <i className={card.icon} style={{ fontSize: "1.4rem", color: card.iconColor }} />
                  </div>
                  <div>
                    <p className="text-500 text-sm m-0">{card.label}</p>
                    {loading ? (
                      <Skeleton width="5rem" height="1.5rem" />
                    ) : (
                      <p className="font-bold text-2xl m-0" style={{ color: card.iconColor }}>
                        {card.isCount ? card.value : `$${formatCurrency(card.value)}`}
                      </p>
                    )}
                    <p className="text-400 text-xs m-0">{card.sub}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        ))}
      </div>

      <div className="grid">
        {/* Revenue por moneda */}
        <div className="col-12 md:col-4">
          <Card title="Ingresos por Moneda (Mes)">
            {loading ? (
              <Skeleton height="120px" />
            ) : (
              <div className="flex flex-column gap-3">
                {Object.entries(data?.byCurrency ?? {}).map(([currency, amount]) => (
                  <div key={currency} className="flex justify-content-between align-items-center">
                    <Tag value={currency} severity={currency === "USD" ? "success" : currency === "VES" ? "warning" : "info"} />
                    <span className="font-semibold">{formatCurrency(amount as number)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Facturas recientes */}
        <div className="col-12 md:col-8">
          <Card title="Facturas Recientes">
            {loading ? (
              <Skeleton height="200px" />
            ) : (
              <DataTable
                value={data?.recentInvoices ?? []}
                size="small"
                emptyMessage="Sin facturas recientes"
              >
                <Column field="invoiceNumber" header="Nro. Factura" />
                <Column field="customerName" header="Cliente" />
                <Column
                  field="invoiceDate"
                  header="Fecha"
                  body={(row) =>
                    row.invoiceDate
                      ? new Date(row.invoiceDate).toLocaleDateString("es-VE")
                      : "—"
                  }
                />
                <Column
                  field="currency"
                  header="Moneda"
                  body={(row) => <Tag value={row.currency} />}
                />
                <Column
                  field="total"
                  header="Total"
                  body={(row) => (
                    <span className="font-semibold">{formatCurrency(row.total)}</span>
                  )}
                />
              </DataTable>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default SalesDashboardPage;
