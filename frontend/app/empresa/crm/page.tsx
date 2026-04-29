"use client";

import QuickActions from "@/components/common/QuickActions";
import type { QuickAction } from "@/components/common/QuickActions";
import CrmDashboard from "@/modules/crm/dashboard/components/CrmDashboard";

const CRM_ACTIONS: QuickAction[] = [
  { label: "Leads", icon: "pi pi-chart-line", to: "/empresa/crm/leads", color: "blue", description: "Prospectos" },
  { label: "Cotizaciones", icon: "pi pi-file", to: "/empresa/crm/cotizaciones", color: "green", description: "Pipeline comercial" },
  { label: "Casos", icon: "pi pi-folder-open", to: "/empresa/crm/casos", color: "orange", description: "Soporte y servicio" },
  { label: "Actividades", icon: "pi pi-check-square", to: "/empresa/crm/actividades", color: "teal", description: "Tareas y seguimiento" },
  { label: "Clientes", icon: "pi pi-users", to: "/empresa/crm/clientes", color: "purple", description: "Directorio CRM" },
  { label: "Oportunidades", icon: "pi pi-sitemap", to: "/empresa/crm/oportunidades", color: "cyan", description: "Negociaciones" },
  { label: "Campañas", icon: "pi pi-envelope", to: "/empresa/crm/campanas", color: "pink", description: "Marketing" },
  { label: "Interacciones", icon: "pi pi-comments", to: "/empresa/crm/interacciones", color: "yellow", description: "Historial contacto" },
  { label: "Fidelización", icon: "pi pi-heart", to: "/empresa/crm/fidelizacion", color: "red", description: "Retención" },
];

export default function CrmPage() {
  return (
    <div className="flex flex-column gap-4">
      <QuickActions actions={CRM_ACTIONS} icon="pi pi-users" />
      <CrmDashboard />
    </div>
  );
}
