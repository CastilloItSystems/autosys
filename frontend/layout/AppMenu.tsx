"use client";

import AppSubMenu from "./AppSubMenu";
import type { MenuModel } from "@/types";
import { useMemo } from "react";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { filterMenuByPermissions } from "@/lib/menuPermissions";

const AppMenu = () => {
  const { canAccessGate } = useUserPermissions();

  const model: MenuModel[] = useMemo(() => [
    {
      label: "Dashboards",
      icon: "pi pi-home",
      items: [
        {
          label: "Empresas",
          icon: "pi pi-fw pi-home",
          to: "/",
        },
        {
          label: "Finanzas",
          icon: "pi pi-fw pi-image",
          to: "/dashboard-sales",
        },
      ],
    },

    {
      label: "Gestión",
      icon: "pi pi-fw pi-cog",
      items: [
        {
          label: "Empresas",
          icon: "pi pi-fw pi-building",
          to: "/empresas",
        },
        {
          label: "Usuarios",
          icon: "pi pi-fw pi-users",
          to: "/users",
        },
        {
          label: "Respaldos",
          icon: "pi pi-fw pi-database",
          to: "/respaldos",
        },
      ],
    },

    {
      label: "Taller",
      icon: "pi pi-fw pi-wrench",
      items: [
        {
          label: "Dashboard Operativo",
          icon: "pi pi-fw pi-chart-bar",
          to: "/empresa/workshop",
        },
        {
          label: "Citas",
          icon: "pi pi-fw pi-calendar",
          to: "/empresa/workshop/appointments",
        },
        {
          label: "Control de Garita",
          icon: "pi pi-fw pi-shield",
          to: "/empresa/workshop/garita",
        },
        {
          label: "Recepciones",
          icon: "pi pi-fw pi-inbox",
          to: "/empresa/workshop/receptions",
        },
        {
          label: "Diagnósticos",
          icon: "pi pi-fw pi-search",
          to: "/empresa/workshop/diagnoses",
        },
        {
          label: "Cotizaciones",
          icon: "pi pi-fw pi-file",
          to: "/empresa/workshop/quotations",
        },
        {
          label: "Órdenes de Servicio",
          icon: "pi pi-fw pi-list",
          to: "/empresa/workshop/service-orders",
        },
        {
          label: "Planificación",
          icon: "pi pi-fw pi-th-large",
          to: "/empresa/workshop/planning",
        },
        {
          label: "Control de Tiempos",
          icon: "pi pi-fw pi-clock",
          to: "/empresa/workshop/labor-times",
        },
        {
          label: "Repuestos OS",
          icon: "pi pi-fw pi-box",
          to: "/empresa/workshop/materials",
        },
        {
          label: "Adicionales",
          icon: "pi pi-fw pi-plus-circle",
          to: "/empresa/workshop/additionals",
        },
        {
          label: "Servicios Externos (TOT)",
          icon: "pi pi-fw pi-external-link",
          to: "/empresa/workshop/tot",
        },
        {
          label: "Control de Calidad",
          icon: "pi pi-fw pi-check-square",
          to: "/empresa/workshop/quality-checks",
        },
        {
          label: "Escaneo Post-Reparación",
          icon: "pi pi-fw pi-bolt",
          to: "/empresa/workshop/post-repair-scans",
        },
        {
          label: "Pruebas de Carretera",
          icon: "pi pi-fw pi-car",
          to: "/empresa/workshop/road-tests",
        },
        {
          label: "Entregas",
          icon: "pi pi-fw pi-send",
          to: "/empresa/workshop/deliveries",
        },
        {
          label: "Garantías",
          icon: "pi pi-fw pi-shield",
          to: "/empresa/workshop/warranties",
        },
        {
          label: "Retrabajos",
          icon: "pi pi-fw pi-replay",
          to: "/empresa/workshop/reworks",
        },
        {
          label: "Historial Vehicular",
          icon: "pi pi-fw pi-history",
          to: "/empresa/workshop/vehicle-history",
        },
        {
          label: "Facturación Taller",
          icon: "pi pi-fw pi-dollar",
          to: "/empresa/workshop/billing",
        },
        {
          label: "Reportes",
          icon: "pi pi-fw pi-chart-line",
          to: "/empresa/workshop/reports",
        },
      ],
    },

    {
      label: "Taller — Configuración",
      icon: "pi pi-fw pi-sliders-h",
      items: [
        {
          label: "Tipos de Servicio",
          icon: "pi pi-fw pi-tag",
          to: "/empresa/workshop/service-types",
        },
        {
          label: "Motivos de Ingreso",
          icon: "pi pi-fw pi-bookmark",
          to: "/empresa/workshop/ingress-motives",
        },
        {
          label: "Bahías",
          icon: "pi pi-fw pi-th-large",
          to: "/empresa/workshop/bays",
        },
        {
          label: "Operaciones",
          icon: "pi pi-fw pi-cog",
          to: "/empresa/workshop/operations",
        },
        {
          label: "Especialidades Técnicas",
          icon: "pi pi-fw pi-user",
          to: "/empresa/workshop/technician-specialties",
        },
        {
          label: "Turnos",
          icon: "pi pi-fw pi-clock",
          to: "/empresa/workshop/shifts",
        },
        {
          label: "Checklists",
          icon: "pi pi-fw pi-list",
          to: "/empresa/workshop/checklists",
        },
      ],
    },
  ], []);

  const filteredModel = useMemo(
    () => filterMenuByPermissions(model, canAccessGate),
    [canAccessGate, model],
  );

  return <AppSubMenu model={filteredModel} />;
};

export default AppMenu;
