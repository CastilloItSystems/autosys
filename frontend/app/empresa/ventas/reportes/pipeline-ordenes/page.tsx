"use client";

import { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { motion } from "framer-motion";
import salesReportService, { OrderPipelineReport } from "@/app/api/sales/reportService";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  PENDING_APPROVAL: "Pend. Aprobación",
  APPROVED: "Aprobada",
  CANCELLED: "Cancelada",
};

const STATUS_SEVERITY: Record<string, "info" | "warning" | "success" | "danger"> = {
  DRAFT: "info",
  PENDING_APPROVAL: "warning",
  APPROVED: "success",
  CANCELLED: "danger",
};

const OrderPipelinePage = () => {
  const toast = useRef<Toast>(null);
  const [data, setData] = useState<OrderPipelineReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await salesReportService.getOrderPipeline();
      setData((response as any).data ?? response);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el pipeline de órdenes",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  const summaryCards = [
    { label: "Total Órdenes", value: data?.summary.totalOrders ?? 0, icon: "pi pi-list", color: "#3B82F6", bg: "#EFF6FF", isCount: true },
    { label: "Valor Total", value: data?.summary.totalValue ?? 0, icon: "pi pi-dollar", color: "#22C55E", bg: "#F0FDF4" },
    { label: "Tasa de Aprobación", value: data?.summary.approvedRate ?? 0, icon: "pi pi-check-circle", color: "#8B5CF6", bg: "#F5F3FF", isPercent: true },
    { label: "Tiempo Prom. Aprob.", value: data?.avgApprovalHours ?? 0, icon: "pi pi-clock", color: "#F97316", bg: "#FFF7ED", isHours: true },
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
                    <i className={card.icon} style={{ fontSize: "1.4rem", color: card.color }} />
                  </div>
                  <div>
                    <p className="text-500 text-sm m-0">{card.label}</p>
                    {loading ? (
                      <Skeleton width="4rem" height="1.5rem" />
                    ) : (
                      <p className="font-bold text-2xl m-0" style={{ color: card.color }}>
                        {card.isCount
                          ? card.value
                          : card.isPercent
                          ? `${(card.value as number).toFixed(1)}%`
                          : card.isHours
                          ? `${card.value}h`
                          : `$${formatCurrency(card.value as number)}`}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        ))}
      </div>

      <Card title="Pipeline de Órdenes por Estado">
        {loading ? (
          <Skeleton height="250px" />
        ) : (
          <DataTable value={data?.byStatus ?? []} size="small" stripedRows>
            <Column
              field="status"
              header="Estado"
              body={(row) => (
                <Tag
                  value={STATUS_LABELS[row.status] ?? row.status}
                  severity={STATUS_SEVERITY[row.status] ?? "info"}
                />
              )}
            />
            <Column field="count" header="Cantidad" body={(row) => <span className="font-semibold">{row.count}</span>} />
            <Column
              field="totalValue"
              header="Valor Total"
              body={(row) => <span className="font-bold">{formatCurrency(row.totalValue)}</span>}
            />
            <Column
              field="avgValue"
              header="Valor Promedio"
              body={(row) => formatCurrency(row.avgValue)}
            />
          </DataTable>
        )}
        {!loading && data?.pendingOldestDays > 0 && (
          <div className="mt-3 p-3 border-round surface-100">
            <i className="pi pi-exclamation-triangle text-orange-500 mr-2" />
            <span className="text-sm">
              Orden más antigua pendiente de aprobación:{" "}
              <strong>{data.pendingOldestDays} días</strong>
            </span>
          </div>
        )}
      </Card>
    </>
  );
};

export default OrderPipelinePage;
