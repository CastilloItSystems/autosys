"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { BreadCrumb } from "primereact/breadcrumb";
import { motion } from "framer-motion";
import { serviceOrderService } from "@/app/api/workshop";
import type { ServiceOrder } from "@/libs/interfaces/workshop";
import { handleFormError } from "@/utils/errorHandlers";
import { ServiceOrderStatusBadge } from "@/components/workshop/shared/ServiceOrderStatusBadge";
import ServiceOrderSummaryTab from "./ServiceOrderSummaryTab";
import AttachmentPanel from "@/components/workshop/shared/AttachmentPanel";
import AuditLogPanel from "@/components/workshop/shared/AuditLogPanel";
import BillingTab from "./tabs/BillingTab";
import QuotationTab from "./tabs/QuotationTab";

// Dynamic imports for tab components (avoid circular deps + faster initial load)
const DiagnosisList = React.lazy(
  () => import("@/components/workshop/diagnoses/DiagnosisList")
);
const MaterialList = React.lazy(
  () => import("@/components/workshop/materials/MaterialList")
);
const AdditionalList = React.lazy(
  () => import("@/components/workshop/additionals/AdditionalList")
);
const LaborTimeList = React.lazy(
  () => import("@/components/workshop/labor-times/LaborTimeList")
);
const QualityCheckList = React.lazy(
  () => import("@/components/workshop/quality-checks/QualityCheckList")
);
const TOTList = React.lazy(
  () => import("@/components/workshop/tot/TOTList")
);
const GaritaList = React.lazy(
  () => import("@/components/workshop/garita/GaritaList")
);

interface ServiceOrderDetailProps {
  serviceOrderId: string;
  onClose?: () => void;
  embedded?: boolean;
}

export default function ServiceOrderDetail({
  serviceOrderId,
  onClose,
  embedded = false,
}: ServiceOrderDetailProps) {
  const [serviceOrder, setServiceOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const router = useRouter();
  const toast = useRef<Toast>(null);

  useEffect(() => {
    if (serviceOrderId) loadServiceOrder();
  }, [serviceOrderId]);

  const loadServiceOrder = async () => {
    try {
      setLoading(true);
      const res = await serviceOrderService.getById(serviceOrderId);
      setServiceOrder(res.data);
    } catch (error) {
      handleFormError(error, toast.current!);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onClose) onClose();
    else router.push("/empresa/workshop/service-orders");
  };

  const breadcrumbItems = [
    {
      label: "Órdenes de Trabajo",
      command: handleBack,
    },
    { label: serviceOrder?.folio ?? "Cargando..." },
  ];

  const breadcrumbHome = {
    icon: "pi pi-home",
    command: () => router.push("/empresa/workshop"),
  };

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center h-20rem">
        <ProgressSpinner />
      </div>
    );
  }

  if (!serviceOrder) {
    return (
      <div className="p-4 text-center text-600">
        <i className="pi pi-exclamation-circle text-4xl mb-3 block" />
        <p>Orden de trabajo no encontrada.</p>
        <Button
          label="Volver al listado"
          icon="pi pi-arrow-left"
          onClick={handleBack}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-3"
    >
      <Toast ref={toast} />

      {/* Breadcrumb + Header — hidden in embedded/modal mode */}
      {!embedded && (
        <>
          <BreadCrumb
            model={breadcrumbItems}
            home={breadcrumbHome}
            className="mb-3 border-none p-0 bg-transparent"
          />
          <div className="card mb-3">
            <div className="flex flex-wrap justify-content-between align-items-start gap-3">
              <div className="flex align-items-start gap-2">
                <Button
                  icon="pi pi-arrow-left"
                  text
                  rounded
                  onClick={handleBack}
                  tooltip="Volver"
                  tooltipOptions={{ position: "right" }}
                />
                <div>
                  <div className="flex align-items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-900 m-0">
                      {serviceOrder.folio}
                    </h2>
                    <ServiceOrderStatusBadge status={serviceOrder.status} />
                  </div>
                  <div className="flex flex-wrap gap-3 text-600 text-sm">
                    {serviceOrder.customer && (
                      <span>
                        <i className="pi pi-user mr-1" />
                        {serviceOrder.customer.name}
                      </span>
                    )}
                    {serviceOrder.vehiclePlate && (
                      <span>
                        <i className="pi pi-car mr-1" />
                        {serviceOrder.vehiclePlate}
                        {serviceOrder.vehicleDesc && ` — ${serviceOrder.vehicleDesc}`}
                      </span>
                    )}
                    {serviceOrder.estimatedDelivery && (
                      <span>
                        <i className="pi pi-calendar mr-1" />
                        Prometido:{" "}
                        {new Date(serviceOrder.estimatedDelivery).toLocaleDateString(
                          "es-MX"
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  label="Actualizar"
                  icon="pi pi-refresh"
                  outlined
                  size="small"
                  onClick={loadServiceOrder}
                />
                <Button
                  label="Editar"
                  icon="pi pi-pencil"
                  size="small"
                  onClick={() =>
                    router.push(
                      `/empresa/workshop/service-orders?edit=${serviceOrderId}`
                    )
                  }
                />
              </div>
            </div>
          </div>
        </>
      )}


      {/* TabView */}
      <div className="card">
        <TabView
          activeIndex={activeTab}
          onTabChange={(e) => setActiveTab(e.index)}
        >
          <TabPanel header="Resumen" leftIcon="pi pi-info-circle mr-2">
            <ServiceOrderSummaryTab serviceOrder={serviceOrder} />
          </TabPanel>

          <TabPanel header="Diagnósticos" leftIcon="pi pi-search-plus mr-2">
            <React.Suspense fallback={<ProgressSpinner />}>
              {/* @ts-ignore - serviceOrderId filter prop added via embedded mode */}
              <DiagnosisList serviceOrderId={serviceOrderId} embedded />
            </React.Suspense>
          </TabPanel>

          <TabPanel header="Materiales" leftIcon="pi pi-box mr-2">
            <React.Suspense fallback={<ProgressSpinner />}>
              {/* @ts-ignore */}
              <MaterialList serviceOrderId={serviceOrderId} embedded />
            </React.Suspense>
          </TabPanel>

          <TabPanel header="Adicionales" leftIcon="pi pi-plus-circle mr-2">
            <React.Suspense fallback={<ProgressSpinner />}>
              {/* @ts-ignore */}
              <AdditionalList serviceOrderId={serviceOrderId} embedded />
            </React.Suspense>
          </TabPanel>

          <TabPanel header="Tiempos" leftIcon="pi pi-stopwatch mr-2">
            <React.Suspense fallback={<ProgressSpinner />}>
              {/* @ts-ignore */}
              <LaborTimeList serviceOrderId={serviceOrderId} embedded />
            </React.Suspense>
          </TabPanel>

          <TabPanel header="Calidad" leftIcon="pi pi-check-square mr-2">
            <React.Suspense fallback={<ProgressSpinner />}>
              {/* @ts-ignore */}
              <QualityCheckList serviceOrderId={serviceOrderId} embedded />
            </React.Suspense>
          </TabPanel>

          <TabPanel header="Garita" leftIcon="pi pi-shield mr-2">
            <React.Suspense fallback={<ProgressSpinner />}>
              {/* @ts-ignore */}
              <GaritaList serviceOrderId={serviceOrderId} embedded />
            </React.Suspense>
          </TabPanel>

          <TabPanel header="T.O.T." leftIcon="pi pi-send mr-2">
            <React.Suspense fallback={<ProgressSpinner />}>
              {/* @ts-ignore */}
              <TOTList serviceOrderId={serviceOrderId} embedded />
            </React.Suspense>
          </TabPanel>

          <TabPanel header="Adjuntos" leftIcon="pi pi-paperclip mr-2">
            <AttachmentPanel
              entityType="SERVICE_ORDER"
              entityId={serviceOrderId}
            />
          </TabPanel>

          <TabPanel header="Auditoría" leftIcon="pi pi-history mr-2">
            <AuditLogPanel
              entityType="SERVICE_ORDER"
              entityId={serviceOrderId}
            />
          </TabPanel>

          {/* FASE 5: Cotización y Facturación integradas con CRM/Sales */}
          <TabPanel header="Cotización" leftIcon="pi pi-file-o mr-2">
            {serviceOrder && (
              <QuotationTab
                serviceOrder={serviceOrder}
                onRefresh={loadServiceOrder}
              />
            )}
          </TabPanel>

          <TabPanel header="Facturación" leftIcon="pi pi-dollar mr-2">
            {serviceOrder && (
              <BillingTab
                serviceOrder={serviceOrder}
                onRefresh={loadServiceOrder}
              />
            )}
          </TabPanel>
        </TabView>
      </div>
    </motion.div>
  );
}
