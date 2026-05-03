"use client";

import QuickActions from "@/components/common/QuickActions";
import type { QuickAction } from "@/components/common/QuickActions";
import { DealerDashboard } from "@/modules/concesionario/dashboard";

const DEALER_ACTIONS: QuickAction[] = [
  { label: "Vehículos", icon: "pi pi-car", to: "/empresa/concesionario/vehicles", color: "blue", description: "Inventario" },
  { label: "Reservas", icon: "pi pi-calendar", to: "/empresa/concesionario/reservations", color: "purple", description: "Apartados" },
  { label: "Cotizaciones", icon: "pi pi-file", to: "/empresa/concesionario/quotes", color: "green", description: "Propuestas" },
  { label: "Pruebas de Manejo", icon: "pi pi-flag", to: "/empresa/concesionario/test-drives", color: "teal", description: "Test drives" },
  { label: "Retomas", icon: "pi pi-refresh", to: "/empresa/concesionario/trade-ins", color: "orange", description: "Avalúos comerciales" },
  { label: "Financiamientos", icon: "pi pi-credit-card", to: "/empresa/concesionario/financing", color: "yellow", description: "Créditos" },
  { label: "Entregas", icon: "pi pi-box", to: "/empresa/concesionario/deliveries", color: "red", description: "Entrega de unidades" },
  { label: "After-Sales", icon: "pi pi-wrench", to: "/empresa/concesionario/after-sales", color: "bluegray", description: "Postventa" },
  { label: "Documentos", icon: "pi pi-folder", to: "/empresa/concesionario/documents", color: "indigo", description: "Contratos y actas" },
  { label: "Reportes", icon: "pi pi-chart-bar", to: "/empresa/concesionario/reports", color: "gray", description: "Estadísticas" },
];

export default function ConcesionarioPage() {
  return (
    <div className="flex flex-column gap-4">
      <QuickActions actions={DEALER_ACTIONS} icon="pi pi-car" />
      <DealerDashboard />
    </div>
  );
}
