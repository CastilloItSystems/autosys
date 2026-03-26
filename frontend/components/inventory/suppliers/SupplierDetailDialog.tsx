"use client";
import React from "react";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { Supplier } from "@/app/api/inventory/supplierService";

interface SupplierDetailDialogProps {
  visible: boolean;
  supplier: Supplier | null;
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

export default function SupplierDetailDialog({
  visible,
  supplier,
  onHide,
}: SupplierDetailDialogProps) {
  if (!supplier) return null;

  return (
    <Dialog
      visible={visible}
      style={{ width: "75vw" }}
      breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
      maximizable
      header={
        <div className="mb-2 text-center md:text-left">
          <div className="border-bottom-2 border-primary pb-2">
            <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
              <i className="pi pi-info-circle mr-3 text-primary text-3xl" />
              Detalles del Proveedor
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
          {/* Avatar */}
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
              <i
                className={`text-4xl ${supplier.type === "COMPANY" ? "pi pi-building" : "pi pi-user"}`}
              />
            </div>
            <div className="text-center">
              <div className="font-bold text-900 text-lg">{supplier.name}</div>
              <div className="text-sm text-500 font-medium mt-1">
                Código: <strong>{supplier.code}</strong>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap justify-content-center">
              <Tag
                value={supplier.isActive ? "Activo" : "Inactivo"}
                severity={supplier.isActive ? "success" : "secondary"}
                rounded
              />
              <Tag
                value={supplier.type === "COMPANY" ? "Empresa" : "Individual"}
                severity={supplier.type === "COMPANY" ? "success" : "info"}
                icon={supplier.type === "COMPANY" ? "pi pi-building" : "pi pi-user"}
                className="text-xs"
              />
            </div>
          </div>

          {/* Datos fiscales rápidos */}
          <div className="surface-card border-round border-1 border-surface-border p-3 flex flex-column gap-2">
            {supplier.taxId && (
              <div className="text-sm">
                <i className="pi pi-id-card text-primary mr-2" />
                <span className="text-500 mr-1">RIF/NIT:</span>
                <strong>{supplier.taxId}</strong>
              </div>
            )}
            {supplier.currency && (
              <div className="text-sm">
                <i className="pi pi-dollar text-primary mr-2" />
                <span className="text-500 mr-1">Moneda:</span>
                <strong>{supplier.currency}</strong>
              </div>
            )}
            {supplier.creditDays > 0 && (
              <div className="text-sm">
                <i className="pi pi-calendar text-primary mr-2" />
                <span className="text-500 mr-1">Crédito:</span>
                <strong>{supplier.creditDays} días</strong>
              </div>
            )}
            {supplier.isSpecialTaxpayer && (
              <Tag value="Contribuyente Especial" severity="warning" className="text-xs w-fit mt-1" />
            )}
          </div>

          {/* Contacto rápido */}
          {(supplier.email || supplier.phone || supplier.mobile) && (
            <div className="surface-card border-round border-1 border-surface-border p-3 flex flex-column gap-2">
              <span className="text-xs text-500 uppercase font-medium block mb-1">Contacto rápido</span>
              {supplier.email && (
                <a href={`mailto:${supplier.email}`} className="text-sm text-primary no-underline flex align-items-center gap-2">
                  <i className="pi pi-envelope" />
                  {supplier.email}
                </a>
              )}
              {supplier.phone && (
                <a href={`tel:${supplier.phone}`} className="text-sm text-primary no-underline flex align-items-center gap-2">
                  <i className="pi pi-phone" />
                  {supplier.phone}
                </a>
              )}
              {supplier.mobile && (
                <a href={`tel:${supplier.mobile}`} className="text-sm text-primary no-underline flex align-items-center gap-2">
                  <i className="pi pi-mobile" />
                  {supplier.mobile}
                </a>
              )}
            </div>
          )}
        </div>

        {/* ── Detalle ── */}
        <div className="col-12 md:col-9 p-4">
          {/* Información general */}
          <div className="flex align-items-center gap-2 mb-3">
            <i className="pi pi-building text-primary" />
            <span className="font-semibold text-900">Información General</span>
          </div>
          <div className="grid">
            <Field label="Nombre" value={supplier.name} icon="pi pi-tag" />
            <Field label="Código" value={supplier.code} icon="pi pi-hashtag" />
            <Field label="Tipo" value={supplier.type === "COMPANY" ? "Empresa" : "Individual"} icon="pi pi-users" />
            <Field label="RIF / NIT" value={supplier.taxId} icon="pi pi-id-card" />
          </div>

          <Divider />

          {/* Contacto */}
          <div className="flex align-items-center gap-2 mb-3">
            <i className="pi pi-address-book text-primary" />
            <span className="font-semibold text-900">Contacto</span>
          </div>
          <div className="grid">
            <Field label="Persona de Contacto" value={supplier.contactName} icon="pi pi-user" />
            <Field label="Correo" value={supplier.email} icon="pi pi-envelope" />
            <Field label="Teléfono" value={supplier.phone} icon="pi pi-phone" />
            <Field label="Móvil" value={supplier.mobile} icon="pi pi-mobile" />
            {supplier.website && (
              <div className="col-12 md:col-6 mb-3">
                <div className="surface-50 border-round p-3 h-full">
                  <div className="flex align-items-center gap-2 mb-1">
                    <i className="pi pi-globe text-primary text-sm" />
                    <span className="text-xs text-500 font-medium uppercase">Sitio Web</span>
                  </div>
                  <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-primary no-underline">
                    {supplier.website}
                  </a>
                </div>
              </div>
            )}
            {supplier.address && (
              <Field label="Dirección" value={supplier.address} icon="pi pi-map-marker" full />
            )}
          </div>

          <Divider />

          {/* Condiciones comerciales */}
          <div className="flex align-items-center gap-2 mb-3">
            <i className="pi pi-briefcase text-primary" />
            <span className="font-semibold text-900">Condiciones Comerciales</span>
          </div>
          <div className="grid">
            <Field label="Moneda" value={supplier.currency} icon="pi pi-dollar" />
            <Field label="Días de Crédito" value={supplier.creditDays > 0 ? `${supplier.creditDays} días` : "Sin crédito"} icon="pi pi-calendar" />
            <div className="col-12 md:col-6 mb-3">
              <div className="surface-50 border-round p-3 h-full">
                <div className="flex align-items-center gap-2 mb-1">
                  <i className="pi pi-star text-primary text-sm" />
                  <span className="text-xs text-500 font-medium uppercase">Contribuyente Especial</span>
                </div>
                <Tag
                  value={supplier.isSpecialTaxpayer ? "Sí" : "No"}
                  severity={supplier.isSpecialTaxpayer ? "warning" : "secondary"}
                  rounded
                />
              </div>
            </div>
          </div>

          {supplier.notes && (
            <>
              <Divider />
              <div className="flex align-items-center gap-2 mb-3">
                <i className="pi pi-file-edit text-primary" />
                <span className="font-semibold text-900">Notas</span>
              </div>
              <div className="surface-50 border-round p-3">
                <p className="m-0 text-700 line-height-3">{supplier.notes}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}
