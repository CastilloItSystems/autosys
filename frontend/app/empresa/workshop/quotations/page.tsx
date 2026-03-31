"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { motion } from "framer-motion";
import { Card } from "primereact/card";
import apiClient from "@/app/api/apiClient";
import { handleFormError } from "@/utils/errorHandlers";

const STATUS_CONFIG: Record<string, { label: string; severity: "success" | "info" | "warning" | "danger" | "secondary" }> = {
  DRAFT:       { label: "Borrador",   severity: "secondary" },
  ISSUED:      { label: "Emitida",    severity: "info" },
  SENT:        { label: "Enviada",    severity: "info" },
  NEGOTIATING: { label: "Negociando", severity: "warning" },
  APPROVED:    { label: "Aprobada",   severity: "success" },
  CONVERTED:   { label: "Convertida", severity: "success" },
  REJECTED:    { label: "Rechazada",  severity: "danger" },
  EXPIRED:     { label: "Vencida",    severity: "danger" },
};

const fmt = (v?: number | null) =>
  v != null ? v.toLocaleString("es-MX", { style: "currency", currency: "MXN" }) : "—";

export default function WorkshopQuotationsPage() {
  const toast = useRef<Toast>(null);
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/crm/quotes", {
        params: { isWorkshopQuote: true, type: "SERVICE", limit: 100 },
      });
      setQuotes(res.data?.data?.data ?? res.data?.data ?? []);
    } catch (err) {
      handleFormError(err, toast.current!);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <motion.div
      className="p-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Toast ref={toast} />

      <div className="flex align-items-center gap-2 mb-4">
        <i className="pi pi-file-o text-primary text-2xl" />
        <h2 className="text-2xl font-bold text-900 m-0">Cotizaciones de Taller</h2>
      </div>

      <Card>
        <div className="flex justify-content-between align-items-center mb-3">
          <span className="text-500 text-sm">
            Cotizaciones CRM de tipo SERVICE creadas desde el módulo de taller
          </span>
          <div className="flex gap-2">
            <Button
              label="Ver todas en CRM"
              icon="pi pi-external-link"
              outlined
              size="small"
              onClick={() => router.push("/empresa/crm/cotizaciones")}
            />
            <Button icon="pi pi-refresh" text rounded onClick={load} loading={loading} />
          </div>
        </div>

        <DataTable
          value={quotes}
          loading={loading}
          emptyMessage="Sin cotizaciones de taller"
          size="small"
          paginator
          rows={20}
        >
          <Column field="quoteNumber" header="Número" sortable />
          <Column field="title" header="Título" style={{ minWidth: "200px" }} />
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
            header="Fecha"
            body={(row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString("es-MX") : "—"}
          />
          <Column
            header=""
            body={(row) => (
              <Button
                icon="pi pi-eye"
                text
                rounded
                size="small"
                onClick={() => router.push("/empresa/crm/cotizaciones")}
                tooltip="Ver en CRM"
                tooltipOptions={{ position: "left" }}
              />
            )}
            style={{ width: "60px" }}
          />
        </DataTable>
      </Card>
    </motion.div>
  );
}
