"use client";
import React from "react";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import {
  Customer,
  CUSTOMER_TYPE_CONFIG,
} from "@/libs/interfaces/sales/customer.interface";

interface CustomerDetailDialogProps {
  visible: boolean;
  customer: Customer | null;
  onHide: () => void;
}

const Field = ({
  label,
  value,
  icon,
  full,
}: {
  label: string;
  value: React.ReactNode;
  icon?: string;
  full?: boolean;
}) => (
  <div className={`${full ? "col-12" : "col-12 md:col-6"} mb-3`}>
    <div className="surface-50 border-round p-3 h-full">
      <div className="flex align-items-center gap-2 mb-1">
        {icon && <i className={`${icon} text-primary text-sm`} />}
        <span className="text-xs text-500 font-medium uppercase">{label}</span>
      </div>
      <span className="text-base font-semibold text-900">{value ?? "-"}</span>
    </div>
  </div>
);

export default function CustomerDetailDialog({
  visible,
  customer,
  onHide,
}: CustomerDetailDialogProps) {
  if (!customer) return null;

  const typeCfg = CUSTOMER_TYPE_CONFIG[customer.type as keyof typeof CUSTOMER_TYPE_CONFIG];

  return (
    <Dialog
      visible={visible}
      style={{ width: "80vw" }}
      maximizable
      header={
        <div className="mb-2 text-center md:text-left">
          <div className="border-bottom-2 border-primary pb-2">
            <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
              <i className="pi pi-info-circle mr-3 text-primary text-3xl" />
              Detalles del Cliente
            </h2>
          </div>
        </div>
      }
      modal
      onHide={onHide}
    >
      <div className="grid m-0">
        {/* ── Sidebar ── */}
        <div
          className="col-12 md:col-3 flex flex-column gap-3 p-4"
          style={{ borderRight: "1px solid var(--surface-border)", background: "var(--surface-50)" }}
        >
          {/* Avatar + identidad */}
          <div className="flex flex-column align-items-center gap-3 surface-card border-round border-1 border-surface-border p-4">
            <div
              className="flex align-items-center justify-content-center border-round-xl"
              style={{
                width: "72px",
                height: "72px",
                background: "var(--primary-100)",
                color: "var(--primary-700)",
              }}
            >
              <i className={`text-4xl ${typeCfg.icon}`} />
            </div>
            <div className="text-center">
              <div className="font-bold text-900 text-lg">{customer.name}</div>
              <div className="text-sm text-500 font-medium mt-1">
                Código: <strong>{customer.code}</strong>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap justify-content-center">
              <Tag
                value={customer.isActive ? "Activo" : "Inactivo"}
                severity={customer.isActive ? "success" : "danger"}
                rounded
              />
              <Tag
                value={typeCfg.label}
                severity={typeCfg.severity}
                icon={typeCfg.icon}
                className="text-xs"
              />
            </div>
          </div>

          {/* Datos fiscales / comerciales rápidos */}
          <div className="surface-card border-round border-1 border-surface-border p-3 flex flex-column gap-2">
            {customer.taxId && (
              <div className="text-sm">
                <i className="pi pi-id-card text-primary mr-2" />
                <span className="text-500 mr-1">RIF/NIT:</span>
                <strong>{customer.taxId}</strong>
              </div>
            )}
            <div className="text-sm">
              <i className="pi pi-list text-primary mr-2" />
              <span className="text-500 mr-1">Lista de precio:</span>
              <strong>{customer.priceList}</strong>
            </div>
            {customer.creditDays > 0 && (
              <div className="text-sm">
                <i className="pi pi-calendar text-primary mr-2" />
                <span className="text-500 mr-1">Crédito:</span>
                <strong>{customer.creditDays} días</strong>
              </div>
            )}
            {customer.creditLimit > 0 && (
              <div className="text-sm">
                <i className="pi pi-wallet text-primary mr-2" />
                <span className="text-500 mr-1">Límite:</span>
                <strong>{customer.creditLimit.toLocaleString()}</strong>
              </div>
            )}
            {customer.defaultDiscount > 0 && (
              <div className="text-sm">
                <i className="pi pi-percentage text-primary mr-2" />
                <span className="text-500 mr-1">Descuento:</span>
                <strong>{customer.defaultDiscount}%</strong>
              </div>
            )}
            {customer.isSpecialTaxpayer && (
              <Tag value="Contribuyente Especial" severity="warning" className="text-xs w-fit mt-1" />
            )}
          </div>

          {/* Contacto rápido */}
          {(customer.email || customer.phone || customer.mobile) && (
            <div className="surface-card border-round border-1 border-surface-border p-3 flex flex-column gap-2">
              <span className="text-xs text-500 uppercase font-medium block mb-1">Contacto rápido</span>
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="text-sm text-primary no-underline flex align-items-center gap-2">
                  <i className="pi pi-envelope" />
                  {customer.email}
                </a>
              )}
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="text-sm text-primary no-underline flex align-items-center gap-2">
                  <i className="pi pi-phone" />
                  {customer.phone}
                </a>
              )}
              {customer.mobile && (
                <a href={`tel:${customer.mobile}`} className="text-sm text-primary no-underline flex align-items-center gap-2">
                  <i className="pi pi-mobile" />
                  {customer.mobile}
                </a>
              )}
            </div>
          )}

          {/* Fecha de registro */}
          <div className="text-xs text-500 text-center">
            <i className="pi pi-clock mr-1" />
            Registrado:{" "}
            {new Date(customer.createdAt).toLocaleDateString("es-VE", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>

        {/* ── Detalle ── */}
        <div className="col-12 md:col-9 p-4">
          {/* Información general */}
          <div className="flex align-items-center gap-2 mb-3">
            <i className="pi pi-user text-primary" />
            <span className="font-semibold text-900">Información General</span>
          </div>
          <div className="grid">
            <Field label="Nombre" value={customer.name} icon="pi pi-tag" />
            <Field label="Código" value={customer.code} icon="pi pi-hashtag" />
            <Field
              label="Tipo"
              value={
                <Tag value={typeCfg.label} severity={typeCfg.severity} icon={typeCfg.icon} className="text-xs" />
              }
              icon="pi pi-users"
            />
            <Field label="RIF / NIT" value={customer.taxId} icon="pi pi-id-card" />
            {customer.contactPerson && (
              <Field label="Persona de Contacto" value={customer.contactPerson} icon="pi pi-user" />
            )}
          </div>

          <Divider />

          {/* Contacto */}
          <div className="flex align-items-center gap-2 mb-3">
            <i className="pi pi-address-book text-primary" />
            <span className="font-semibold text-900">Contacto</span>
          </div>
          <div className="grid">
            <Field label="Correo" value={customer.email} icon="pi pi-envelope" />
            <Field label="Teléfono" value={customer.phone} icon="pi pi-phone" />
            <Field label="Móvil" value={customer.mobile} icon="pi pi-mobile" />
            {customer.website && (
              <div className="col-12 md:col-6 mb-3">
                <div className="surface-50 border-round p-3 h-full">
                  <div className="flex align-items-center gap-2 mb-1">
                    <i className="pi pi-globe text-primary text-sm" />
                    <span className="text-xs text-500 font-medium uppercase">Sitio Web</span>
                  </div>
                  <a
                    href={customer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-semibold text-primary no-underline"
                  >
                    {customer.website}
                  </a>
                </div>
              </div>
            )}
            {customer.address && (
              <Field label="Dirección" value={customer.address} icon="pi pi-map-marker" full />
            )}
            {customer.shippingAddress && (
              <Field label="Dirección de Envío" value={customer.shippingAddress} icon="pi pi-truck" full />
            )}
            {customer.billingAddress && (
              <Field label="Dirección de Facturación" value={customer.billingAddress} icon="pi pi-file" full />
            )}
          </div>

          <Divider />

          {/* Condiciones comerciales */}
          <div className="flex align-items-center gap-2 mb-3">
            <i className="pi pi-briefcase text-primary" />
            <span className="font-semibold text-900">Condiciones Comerciales</span>
          </div>
          <div className="grid">
            <Field label="Lista de Precio" value={`Lista ${customer.priceList}`} icon="pi pi-list" />
            <Field
              label="Días de Crédito"
              value={customer.creditDays > 0 ? `${customer.creditDays} días` : "Sin crédito"}
              icon="pi pi-calendar"
            />
            <Field
              label="Límite de Crédito"
              value={customer.creditLimit > 0 ? customer.creditLimit.toLocaleString() : "Sin límite"}
              icon="pi pi-wallet"
            />
            <Field
              label="Descuento Predeterminado"
              value={customer.defaultDiscount > 0 ? `${customer.defaultDiscount}%` : "Sin descuento"}
              icon="pi pi-percentage"
            />
            <div className="col-12 md:col-6 mb-3">
              <div className="surface-50 border-round p-3 h-full">
                <div className="flex align-items-center gap-2 mb-1">
                  <i className="pi pi-star text-primary text-sm" />
                  <span className="text-xs text-500 font-medium uppercase">Contribuyente Especial</span>
                </div>
                <Tag
                  value={customer.isSpecialTaxpayer ? "Sí" : "No"}
                  severity={customer.isSpecialTaxpayer ? "warning" : "secondary"}
                  rounded
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
