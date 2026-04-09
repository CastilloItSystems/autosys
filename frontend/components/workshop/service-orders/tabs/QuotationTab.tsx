"use client";
import React, { useState, useRef } from "react";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import { useRouter } from "next/navigation";
import { handleFormError } from "@/utils/errorHandlers";
import billingBridgeService from "@/app/api/workshop/billingBridgeService";
import type { ServiceOrder } from "@/libs/interfaces/workshop";

const QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  ISSUED: "Emitida",
  SENT: "Enviada",
  NEGOTIATING: "Negociando",
  APPROVED: "Aprobada",
  CONVERTED: "Convertida",
  REJECTED: "Rechazada",
  EXPIRED: "Vencida",
};

const QUOTE_STATUS_SEVERITY: Record<string, "success" | "info" | "warning" | "danger" | "secondary"> = {
  DRAFT: "secondary",
  ISSUED: "info",
  SENT: "info",
  NEGOTIATING: "warning",
  APPROVED: "success",
  CONVERTED: "success",
  REJECTED: "danger",
  EXPIRED: "danger",
};

const fmt = (v?: number | string | null) => {
  const n = Number(v ?? 0);
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
};

interface QuotationTabProps {
  serviceOrder: ServiceOrder;
  onRefresh: () => void;
}

export default function QuotationTab({ serviceOrder, onRefresh }: QuotationTabProps) {
  const toast = useRef<Toast>(null);
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const quote = (serviceOrder as any).workshopQuote;

  const handleCreateQuote = async () => {
    setCreating(true);
    try {
      const res = await billingBridgeService.createQuoteFromSO(serviceOrder.id);
      const quoteId = res.data?.id;
      toast.current?.show({
        severity: "success",
        summary: "Cotización creada",
        detail: "Redirigiendo al módulo CRM...",
        life: 2000,
      });
      if (quoteId) {
        setTimeout(() => router.push(`/empresa/crm/cotizaciones`), 1500);
      }
      onRefresh();
    } catch (err) {
      handleFormError(err, toast.current!);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Toast ref={toast} />

      {!quote && (
        <div className="flex flex-column align-items-center py-5 gap-3">
          <i className="pi pi-file-o text-4xl text-400" />
          <p className="text-500 m-0 text-center">
            Esta OT no tiene una cotización CRM asociada.
          </p>
          <Button
            label="Crear Cotización"
            icon="pi pi-plus"
            loading={creating}
            onClick={handleCreateQuote}
            tooltip="Crea una cotización pre-llenada con los items de esta OT"
            tooltipOptions={{ position: "top" }}
          />
        </div>
      )}

      {quote && (
        <div className="flex flex-column gap-3">
          <Card>
            <div className="flex align-items-center justify-content-between mb-3">
              <div className="flex align-items-center gap-2">
                <i className="pi pi-file-o text-primary text-xl" />
                <span className="font-bold text-900">Cotización {quote.quoteNumber}</span>
                {quote.version > 1 && (
                  <Tag value={`v${quote.version}`} severity="secondary" />
                )}
              </div>
              <Tag
                value={QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
                severity={QUOTE_STATUS_SEVERITY[quote.status] ?? "info"}
              />
            </div>

            {quote.title && (
              <p className="text-700 mb-3">{quote.title}</p>
            )}

            <div className="grid">
              <div className="col-12 md:col-6">
                <div className="flex flex-column gap-2 text-sm">
                  <div className="flex justify-content-between">
                    <span className="text-600">Subtotal</span>
                    <span>{fmt(quote.subtotal)}</span>
                  </div>
                  <div className="flex justify-content-between">
                    <span className="text-600">Impuesto</span>
                    <span>{fmt(quote.taxAmt)}</span>
                  </div>
                  <div className="flex justify-content-between font-bold">
                    <span className="text-600">Total</span>
                    <span className="text-lg">{fmt(quote.total)}</span>
                  </div>
                </div>
              </div>
              <div className="col-12 md:col-6">
                <div className="flex flex-column gap-2 text-sm">
                  {quote.validUntil && (
                    <div className="flex justify-content-between">
                      <span className="text-600">Válida hasta</span>
                      <span>{new Date(quote.validUntil).toLocaleDateString("es-MX")}</span>
                    </div>
                  )}
                  <div className="flex justify-content-between">
                    <span className="text-600">Items</span>
                    <span>{quote.items?.length ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <Divider />

            <div className="flex justify-content-end gap-2">
              <Button
                label="Ver cotizaciones taller"
                icon="pi pi-external-link"
                outlined
                size="small"
                onClick={() => router.push("/empresa/workshop/quotations")}
              />
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
