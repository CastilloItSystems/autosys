"use client";
import React, { useState, useRef } from "react";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import { useRouter } from "next/navigation";
import PreInvoiceStepper from "@/components/sales/preInvoice/PreInvoiceStepper";
import billingBridgeService from "@/app/api/workshop/billingBridgeService";
import { handleFormError } from "@/utils/errorHandlers";
import type { ServiceOrder } from "@/libs/interfaces/workshop";

const BILLABLE_STATUSES = ["READY", "DELIVERED", "INVOICED", "CLOSED"];

const fmt = (v?: number | string | null) => {
  const n = Number(v ?? 0);
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
};

interface BillingTabProps {
  serviceOrder: ServiceOrder;
  onRefresh: () => void;
}

export default function BillingTab({ serviceOrder, onRefresh }: BillingTabProps) {
  const toast = useRef<Toast>(null);
  const router = useRouter();
  const [generating, setGenerating] = useState(false);

  const preInvoice = (serviceOrder as any).preInvoice;
  const invoice = (serviceOrder as any).invoice;
  const isBillable = BILLABLE_STATUSES.includes(serviceOrder.status);

  const handleGeneratePreInvoice = async () => {
    setGenerating(true);
    try {
      await billingBridgeService.generatePreInvoice(serviceOrder.id);
      toast.current?.show({
        severity: "success",
        summary: "Pre-factura generada",
        detail: "Puedes gestionarla desde el módulo de Facturación",
        life: 4000,
      });
      onRefresh();
    } catch (err) {
      handleFormError(err, toast.current!);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <Toast ref={toast} />

      {!isBillable && (
        <div className="flex flex-column align-items-center py-5 text-500">
          <i className="pi pi-info-circle text-3xl mb-2" />
          <p className="text-center m-0">
            La OT debe estar en estado <strong>Lista</strong> o{" "}
            <strong>Entregada</strong> para generar la pre-factura.
          </p>
        </div>
      )}

      {isBillable && !preInvoice && serviceOrder.status !== "INVOICED" && serviceOrder.status !== "CLOSED" && (
        <div className="flex flex-column align-items-center py-5 gap-3">
          <i className="pi pi-file-invoice text-4xl text-400" />
          <p className="text-500 m-0">Sin pre-factura generada</p>
          <Button
            label="Generar Pre-Factura"
            icon="pi pi-plus"
            loading={generating}
            onClick={handleGeneratePreInvoice}
          />
        </div>
      )}

      {preInvoice && (
        <div className="flex flex-column gap-3">
          {/* Stepper */}
          <PreInvoiceStepper currentStatus={preInvoice.status} />

          {/* Pre-invoice summary */}
          <Card>
            <div className="grid">
              <div className="col-12 md:col-6">
                <div className="flex flex-column gap-2">
                  <div className="flex justify-content-between">
                    <span className="text-600">Número</span>
                    <span className="font-semibold">{preInvoice.preInvoiceNumber}</span>
                  </div>
                  <div className="flex justify-content-between">
                    <span className="text-600">Estado</span>
                    <Tag
                      value={preInvoice.status}
                      severity={
                        preInvoice.status === "PAID"
                          ? "success"
                          : preInvoice.status === "CANCELLED"
                          ? "danger"
                          : "info"
                      }
                    />
                  </div>
                  <div className="flex justify-content-between">
                    <span className="text-600">Total</span>
                    <span className="font-bold text-lg">{fmt(preInvoice.total)}</span>
                  </div>
                </div>
              </div>

              <div className="col-12 md:col-6">
                <div className="flex flex-column gap-2">
                  <div className="flex justify-content-between">
                    <span className="text-600">Base imponible</span>
                    <span>{fmt(preInvoice.baseImponible)}</span>
                  </div>
                  <div className="flex justify-content-between">
                    <span className="text-600">IVA ({preInvoice.taxRate}%)</span>
                    <span>{fmt(preInvoice.taxAmount)}</span>
                  </div>
                  {preInvoice.igtfApplies && (
                    <div className="flex justify-content-between">
                      <span className="text-600">IGTF ({preInvoice.igtfRate}%)</span>
                      <span>{fmt(preInvoice.igtfAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Divider />

            <div className="flex justify-content-end">
              <Button
                label="Ver en Facturación"
                icon="pi pi-external-link"
                outlined
                size="small"
                onClick={() => router.push("/empresa/workshop/billing")}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Invoice info */}
      {invoice && (
        <Card className="mt-3" style={{ borderLeft: "4px solid var(--green-500)" }}>
          <div className="flex align-items-center gap-2 mb-2">
            <i className="pi pi-check-circle text-green-500 text-xl" />
            <span className="font-bold text-green-700">Factura generada</span>
          </div>
          <div className="flex flex-column gap-1 text-sm">
            <div className="flex justify-content-between">
              <span className="text-600">N° Factura</span>
              <span className="font-semibold">{invoice.invoiceNumber}</span>
            </div>
            {invoice.fiscalNumber && (
              <div className="flex justify-content-between">
                <span className="text-600">N° Fiscal</span>
                <span>{invoice.fiscalNumber}</span>
              </div>
            )}
            <div className="flex justify-content-between">
              <span className="text-600">Total</span>
              <span className="font-bold">{fmt(invoice.total)}</span>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
