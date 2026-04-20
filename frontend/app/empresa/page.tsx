"use client";

import { Divider } from "primereact/divider";
import QuickActions from "@/components/common/QuickActions";
import type { QuickAction } from "@/components/common/QuickActions";

// ── Secciones por módulo ───────────────────────────────────────────────────────

const INVENTARIO: QuickAction[] = [
  { label: "Artículos", icon: "pi pi-box", to: "/empresa/inventario/items", color: "purple", description: "Catálogo maestro" },
  { label: "Stock", icon: "pi pi-chart-bar", to: "/empresa/inventario/stock", color: "blue", description: "Disponibilidad" },
  { label: "Órdenes de Venta", icon: "pi pi-money-bill", to: "/empresa/inventario/ordenes-venta", color: "green", description: "Gestión de ventas" },
  { label: "Facturas", icon: "pi pi-file", to: "/empresa/inventario/invoice", color: "blue", description: "Cuentas por cobrar" },
  { label: "Órdenes de Compra", icon: "pi pi-shopping-cart", to: "/empresa/inventario/ordenes-compra", color: "cyan", description: "Abastecimiento" },
  { label: "Notas de Entrada", icon: "pi pi-inbox", to: "/empresa/inventario/notas-entrada", color: "orange", description: "Recepción" },
  { label: "Notas de Salida", icon: "pi pi-external-link", to: "/empresa/inventario/notas-salida", color: "pink", description: "Despacho" },
  { label: "Movimientos", icon: "pi pi-history", to: "/empresa/inventario/movimientos", color: "yellow", description: "Historial y Kardex" },
];

const TALLER: QuickAction[] = [
  { label: "Citas", icon: "pi pi-calendar", to: "/empresa/workshop/appointments", color: "teal", description: "Agenda del taller" },
  { label: "Recepciones", icon: "pi pi-inbox", to: "/empresa/workshop/receptions", color: "blue", description: "Ingreso de vehículos" },
  { label: "Órdenes de Trabajo", icon: "pi pi-file-edit", to: "/empresa/workshop/service-orders", color: "orange", description: "Gestión de OTs" },
  { label: "Diagnósticos", icon: "pi pi-search", to: "/empresa/workshop/diagnoses", color: "purple", description: "Evaluaciones técnicas" },
  { label: "Planificación", icon: "pi pi-th-large", to: "/empresa/workshop/bays", color: "indigo", description: "Bahías y técnicos" },
  { label: "Entregas", icon: "pi pi-sign-out", to: "/empresa/workshop/deliveries", color: "green", description: "Vehículos listos" },
  { label: "Presupuestos", icon: "pi pi-calculator", to: "/empresa/workshop/quotations", color: "cyan", description: "Cotizaciones taller" },
  { label: "Garantías", icon: "pi pi-shield", to: "/empresa/workshop/warranties", color: "red", description: "Seguimiento" },
];

const CRM: QuickAction[] = [
  { label: "Leads", icon: "pi pi-chart-line", to: "/empresa/crm/leads", color: "blue", description: "Prospectos" },
  { label: "Cotizaciones", icon: "pi pi-file", to: "/empresa/crm/cotizaciones", color: "green", description: "Pipeline comercial" },
  { label: "Casos", icon: "pi pi-folder-open", to: "/empresa/crm/casos", color: "orange", description: "Soporte y servicio" },
  { label: "Actividades", icon: "pi pi-check-square", to: "/empresa/crm/actividades", color: "teal", description: "Tareas y seguimiento" },
  { label: "Clientes", icon: "pi pi-users", to: "/empresa/crm/clientes", color: "purple", description: "Directorio CRM" },
  { label: "Oportunidades", icon: "pi pi-sitemap", to: "/empresa/crm/oportunidades", color: "cyan", description: "Negociaciones" },
  { label: "Campañas", icon: "pi pi-envelope", to: "/empresa/crm/campanas", color: "pink", description: "Marketing" },
  { label: "Interacciones", icon: "pi pi-comments", to: "/empresa/crm/interacciones", color: "yellow", description: "Historial contacto" },
];

const CONCESIONARIO: QuickAction[] = [
  { label: "Vehículos", icon: "pi pi-car", to: "/empresa/concesionario/vehicles", color: "blue", description: "Inventario" },
  { label: "Reservas", icon: "pi pi-calendar", to: "/empresa/concesionario/reservations", color: "purple", description: "Apartados" },
  { label: "Cotizaciones", icon: "pi pi-file", to: "/empresa/concesionario/quotes", color: "green", description: "Propuestas" },
  { label: "Pruebas de Manejo", icon: "pi pi-flag", to: "/empresa/concesionario/test-drives", color: "teal", description: "Test drives" },
  { label: "Retomas", icon: "pi pi-refresh", to: "/empresa/concesionario/trade-ins", color: "orange", description: "Avalúos" },
  { label: "Financiamientos", icon: "pi pi-credit-card", to: "/empresa/concesionario/financing", color: "yellow", description: "Créditos" },
  { label: "Entregas", icon: "pi pi-box", to: "/empresa/concesionario/deliveries", color: "red", description: "Entrega de unidades" },
  { label: "After-Sales", icon: "pi pi-wrench", to: "/empresa/concesionario/after-sales", color: "bluegray", description: "Postventa" },
];

const FINANZAS: QuickAction[] = [
  { label: "Tipos de Cambio", icon: "pi pi-money-bill", to: "/empresa/finance/tipos-cambio", color: "green", description: "Tasas vigentes" },
  { label: "Rep. Ventas", icon: "pi pi-chart-bar", to: "/empresa/ventas/reportes", color: "blue", description: "Estadísticas y KPIs" },
];

// ── Secciones ─────────────────────────────────────────────────────────────────

const SECTIONS = [
  { group: "Inventario", icon: "pi pi-box", color: "blue", actions: INVENTARIO },
  { group: "Taller", icon: "pi pi-wrench", color: "orange", actions: TALLER },
  { group: "CRM", icon: "pi pi-users", color: "purple", actions: CRM },
  { group: "Concesionario", icon: "pi pi-car", color: "teal", actions: CONCESIONARIO },
  { group: "Finanzas", icon: "pi pi-money-bill", color: "green", actions: FINANZAS },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function Dashboard() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-900 m-0">
          <i className="pi pi-home mr-2 text-primary" />
          Panel Principal
        </h2>
        <p className="text-500 text-sm m-0 mt-1">
          Acceso rápido a todos los módulos del sistema
        </p>
      </div>

      {SECTIONS.map((section, idx) => (
        <div key={section.group}>
          {idx > 0 && <Divider className="my-3" />}
          <div
            className="flex align-items-center gap-2 mb-3"
            style={{ borderLeft: `3px solid var(--${section.color}-500)`, paddingLeft: "0.75rem" }}
          >
            <i className={`${section.icon} text-${section.color}-500 text-lg`} />
            <span className="font-bold text-900 text-base">{section.group}</span>
          </div>
          <QuickActions actions={section.actions} />
        </div>
      ))}
    </div>
  );
}
