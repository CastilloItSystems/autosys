"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, DataTableExpandedRows } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { motion } from "framer-motion";
import { Card } from "primereact/card";
import apiClient from "@/app/api/apiClient";
import { handleFormError } from "@/utils/errorHandlers";
import PreInvoiceStepper from "@/components/sales/preInvoice/PreInvoiceStepper";
import type { PreInvoiceStatus } from "@/libs/interfaces/sales/preInvoice.interface";

const STATUS_CONFIG: Record<string, { label: string; severity: "success" | "info" | "warning" | "danger" | "secondary" }> = {
  PENDING_PREPARATION: { label: "Pendiente",        severity: "secondary" },
  IN_PREPARATION:      { label: "En preparación",   severity: "info" },
  READY_FOR_PAYMENT:   { label: "Lista para pago",  severity: "warning" },
  PAID:                { label: "Pagada",            severity: "success" },
  CANCELLED:           { label: "Cancelada",         severity: "danger" },
};

const fmt = (v?: number | null) =>
  v != null ? v.toLocaleString("es-MX", { style: "currency", currency: "MXN" }) : "—";

export default function WorkshopBillingPage() {
  const toast = useRef<Toast>(null);
  const router = useRouter();
  const [preInvoices, setPreInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/sales/pre-invoices", {
        params: { hasServiceOrder: true, limit: 100 },
      });
      setPreInvoices(res.data?.data?.data ?? res.data?.data ?? []);
    } catch (err) {
      handleFormError(err, toast.current!);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rowExpansionTemplate = (pi: any) => {
    const items = pi.items ?? [];
    return (
      <div className="p-3">
        <PreInvoiceStepper currentStatus={pi.status as PreInvoiceStatus} />
        <DataTable value={items} size="small" className="mt-3">
          <Column field="itemName" header="Descripción" />
          <Column field="quantity" header="Cant." style={{ width: "80px" }} />
          <Column header="P. Unitario" body={(r) => fmt(r.unitPrice)} style={{ width: "120px" }} />
          <Column field="taxType" header="Impuesto" style={{ width: "90px" }} />
          <Column header="Total" body={(r) => fmt(r.totalLine)} style={{ width: "120px" }} />
        </DataTable>
      </div>
    );
  };

  return (
    <motion.div
      className="p-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Toast ref={toast} />

      <div className="flex align-items-center gap-2 mb-4">
        <i className="pi pi-dollar text-primary text-2xl" />
        <h2 className="text-2xl font-bold text-900 m-0">Facturación de Taller</h2>
      </div>

      <Card>
        <div className="flex justify-content-between align-items-center mb-3">
          <span className="text-500 text-sm">
            Pre-facturas generadas desde Órdenes de Trabajo
          </span>
          <div className="flex gap-2">
            <Button
              label="Ver todas en Ventas"
              icon="pi pi-external-link"
              outlined
              size="small"
              onClick={() => router.push("/empresa/ventas/pre-facturas")}
            />
            <Button icon="pi pi-refresh" text rounded onClick={load} loading={loading} />
          </div>
        </div>

        <DataTable
          value={preInvoices}
          loading={loading}
          emptyMessage="Sin pre-facturas de taller"
          size="small"
          paginator
          rows={20}
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
          dataKey="id"
        >
          <Column expander style={{ width: "3rem" }} />
          <Column field="preInvoiceNumber" header="N° Pre-Factura" sortable />
          <Column
            header="OT"
            body={(row) =>
              row.serviceOrder?.folio ? (
                <Button
                  label={row.serviceOrder.folio}
                  link
                  size="small"
                  onClick={() =>
                    router.push(`/empresa/workshop/service-orders/${row.serviceOrderId}`)
                  }
                />
              ) : "—"
            }
          />
          <Column
            header="Cliente"
            body={(row) => row.customer?.name ?? "—"}
          />
          <Column
            field="status"
            header="Estado"
            body={(row) => {
              const cfg = STATUS_CONFIG[row.status];
              return <Tag value={cfg?.label ?? row.status} severity={cfg?.severity ?? "info"} />;
            }}
          />
          <Column
            field="total"
            header="Total"
            body={(row) => fmt(row.total)}
            sortable
          />
          <Column
            header="Generada"
            body={(row) =>
              row.createdAt ? new Date(row.createdAt).toLocaleDateString("es-MX") : "—"
            }
          />
        </DataTable>
      </Card>
    </motion.div>
  );
}
