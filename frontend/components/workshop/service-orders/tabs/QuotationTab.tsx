"use client";
import React, { useRef, useState } from "react";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import { useRouter } from "next/navigation";
import { handleFormError } from "@/utils/errorHandlers";
import billingBridgeService from "@/app/api/workshop/billingBridgeService";
import type { ServiceOrder } from "@/libs/interfaces/workshop";

const QUOTATION_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  ISSUED: "Emitida",
  SENT: "Enviada",
  PENDING_APPROVAL: "Pendiente de aprobación",
  APPROVED_TOTAL: "Aprobada total",
  APPROVED_PARTIAL: "Aprobada parcial",
  CONVERTED: "Convertida",
  REJECTED: "Rechazada",
  EXPIRED: "Vencida",
};

const QUOTATION_STATUS_SEVERITY: Record<
  string,
  "success" | "info" | "warning" | "danger" | "secondary"
> = {
  DRAFT: "secondary",
  ISSUED: "info",
  SENT: "info",
  PENDING_APPROVAL: "warning",
  APPROVED_TOTAL: "success",
  APPROVED_PARTIAL: "success",
  CONVERTED: "success",
  REJECTED: "danger",
  EXPIRED: "danger",
};

const fmt = (v?: number | string | null) => {
  const n = Number(v ?? 0);
  return n.toLocaleString("es-VE", { style: "currency", currency: "USD" });
};

interface QuotationTabProps {
  serviceOrder: ServiceOrder;
  onRefresh: () => void;
}

export default function QuotationTab({
  serviceOrder,
  onRefresh,
}: QuotationTabProps) {
  const toast = useRef<Toast>(null);
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const quotation = serviceOrder.quotations?.[0] ?? null;

  const handleCreateQuotation = async () => {
    setCreating(true);
    try {
      await billingBridgeService.createWorkshopQuotationFromSO(serviceOrder.id);
      toast.current?.show({
        severity: "success",
        summary: "Cotización creada",
        detail: "Se creó la cotización de taller desde la OT",
        life: 2500,
      });
      onRefresh();
    } catch (err) {
      handleFormError(err, toast);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Toast ref={toast} />

      {!quotation && (
        <div className="flex flex-column align-items-center py-5 gap-3">
          <i className="pi pi-file-o text-4xl text-400" />
          <p className="text-500 m-0 text-center">
            Esta OT no tiene una cotización de taller asociada.
          </p>
          <Button
            label="Crear cotización de taller"
            icon="pi pi-plus"
            loading={creating}
            onClick={handleCreateQuotation}
            tooltip="Crea una cotización pre-llenada con los ítems facturables de esta OT"
            tooltipOptions={{ position: "top" }}
          />
        </div>
      )}

      {quotation && (
        <div className="flex flex-column gap-3">
          <Card>
            <div className="flex align-items-center justify-content-between mb-3">
              <div className="flex align-items-center gap-2">
                <i className="pi pi-file-o text-primary text-xl" />
                <span className="font-bold text-900">
                  Cotización {quotation.quotationNumber}
                </span>
                {quotation.version > 1 && (
                  <Tag value={`v${quotation.version}`} severity="secondary" />
                )}
              </div>
              <Tag
                value={
                  QUOTATION_STATUS_LABELS[quotation.status] ?? quotation.status
                }
                severity={QUOTATION_STATUS_SEVERITY[quotation.status] ?? "info"}
              />
            </div>

            {quotation.notes && (
              <p className="text-700 mb-3">{quotation.notes}</p>
            )}

            <div className="grid">
              <div className="col-12 md:col-6">
                <div className="flex flex-column gap-2 text-sm">
                  <div className="flex justify-content-between">
                    <span className="text-600">Subtotal</span>
                    <span>{fmt(quotation.subtotal)}</span>
                  </div>
                  <div className="flex justify-content-between">
                    <span className="text-600">Impuesto</span>
                    <span>{fmt(quotation.taxAmt)}</span>
                  </div>
                  <div className="flex justify-content-between font-bold">
                    <span className="text-600">Total</span>
                    <span className="text-lg">{fmt(quotation.total)}</span>
                  </div>
                </div>
              </div>
              <div className="col-12 md:col-6">
                <div className="flex flex-column gap-2 text-sm">
                  {quotation.validUntil && (
                    <div className="flex justify-content-between">
                      <span className="text-600">Válida hasta</span>
                      <span>
                        {new Date(quotation.validUntil).toLocaleDateString(
                          "es-MX"
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-content-between">
                    <span className="text-600">Ítems</span>
                    <span>{quotation.items?.length ?? 0}</span>
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
