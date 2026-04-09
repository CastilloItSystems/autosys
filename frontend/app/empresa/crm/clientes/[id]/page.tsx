"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import customerCrmService from "@/app/api/crm/customerCrmService";
import {
  CustomerCrm,
  CUSTOMER_TYPE_CONFIG,
  CUSTOMER_SEGMENT_CONFIG,
} from "@/libs/interfaces/crm/customer.crm.interface";
import CustomerTimeline from "@/components/crm/customer/CustomerTimeline";
import CustomerVehiclePanel from "@/components/crm/customer/CustomerVehiclePanel";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useRef<Toast>(null);
  const [customer, setCustomer] = useState<CustomerCrm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    customerCrmService
      .getById(params.id)
      .then((res) => setCustomer(res.data))
      .catch(() =>
        toast.current?.show({ severity: "error", summary: "Error al cargar cliente" })
      )
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <ProgressSpinner style={{ width: "60px", height: "60px" }} />
      </div>
    );
  }

  if (!customer) return null;

  const typeCfg = CUSTOMER_TYPE_CONFIG[customer.type as keyof typeof CUSTOMER_TYPE_CONFIG];
  const segmentCfg = CUSTOMER_SEGMENT_CONFIG[customer.segment as keyof typeof CUSTOMER_SEGMENT_CONFIG];

  return (
    <>
      <Toast ref={toast} />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="p-3"
      >
        {/* Header */}
        <div className="flex align-items-start justify-content-between mb-4 flex-wrap gap-3">
          <div className="flex align-items-center gap-3">
            <Button
              icon="pi pi-arrow-left"
              text
              rounded
              severity="secondary"
              onClick={() => router.back()}
              tooltip="Volver"
            />
            <div>
              <div className="flex align-items-center gap-2">
                <h1 className="text-3xl font-bold text-900 m-0">{customer.name}</h1>
                {customer.isSpecialTaxpayer && (
                  <Tag value="Contribuyente Especial" severity="warning" className="text-xs" />
                )}
              </div>
              <div className="flex gap-2 mt-1 flex-wrap">
                <span className="text-500 text-sm">{customer.code}</span>
                {customer.taxId && (
                  <span className="text-500 text-sm">· {customer.taxId}</span>
                )}
                {typeCfg && (
                  <Tag value={typeCfg.label} severity={typeCfg.severity} icon={typeCfg.icon} className="text-xs" />
                )}
                {segmentCfg && (
                  <Tag value={segmentCfg.label} severity={segmentCfg.severity} icon={segmentCfg.icon} className="text-xs" />
                )}
                <Tag
                  value={customer.isActive ? "Activo" : "Inactivo"}
                  severity={customer.isActive ? "success" : "danger"}
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="flex gap-4 flex-wrap">
            {customer.phone && (
              <div className="flex align-items-center gap-1 text-sm text-600">
                <i className="pi pi-phone text-primary" />
                {customer.phone}
              </div>
            )}
            {customer.mobile && (
              <div className="flex align-items-center gap-1 text-sm text-600">
                <i className="pi pi-comments text-primary" />
                {customer.mobile}
              </div>
            )}
            {customer.email && (
              <div className="flex align-items-center gap-1 text-sm text-600">
                <i className="pi pi-envelope text-primary" />
                {customer.email}
              </div>
            )}
          </div>
        </div>

        {/* B2B credit summary */}
        {customer.type === "COMPANY" && customer.creditLimit != null && customer.creditLimit > 0 && (
          <div className="surface-50 border-round p-3 mb-4 flex gap-4 flex-wrap">
            <div className="flex align-items-center gap-2">
              <i className="pi pi-credit-card text-primary" />
              <span className="text-sm font-semibold">Límite de crédito:</span>
              <span className="text-sm">${Number(customer.creditLimit).toLocaleString()}</span>
            </div>
            <div className="flex align-items-center gap-2">
              <i className="pi pi-calendar text-primary" />
              <span className="text-sm font-semibold">Días de crédito:</span>
              <span className="text-sm">{customer.creditDays} días</span>
            </div>
            {customer.defaultDiscount > 0 && (
              <div className="flex align-items-center gap-2">
                <i className="pi pi-percentage text-primary" />
                <span className="text-sm font-semibold">Descuento por defecto:</span>
                <span className="text-sm">{customer.defaultDiscount}%</span>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <TabView>
          <TabPanel header="Vista 360°" leftIcon="pi pi-history mr-2">
            <CustomerTimeline customerId={customer.id} />
          </TabPanel>
          <TabPanel header="Vehículos" leftIcon="pi pi-car mr-2">
            <CustomerVehiclePanel customerId={customer.id} />
          </TabPanel>
          {customer.address && (
            <TabPanel header="Dirección" leftIcon="pi pi-map-marker mr-2">
              <div className="p-3">
                <h5 className="text-primary">Dirección Principal</h5>
                <p className="text-800">{customer.address}</p>
                {customer.shippingAddress && (
                  <>
                    <h5 className="text-primary mt-4">Dirección de Entrega</h5>
                    <p className="text-800">{customer.shippingAddress}</p>
                  </>
                )}
                {customer.billingAddress && (
                  <>
                    <h5 className="text-primary mt-4">Dirección de Facturación</h5>
                    <p className="text-800">{customer.billingAddress}</p>
                  </>
                )}
              </div>
            </TabPanel>
          )}
          {customer.notes && (
            <TabPanel header="Notas" leftIcon="pi pi-file-edit mr-2">
              <div className="p-3 surface-50 border-round">
                <p className="text-800 line-height-3">{customer.notes}</p>
              </div>
            </TabPanel>
          )}
        </TabView>
      </motion.div>
    </>
  );
}
