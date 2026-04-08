"use client";
import React from "react";
import { Card } from "primereact/card";
import type { ServiceOrder } from "@/libs/interfaces/workshop";
import WorkshopFormSection from "@/components/workshop/shared/WorkshopFormSection";
import { ServiceOrderStatusBadge } from "@/components/workshop/shared/ServiceOrderStatusBadge";

interface ServiceOrderSummaryTabProps {
  serviceOrder: ServiceOrder;
}

const fmt = (val?: number | null) =>
  val != null
    ? val.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
    : "—";

const fmtDate = (val?: string | null) =>
  val ? new Date(val).toLocaleDateString("es-MX") : "—";

const Field = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="mb-3">
    <div className="text-500 text-sm mb-1">{label}</div>
    <div className="text-900 font-medium">{value ?? "—"}</div>
  </div>
);

export default function ServiceOrderSummaryTab({
  serviceOrder,
}: ServiceOrderSummaryTabProps) {
  return (
    <div className="grid">
      {/* Left column */}
      <div className="col-12 lg:col-8">
        <WorkshopFormSection title="Información General" icon="pi-info-circle">
          <div className="grid">
            <div className="col-12 md:col-6">
              <Field label="Folio" value={serviceOrder.folio} />
            </div>
            <div className="col-12 md:col-6">
              <Field
                label="Estado"
                value={<ServiceOrderStatusBadge status={serviceOrder.status} />}
              />
            </div>
            <div className="col-12 md:col-6">
              <Field label="Prioridad" value={serviceOrder.priority} />
            </div>
            <div className="col-12 md:col-6">
              <Field label="Origen" value={serviceOrder.origin ?? "—"} />
            </div>
            <div className="col-12 md:col-6">
              <Field label="Fecha recepción" value={fmtDate(serviceOrder.receivedAt)} />
            </div>
            <div className="col-12 md:col-6">
              <Field label="Entrega prometida" value={fmtDate(serviceOrder.estimatedDelivery)} />
            </div>
          </div>
        </WorkshopFormSection>

        <WorkshopFormSection title="Cliente y Vehículo" icon="pi-car">
          <div className="grid">
            <div className="col-12 md:col-6">
              <Field label="Cliente" value={serviceOrder.customer?.name} />
            </div>
            <div className="col-12 md:col-6">
              <Field label="Placa" value={serviceOrder.vehiclePlate} />
            </div>
            <div className="col-12 md:col-6">
              <Field label="Vehículo" value={serviceOrder.vehicleDesc} />
            </div>
            <div className="col-12 md:col-6">
              <Field
                label="Kilometraje entrada"
                value={
                  serviceOrder.mileageIn
                    ? `${serviceOrder.mileageIn.toLocaleString("es-MX")} km`
                    : "—"
                }
              />
            </div>
          </div>
        </WorkshopFormSection>

        {serviceOrder.observations && (
          <WorkshopFormSection title="Observaciones" icon="pi-comment">
            <p className="text-900 m-0">{serviceOrder.observations}</p>
          </WorkshopFormSection>
        )}
      </div>

      {/* Right column */}
      <div className="col-12 lg:col-4">
        <Card title="Resumen Financiero" className="mb-3">
          <div className="flex flex-column gap-2">
            <div className="flex justify-content-between">
              <span className="text-600">Mano de obra</span>
              <span className="font-medium">{fmt(serviceOrder.laborTotal)}</span>
            </div>
            <div className="flex justify-content-between">
              <span className="text-600">Repuestos</span>
              <span className="font-medium">{fmt(serviceOrder.partsTotal)}</span>
            </div>
            <div className="flex justify-content-between">
              <span className="text-600">Otros</span>
              <span className="font-medium">{fmt(serviceOrder.otherTotal)}</span>
            </div>
            <div className="flex justify-content-between border-top-1 surface-border pt-2">
              <span className="text-600">Subtotal</span>
              <span className="font-medium">{fmt(serviceOrder.subtotal)}</span>
            </div>
            <div className="flex justify-content-between">
              <span className="text-600">IVA</span>
              <span className="font-medium">{fmt(serviceOrder.taxAmt)}</span>
            </div>
            <div className="flex justify-content-between border-top-1 surface-border pt-2">
              <span className="text-900 font-bold">Total</span>
              <span className="text-primary text-xl font-bold">
                {fmt(serviceOrder.total)}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Asignación">
          <div className="flex flex-column gap-3">
            <Field
              label="Técnico asignado"
              value={serviceOrder.assignedTechnicianId ?? "Sin asignar"}
            />
            <Field
              label="Asesor"
              value={serviceOrder.assignedAdvisorId ?? "Sin asignar"}
            />
            <Field label="Bahía" value={serviceOrder.bayId ?? "Sin asignar"} />
          </div>
        </Card>
      </div>
    </div>
  );
}
