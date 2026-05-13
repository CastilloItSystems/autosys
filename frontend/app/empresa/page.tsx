"use client";

import { Divider } from "primereact/divider";
import QuickActions from "@/components/common/QuickActions";
import type { QuickAction } from "@/components/common/QuickActions";

type DashboardActionGroup = {
  title: string;
  icon: string;
  actions: QuickAction[];
};

type DashboardSection = {
  group: string;
  icon: string;
  color: string;
  description: string;
  actionGroups: DashboardActionGroup[];
};

const SECTIONS: DashboardSection[] = [
  {
    group: "Ventas",
    icon: "pi pi-shopping-cart",
    color: "green",
    description: "Operación comercial, cobros y reportes de ventas.",
    actionGroups: [
      {
        title: "Principales",
        icon: "pi pi-bolt",
        actions: [
          {
            label: "Dashboard",
            icon: "pi pi-th-large",
            to: "/empresa/ventas",
            color: "green",
            description: "Resumen comercial",
          },
          {
            label: "Clientes",
            icon: "pi pi-users",
            to: "/empresa/inventario/clientes",
            color: "blue",
            description: "Gestión de clientes",
          },
          {
            label: "Órdenes de Venta",
            icon: "pi pi-money-bill",
            to: "/empresa/inventario/ordenes-venta",
            color: "green",
            description: "Pedidos activos",
          },
          {
            label: "Pre-facturas",
            icon: "pi pi-file",
            to: "/empresa/inventario/pre-invoice",
            color: "orange",
            description: "Pendientes",
          },
          {
            label: "Pagos",
            icon: "pi pi-wallet",
            to: "/empresa/inventario/payment",
            color: "purple",
            description: "Registro de pagos",
          },
          {
            label: "Facturas",
            icon: "pi pi-file",
            to: "/empresa/inventario/invoice",
            color: "teal",
            description: "Facturas emitidas",
          },
          {
            label: "Notas de Crédito",
            icon: "pi pi-file-minus",
            to: "/empresa/inventario/notas-credito",
            color: "red",
            description: "Ajustes",
          },
        ],
      },
      {
        title: "Reportes",
        icon: "pi pi-chart-bar",
        actions: [
          {
            label: "Reportes Ventas",
            icon: "pi pi-chart-bar",
            to: "/empresa/ventas/reportes",
            color: "blue",
            description: "Indicadores",
          },
          {
            label: "Por Período",
            icon: "pi pi-chart-line",
            to: "/empresa/ventas/reportes/por-periodo",
            color: "blue",
            description: "Tendencias",
          },
          {
            label: "Por Cliente",
            icon: "pi pi-users",
            to: "/empresa/ventas/reportes/por-cliente",
            color: "indigo",
            description: "Ranking",
          },
          {
            label: "Por Producto",
            icon: "pi pi-box",
            to: "/empresa/ventas/reportes/por-producto",
            color: "purple",
            description: "Artículos",
          },
          {
            label: "Pipeline",
            icon: "pi pi-filter",
            to: "/empresa/ventas/reportes/pipeline-ordenes",
            color: "teal",
            description: "Órdenes",
          },
          {
            label: "Métodos de Pago",
            icon: "pi pi-credit-card",
            to: "/empresa/ventas/reportes/metodos-pago",
            color: "cyan",
            description: "Cobranza",
          },
          {
            label: "Prefacturas",
            icon: "pi pi-clock",
            to: "/empresa/ventas/reportes/prefacturas-pendientes",
            color: "orange",
            description: "Pendientes",
          },
        ],
      },
    ],
  },
  {
    group: "Compras",
    icon: "pi pi-wallet",
    color: "cyan",
    description: "Proveedores y abastecimiento.",
    actionGroups: [
      {
        title: "Principales",
        icon: "pi pi-shopping-cart",
        actions: [
          {
            label: "Dashboard",
            icon: "pi pi-th-large",
            to: "/empresa/compras",
            color: "cyan",
            description: "Resumen",
          },
          {
            label: "Proveedores",
            icon: "pi pi-truck",
            to: "/empresa/compras/proveedores",
            color: "teal",
            description: "Directorio",
          },
          {
            label: "Órdenes de Compra",
            icon: "pi pi-shopping-cart",
            to: "/empresa/compras/ordenes-compra",
            color: "cyan",
            description: "Abastecimiento",
          },
        ],
      },
      {
        title: "Reportes",
        icon: "pi pi-chart-bar",
        actions: [
          {
            label: "Rend. Proveedores",
            icon: "pi pi-star-fill",
            to: "/empresa/compras/reportes/rendimiento-proveedores",
            color: "teal",
            description: "Desempeño",
          },
        ],
      },
    ],
  },
  {
    group: "Inventario",
    icon: "pi pi-box",
    color: "blue",
    description: "Catálogo, stock, almacenes y analítica de inventario.",
    actionGroups: [
      {
        title: "Principales",
        icon: "pi pi-box",
        actions: [
          {
            label: "Dashboard",
            icon: "pi pi-chart-line",
            to: "/empresa/inventario/dashboard",
            color: "blue",
            description: "Resumen",
          },
          {
            label: "Artículos",
            icon: "pi pi-box",
            to: "/empresa/inventario/items",
            color: "purple",
            description: "Catálogo maestro",
          },
          {
            label: "Notas de Entrada",
            icon: "pi pi-inbox",
            to: "/empresa/inventario/notas-entrada",
            color: "orange",
            description: "Recepción",
          },
          {
            label: "Notas de Salida",
            icon: "pi pi-external-link",
            to: "/empresa/inventario/notas-salida",
            color: "pink",
            description: "Despacho",
          },
          {
            label: "Reservas",
            icon: "pi pi-bookmark",
            to: "/empresa/inventario/reservas",
            color: "indigo",
            description: "Compromisos",
          },
        ],
      },
      {
        title: "Stock y Control",
        icon: "pi pi-chart-bar",
        actions: [
          {
            label: "Stock Actual",
            icon: "pi pi-chart-bar",
            to: "/empresa/inventario/stock",
            color: "blue",
            description: "Disponibilidad",
          },
          {
            label: "Stock Bajo",
            icon: "pi pi-exclamation-triangle",
            to: "/empresa/inventario/stock/low-stock",
            color: "red",
            description: "Alertas",
          },
          {
            label: "Movimientos",
            icon: "pi pi-history",
            to: "/empresa/inventario/movimientos",
            color: "yellow",
            description: "Historial",
          },
          {
            label: "Operaciones Masivas",
            icon: "pi pi-upload",
            to: "/empresa/inventario/stock/bulk",
            color: "cyan",
            description: "Carga rápida",
          },
        ],
      },
      {
        title: "Almacén",
        icon: "pi pi-database",
        actions: [
          {
            label: "Almacenes",
            icon: "pi pi-database",
            to: "/empresa/inventario/almacenes",
            color: "bluegray",
            description: "Ubicaciones",
          },
          {
            label: "Transferencias",
            icon: "pi pi-arrow-right-arrow-left",
            to: "/empresa/inventario/transferencias",
            color: "teal",
            description: "Entre almacenes",
          },
          {
            label: "Ajustes",
            icon: "pi pi-pencil",
            to: "/empresa/inventario/ajustes",
            color: "orange",
            description: "Correcciones",
          },
          {
            label: "Conteos",
            icon: "pi pi-list-check",
            to: "/empresa/inventario/conteos",
            color: "green",
            description: "Cíclicos",
          },
          {
            label: "Préstamos",
            icon: "pi pi-bookmark",
            to: "/empresa/inventario/prestamos",
            color: "purple",
            description: "Control",
          },
          {
            label: "Devoluciones",
            icon: "pi pi-undo",
            to: "/empresa/inventario/devoluciones",
            color: "pink",
            description: "Retornos",
          },
          {
            label: "Reconciliaciones",
            icon: "pi pi-check-square",
            to: "/empresa/inventario/reconciliaciones",
            color: "indigo",
            description: "Conciliación",
          },
          {
            label: "Importar / Exportar",
            icon: "pi pi-upload",
            to: "/empresa/inventario/importar",
            color: "cyan",
            description: "Datos",
          },
        ],
      },
      {
        title: "Reportes",
        icon: "pi pi-chart-line",
        actions: [
          {
            label: "Dashboard",
            icon: "pi pi-th-large",
            to: "/empresa/inventario/reportes",
            color: "blue",
            description: "Analítica",
          },
          {
            label: "ABC",
            icon: "pi pi-chart-pie",
            to: "/empresa/inventario/reportes/abc",
            color: "purple",
            description: "Clasificación",
          },
          {
            label: "Rotación",
            icon: "pi pi-sync",
            to: "/empresa/inventario/reportes/rotacion",
            color: "teal",
            description: "Movimiento",
          },
          {
            label: "Pronósticos",
            icon: "pi pi-chart-bar",
            to: "/empresa/inventario/reportes/pronosticos",
            color: "cyan",
            description: "Demanda",
          },
          {
            label: "Stock Bajo",
            icon: "pi pi-exclamation-triangle",
            to: "/empresa/inventario/reportes/stock-bajo",
            color: "red",
            description: "Alertas",
          },
          {
            label: "Stock Muerto",
            icon: "pi pi-times-circle",
            to: "/empresa/inventario/reportes/stock-muerto",
            color: "gray",
            description: "Sin rotación",
          },
          {
            label: "Valoración",
            icon: "pi pi-dollar",
            to: "/empresa/inventario/reportes/valoracion",
            color: "green",
            description: "Costo",
          },
          {
            label: "Movimientos",
            icon: "pi pi-history",
            to: "/empresa/inventario/reportes/movimientos",
            color: "yellow",
            description: "Trazas",
          },
          {
            label: "Salidas sin Factura",
            icon: "pi pi-file-excel",
            to: "/empresa/inventario/reportes/salidas-sin-factura",
            color: "orange",
            description: "Pendientes",
          },
          {
            label: "Kardex",
            icon: "pi pi-list",
            to: "/empresa/inventario/reportes/kardex",
            color: "bluegray",
            description: "Detalle",
          },
          {
            label: "Envejecimiento",
            icon: "pi pi-clock",
            to: "/empresa/inventario/reportes/envejecimiento",
            color: "indigo",
            description: "Antigüedad",
          },
          {
            label: "Vencimientos",
            icon: "pi pi-calendar-times",
            to: "/empresa/inventario/reportes/vencimientos",
            color: "pink",
            description: "Fechas",
          },
        ],
      },
      {
        title: "Catálogos",
        icon: "pi pi-tags",
        actions: [
          {
            label: "Categorías",
            icon: "pi pi-tags",
            to: "/empresa/inventario/categorias",
            color: "purple",
            description: "Familias",
          },
          {
            label: "Marcas",
            icon: "pi pi-flag",
            to: "/empresa/inventario/marcas",
            color: "orange",
            description: "Fabricantes",
          },
          {
            label: "Modelos",
            icon: "pi pi-book",
            to: "/empresa/inventario/modelos",
            color: "blue",
            description: "Referencias",
          },
          {
            label: "Compatibilidad",
            icon: "pi pi-th-large",
            to: "/empresa/inventario/compatibilidad",
            color: "teal",
            description: "Aplicaciones",
          },
          {
            label: "Unidades",
            icon: "pi pi-box",
            to: "/empresa/inventario/unidades",
            color: "green",
            description: "Medidas",
          },
        ],
      },
    ],
  },
  {
    group: "Taller",
    icon: "pi pi-wrench",
    color: "orange",
    description: "Agenda, recepción, operación técnica, cierre y catálogos.",
    actionGroups: [
      {
        title: "Principales",
        icon: "pi pi-wrench",
        actions: [
          {
            label: "Dashboard",
            icon: "pi pi-chart-line",
            to: "/empresa/workshop",
            color: "orange",
            description: "Resumen taller",
          },
          {
            label: "Citas",
            icon: "pi pi-calendar",
            to: "/empresa/workshop/appointments",
            color: "teal",
            description: "Agenda",
          },
          {
            label: "Recepciones",
            icon: "pi pi-inbox",
            to: "/empresa/workshop/receptions",
            color: "blue",
            description: "Ingreso",
          },
          {
            label: "Planificación",
            icon: "pi pi-th-large",
            to: "/empresa/workshop/planning",
            color: "indigo",
            description: "Tablero",
          },
          {
            label: "Materiales",
            icon: "pi pi-box",
            to: "/empresa/workshop/materials",
            color: "purple",
            description: "Consumos",
          },
        ],
      },
      {
        title: "Operación",
        icon: "pi pi-refresh",
        actions: [
          {
            label: "Garita",
            icon: "pi pi-shield",
            to: "/empresa/workshop/garita",
            color: "bluegray",
            description: "Vigilancia",
          },
          {
            label: "Órdenes de Trabajo",
            icon: "pi pi-file-edit",
            to: "/empresa/workshop/service-orders",
            color: "orange",
            description: "Gestión de OTs",
          },
          {
            label: "Control de Tiempos",
            icon: "pi pi-stopwatch",
            to: "/empresa/workshop/labor-times",
            color: "yellow",
            description: "Mano de obra",
          },
          {
            label: "T.O.T.",
            icon: "pi pi-send",
            to: "/empresa/workshop/tot",
            color: "cyan",
            description: "Servicios externos",
          },
        ],
      },
      {
        title: "Diagnóstico y Cierre",
        icon: "pi pi-check-circle",
        actions: [
          {
            label: "Diagnósticos",
            icon: "pi pi-search",
            to: "/empresa/workshop/diagnoses",
            color: "purple",
            description: "Evaluaciones",
          },
          {
            label: "Adicionales",
            icon: "pi pi-plus-circle",
            to: "/empresa/workshop/additionals",
            color: "pink",
            description: "Trabajos extra",
          },
          {
            label: "Presupuestos",
            icon: "pi pi-calculator",
            to: "/empresa/workshop/quotations",
            color: "cyan",
            description: "Cotizaciones",
          },
          {
            label: "Calidad",
            icon: "pi pi-check-square",
            to: "/empresa/workshop/quality-checks",
            color: "green",
            description: "Revisiones",
          },
          {
            label: "Entregas",
            icon: "pi pi-sign-out",
            to: "/empresa/workshop/deliveries",
            color: "green",
            description: "Vehículos listos",
          },
          {
            label: "Facturación",
            icon: "pi pi-dollar",
            to: "/empresa/workshop/billing",
            color: "blue",
            description: "Cobros",
          },
        ],
      },
      {
        title: "Historial y Analítica",
        icon: "pi pi-history",
        actions: [
          {
            label: "Historial Vehículo",
            icon: "pi pi-car",
            to: "/empresa/workshop/vehicle-history",
            color: "yellow",
            description: "Por unidad",
          },
          {
            label: "Garantías",
            icon: "pi pi-shield",
            to: "/empresa/workshop/warranties",
            color: "red",
            description: "Seguimiento",
          },
          {
            label: "Retrabajo",
            icon: "pi pi-replay",
            to: "/empresa/workshop/reworks",
            color: "orange",
            description: "Correcciones",
          },
          {
            label: "Reportes",
            icon: "pi pi-chart-bar",
            to: "/empresa/workshop/reports",
            color: "bluegray",
            description: "Estadísticas",
          },
        ],
      },
      {
        title: "Catálogos",
        icon: "pi pi-cog",
        actions: [
          {
            label: "Tipos Servicio",
            icon: "pi pi-tags",
            to: "/empresa/workshop/service-types",
            color: "purple",
            description: "Catálogo",
          },
          {
            label: "Operaciones",
            icon: "pi pi-list",
            to: "/empresa/workshop/operations",
            color: "blue",
            description: "Mano de obra",
          },
          {
            label: "Bahías",
            icon: "pi pi-sitemap",
            to: "/empresa/workshop/bays",
            color: "indigo",
            description: "Recursos",
          },
          {
            label: "Checklists",
            icon: "pi pi-list-check",
            to: "/empresa/workshop/checklists",
            color: "green",
            description: "Plantillas",
          },
          {
            label: "Motivos Ingreso",
            icon: "pi pi-sign-in",
            to: "/empresa/workshop/ingress-motives",
            color: "orange",
            description: "Causales",
          },
          {
            label: "Especialidades",
            icon: "pi pi-star",
            to: "/empresa/workshop/technician-specialties",
            color: "yellow",
            description: "Técnicos",
          },
          {
            label: "Turnos",
            icon: "pi pi-clock",
            to: "/empresa/workshop/shifts",
            color: "teal",
            description: "Horarios",
          },
        ],
      },
    ],
  },
  {
    group: "CRM",
    icon: "pi pi-users",
    color: "purple",
    description: "Prospectos, clientes, oportunidades y seguimiento.",
    actionGroups: [
      {
        title: "Principales",
        icon: "pi pi-users",
        actions: [
          {
            label: "Dashboard",
            icon: "pi pi-home",
            to: "/empresa/crm",
            color: "purple",
            description: "Resumen CRM",
          },
          {
            label: "Clientes",
            icon: "pi pi-users",
            to: "/empresa/crm/clientes",
            color: "purple",
            description: "Directorio",
          },
          {
            label: "Leads",
            icon: "pi pi-chart-line",
            to: "/empresa/crm/leads",
            color: "blue",
            description: "Prospectos",
          },
          {
            label: "Oportunidades",
            icon: "pi pi-sitemap",
            to: "/empresa/crm/oportunidades",
            color: "cyan",
            description: "Negociaciones",
          },
          {
            label: "Cotizaciones",
            icon: "pi pi-file",
            to: "/empresa/crm/cotizaciones",
            color: "green",
            description: "Pipeline",
          },
          {
            label: "Casos",
            icon: "pi pi-folder-open",
            to: "/empresa/crm/casos",
            color: "orange",
            description: "Soporte",
          },
          {
            label: "Actividades",
            icon: "pi pi-check-square",
            to: "/empresa/crm/actividades",
            color: "teal",
            description: "Tareas",
          },
          {
            label: "Interacciones",
            icon: "pi pi-comments",
            to: "/empresa/crm/interacciones",
            color: "yellow",
            description: "Historial",
          },
          {
            label: "Campañas",
            icon: "pi pi-megaphone",
            to: "/empresa/crm/campanas",
            color: "pink",
            description: "Marketing",
          },
          {
            label: "Fidelización",
            icon: "pi pi-heart",
            to: "/empresa/crm/fidelizacion",
            color: "red",
            description: "Retención",
          },
        ],
      },
    ],
  },
  {
    group: "Concesionario",
    icon: "pi pi-car",
    color: "teal",
    description: "Unidades, reservas, cierre de venta y control documental.",
    actionGroups: [
      {
        title: "Principales",
        icon: "pi pi-car",
        actions: [
          {
            label: "Dashboard",
            icon: "pi pi-chart-line",
            to: "/empresa/concesionario",
            color: "teal",
            description: "Resumen",
          },
          {
            label: "Vehículos",
            icon: "pi pi-car",
            to: "/empresa/concesionario/vehicles",
            color: "blue",
            description: "Inventario",
          },
          {
            label: "Reservas",
            icon: "pi pi-calendar",
            to: "/empresa/concesionario/reservations",
            color: "purple",
            description: "Apartados",
          },
          {
            label: "Pruebas Manejo",
            icon: "pi pi-flag",
            to: "/empresa/concesionario/test-drives",
            color: "teal",
            description: "Test drives",
          },
          {
            label: "Retomas",
            icon: "pi pi-refresh",
            to: "/empresa/concesionario/trade-ins",
            color: "orange",
            description: "Avalúos",
          },
        ],
      },
      {
        title: "Cierre y Control",
        icon: "pi pi-dollar",
        actions: [
          {
            label: "Cotizaciones",
            icon: "pi pi-file",
            to: "/empresa/concesionario/quotes",
            color: "green",
            description: "Propuestas",
          },
          {
            label: "Financiamientos",
            icon: "pi pi-credit-card",
            to: "/empresa/concesionario/financing",
            color: "yellow",
            description: "Créditos",
          },
          {
            label: "Entregas",
            icon: "pi pi-box",
            to: "/empresa/concesionario/deliveries",
            color: "red",
            description: "Unidades",
          },
          {
            label: "Aprobaciones",
            icon: "pi pi-check-square",
            to: "/empresa/concesionario/approvals",
            color: "indigo",
            description: "Control",
          },
          {
            label: "Documentos",
            icon: "pi pi-folder",
            to: "/empresa/concesionario/documents",
            color: "bluegray",
            description: "Contratos",
          },
          {
            label: "After-Sales",
            icon: "pi pi-wrench",
            to: "/empresa/concesionario/after-sales",
            color: "bluegray",
            description: "Postventa",
          },
          {
            label: "Historial",
            icon: "pi pi-history",
            to: "/empresa/concesionario/history",
            color: "purple",
            description: "Comercial",
          },
          {
            label: "Reportes",
            icon: "pi pi-chart-bar",
            to: "/empresa/concesionario/reports",
            color: "gray",
            description: "Estadísticas",
          },
        ],
      },
    ],
  },
  {
    group: "Finanzas",
    icon: "pi pi-dollar",
    color: "green",
    description: "Cuentas, pagos, gastos, flujo de caja y tasas.",
    actionGroups: [
      {
        title: "Principales",
        icon: "pi pi-wallet",
        actions: [
          {
            label: "Dashboard",
            icon: "pi pi-chart-pie",
            to: "/empresa/finanzas/dashboard",
            color: "green",
            description: "Resumen",
          },
          {
            label: "Cuentas Bancarias",
            icon: "pi pi-building-columns",
            to: "/empresa/finanzas/cuentas-bancarias",
            color: "blue",
            description: "Bancos",
          },
          {
            label: "Por Cobrar",
            icon: "pi pi-arrow-up",
            to: "/empresa/finanzas/cuentas-por-cobrar",
            color: "teal",
            description: "Clientes",
          },
          {
            label: "Por Pagar",
            icon: "pi pi-arrow-down",
            to: "/empresa/finanzas/cuentas-por-pagar",
            color: "orange",
            description: "Obligaciones",
          },
          {
            label: "Facturas Proveedor",
            icon: "pi pi-file-import",
            to: "/empresa/finanzas/facturas-proveedor",
            color: "purple",
            description: "Recepción",
          },
          {
            label: "Pagos Proveedor",
            icon: "pi pi-send",
            to: "/empresa/finanzas/pagos-proveedor",
            color: "cyan",
            description: "Egresos",
          },
          {
            label: "Gastos",
            icon: "pi pi-receipt",
            to: "/empresa/finanzas/gastos",
            color: "red",
            description: "Operativos",
          },
          {
            label: "Recurrentes",
            icon: "pi pi-refresh",
            to: "/empresa/finanzas/gastos-recurrentes",
            color: "yellow",
            description: "Reglas",
          },
          {
            label: "Flujo de Caja",
            icon: "pi pi-chart-bar",
            to: "/empresa/finanzas/flujo-caja",
            color: "indigo",
            description: "Proyección",
          },
          {
            label: "Tipos de Cambio",
            icon: "pi pi-sync",
            to: "/empresa/finanzas/tipos-cambio",
            color: "green",
            description: "Tasas vigentes",
          },
        ],
      },
    ],
  },
  {
    group: "Configuración",
    icon: "pi pi-cog",
    color: "bluegray",
    description: "Auditoría, notificaciones, integraciones y catálogos globales.",
    actionGroups: [
      {
        title: "Sistema",
        icon: "pi pi-cog",
        actions: [
          {
            label: "Usuarios",
            icon: "pi pi-users",
            to: "/empresa/configuracion/usuarios",
            color: "indigo",
            description: "Permisos",
          },
          {
            label: "Auditoría",
            icon: "pi pi-history",
            to: "/empresa/configuracion/auditoria",
            color: "bluegray",
            description: "Registro",
          },
          {
            label: "Notificaciones",
            icon: "pi pi-bell",
            to: "/empresa/configuracion/notificaciones",
            color: "yellow",
            description: "Políticas",
          },
          {
            label: "Integraciones",
            icon: "pi pi-link",
            to: "/empresa/concesionario/integrations",
            color: "teal",
            description: "Conexiones",
          },
          {
            label: "Automatizaciones",
            icon: "pi pi-bolt",
            to: "/empresa/concesionario/automations",
            color: "orange",
            description: "Reglas",
          },
        ],
      },
      {
        title: "Catálogo",
        icon: "pi pi-tags",
        actions: [
          {
            label: "Categorías",
            icon: "pi pi-tags",
            to: "/empresa/inventario/categorias",
            color: "purple",
            description: "Inventario",
          },
          {
            label: "Marcas",
            icon: "pi pi-flag",
            to: "/empresa/inventario/marcas",
            color: "orange",
            description: "Fabricantes",
          },
          {
            label: "Modelos",
            icon: "pi pi-book",
            to: "/empresa/inventario/modelos",
            color: "blue",
            description: "Referencias",
          },
          {
            label: "Compatibilidad",
            icon: "pi pi-th-large",
            to: "/empresa/inventario/compatibilidad",
            color: "teal",
            description: "Aplicaciones",
          },
          {
            label: "Unidades",
            icon: "pi pi-box",
            to: "/empresa/inventario/unidades",
            color: "green",
            description: "Medidas",
          },
        ],
      },
    ],
  },
];

export default function Dashboard() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-900 m-0">
          <i className="pi pi-home mr-2 text-primary" />
          Panel Principal
        </h2>
        <p className="text-500 text-sm m-0 mt-1">
          Acceso rápido a las áreas operativas, analíticas y de configuración
          del sistema
        </p>
      </div>

      {SECTIONS.map((section, sectionIndex) => (
        <div key={section.group}>
          {sectionIndex > 0 ? <Divider className="my-4" /> : null}
          <div
            className="flex align-items-start gap-2 mb-3"
            style={{
              borderLeft: `3px solid var(--${section.color}-500)`,
              paddingLeft: "0.75rem",
            }}
          >
            <i
              className={`${section.icon} text-${section.color}-500 text-lg mt-1`}
            />
            <div>
              <h3 className="font-bold text-900 text-base m-0">
                {section.group}
              </h3>
              <p className="text-500 text-sm m-0 mt-1">
                {section.description}
              </p>
            </div>
          </div>

          <div className="flex flex-column gap-4">
            {section.actionGroups.map((actionGroup) => (
              <div key={`${section.group}-${actionGroup.title}`}>
                <div className="flex align-items-center gap-2 mb-3">
                  <i
                    className={`${actionGroup.icon} text-${section.color}-500 text-sm`}
                  />
                  <span className="font-semibold text-700 text-sm">
                    {actionGroup.title}
                  </span>
                </div>
                <QuickActions actions={actionGroup.actions} showTitle={false} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
