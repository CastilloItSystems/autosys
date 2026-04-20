"use client";

import React from "react";
import QuickActions from "@/components/common/QuickActions";
import type { QuickAction } from "@/components/common/QuickActions";
import WorkshopDashboard from "@/components/workshop/dashboard/WorkshopDashboard";

const WORKSHOP_ACTIONS: QuickAction[] = [
  { label: "Citas", icon: "pi pi-calendar", to: "/empresa/workshop/appointments", color: "teal", description: "Agenda del taller" },
  { label: "Recepciones", icon: "pi pi-inbox", to: "/empresa/workshop/receptions", color: "blue", description: "Ingreso de vehículos" },
  { label: "Órdenes de Trabajo", icon: "pi pi-file-edit", to: "/empresa/workshop/service-orders", color: "orange", description: "Gestión de OTs" },
  { label: "Diagnósticos", icon: "pi pi-search", to: "/empresa/workshop/diagnoses", color: "purple", description: "Evaluaciones técnicas" },
  { label: "Control de Calidad", icon: "pi pi-check-square", to: "/empresa/workshop/quality-checks", color: "green", description: "Revisiones" },
  { label: "Entregas", icon: "pi pi-sign-out", to: "/empresa/workshop/deliveries", color: "green", description: "Vehículos listos" },
  { label: "Planificación", icon: "pi pi-th-large", to: "/empresa/workshop/bays", color: "indigo", description: "Bahías y técnicos" },
  { label: "Presupuestos", icon: "pi pi-calculator", to: "/empresa/workshop/quotations", color: "cyan", description: "Cotizaciones taller" },
  { label: "Facturación", icon: "pi pi-file", to: "/empresa/workshop/billing", color: "blue", description: "Cobros taller" },
  { label: "Garantías", icon: "pi pi-shield", to: "/empresa/workshop/warranties", color: "red", description: "Seguimiento" },
  { label: "Historial Vehículo", icon: "pi pi-history", to: "/empresa/workshop/vehicle-history", color: "yellow", description: "Por unidad" },
  { label: "Reportes", icon: "pi pi-chart-bar", to: "/empresa/workshop/reports", color: "bluegray", description: "Estadísticas" },
];

export default function WorkshopPage() {
  return (
    <div className="flex flex-column gap-4">
      <QuickActions actions={WORKSHOP_ACTIONS} icon="pi pi-wrench" />
      <WorkshopDashboard />
    </div>
  );
}
