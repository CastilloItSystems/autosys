import AppSubMenu from "./AppSubMenu";
import type { MenuModel } from "@/types";
import { useVentasStore } from "@/store/ventasStore";
import { useEmpresasStore } from "@/store/empresasStore";

const AppMenuEmpresa = () => {
  const { activeEmpresa } = useEmpresasStore();
  const { obtenerEstadisticas } = useVentasStore();
  const estadisticas = obtenerEstadisticas();

  const model: MenuModel[] = [
    // ── DASHBOARDS ──
    {
      label: activeEmpresa?.name_prefijo || "Selecciona una Empresa",
      icon: "pi pi-home",
      items: [
        {
          label: "Dashboard de Operaciones",
          icon: "pi pi-fw pi-chart-line",
          to: "/empresa/operation",
        },
        {
          label: "Dashboard de Finanzas",
          icon: "pi pi-fw pi-dollar",
          to: "/empresa/finance",
        },
        {
          label: "Dashboard de Ventas",
          icon: "pi pi-fw pi-shopping-cart",
          to: "/empresa/ventas",
          badge:
            estadisticas.pendientes > 0 ? estadisticas.pendientes : undefined,
          badgeClassName: "p-badge-danger",
        },
        {
          label: "Inicio",
          icon: "pi pi-fw pi-home",
          to: "/",
        },
      ],
    },

    // ── VENTAS ──
    {
      label: "Ventas",
      icon: "pi pi-fw pi-shopping-cart",
      items: [
        {
          label: "Clientes",
          icon: "pi pi-fw pi-users",
          to: "/empresa/crm/clientes",
        },
        {
          label: "Órdenes de Venta",
          icon: "pi pi-fw pi-money-bill",
          to: "/empresa/inventario/ordenes-venta",
        },
        {
          label: "Pre-facturas",
          icon: "pi pi-fw pi-file-text",
          to: "/empresa/inventario/pre-invoice",
        },
        {
          label: "Pagos",
          icon: "pi pi-fw pi-money-bill",
          to: "/empresa/inventario/payment",
        },
        {
          label: "Facturas",
          icon: "pi pi-fw pi-file",
          to: "/empresa/inventario/invoice",
        },
        {
          label: "Reportes",
          icon: "pi pi-fw pi-chart-bar",
          items: [
            {
              label: "Dashboard Ventas",
              icon: "pi pi-fw pi-th-large",
              to: "/empresa/ventas/reportes",
            },
            {
              label: "Ventas por Período",
              icon: "pi pi-fw pi-chart-line",
              to: "/empresa/ventas/reportes/por-periodo",
            },
            {
              label: "Ventas por Cliente",
              icon: "pi pi-fw pi-users",
              to: "/empresa/ventas/reportes/por-cliente",
            },
            {
              label: "Ventas por Producto",
              icon: "pi pi-fw pi-box",
              to: "/empresa/ventas/reportes/por-producto",
            },
            {
              label: "Pipeline de Órdenes",
              icon: "pi pi-fw pi-filter",
              to: "/empresa/ventas/reportes/pipeline-ordenes",
            },
            {
              label: "Métodos de Pago",
              icon: "pi pi-fw pi-credit-card",
              to: "/empresa/ventas/reportes/metodos-pago",
            },
            {
              label: "Prefacturas Pendientes",
              icon: "pi pi-fw pi-clock",
              to: "/empresa/ventas/reportes/prefacturas-pendientes",
            },
          ],
        },
      ],
    },

    // ── COMPRAS ──
    {
      label: "Compras",
      icon: "pi pi-fw pi-wallet",
      items: [
        {
          label: "Proveedores",
          icon: "pi pi-fw pi-users",
          to: "/empresa/inventario/proveedores",
        },
        {
          label: "Órdenes de Compra",
          icon: "pi pi-fw pi-shopping-cart",
          to: "/empresa/inventario/ordenes-compra",
        },
      ],
    },

    // ── INVENTARIO ──
    {
      label: "Inventario",
      icon: "pi pi-fw pi-box",
      items: [
        {
          label: "Dashboard",
          icon: "pi pi-fw pi-chart-line",
          to: "/empresa/inventario/dashboard",
        },
        {
          label: "Artículos",
          icon: "pi pi-fw pi-box",
          to: "/empresa/inventario/items",
        },
        {
          label: "Notas de Entrada",
          icon: "pi pi-fw pi-inbox",
          to: "/empresa/inventario/notas-entrada",
        },
        {
          label: "Notas de Salida",
          icon: "pi pi-fw pi-external-link",
          to: "/empresa/inventario/notas-salida",
        },
        {
          label: "Reservas",
          icon: "pi pi-fw pi-bookmark",
          to: "/empresa/inventario/reservas",
        },
        {
          label: "Stock y Control",
          icon: "pi pi-fw pi-chart-bar",
          items: [
            {
              label: "Stock Actual",
              icon: "pi pi-fw pi-chart-bar",
              to: "/empresa/inventario/stock",
            },
            {
              label: "Stock Bajo",
              icon: "pi pi-fw pi-exclamation-triangle",
              to: "/empresa/inventario/stock/low-stock",
            },
            {
              label: "Movimientos",
              icon: "pi pi-fw pi-history",
              to: "/empresa/inventario/movimientos",
            },
            {
              label: "Operaciones Masivas",
              icon: "pi pi-fw pi-upload",
              to: "/empresa/inventario/stock/bulk",
            },
          ],
        },
        {
          label: "Almacén",
          icon: "pi pi-fw pi-database",
          items: [
            {
              label: "Almacenes",
              icon: "pi pi-fw pi-database",
              to: "/empresa/inventario/almacenes",
            },
            {
              label: "Transferencias",
              icon: "pi pi-arrow-right-arrow-left",
              to: "/empresa/inventario/transferencias",
            },
            {
              label: "Ajustes",
              icon: "pi pi-fw pi-pencil",
              to: "/empresa/inventario/ajustes",
            },
            {
              label: "Conteos Cíclicos",
              icon: "pi pi-list-check",
              to: "/empresa/inventario/conteos",
            },
            {
              label: "Préstamos",
              icon: "pi pi-fw pi-bookmark",
              to: "/empresa/inventario/prestamos",
            },
            {
              label: "Devoluciones",
              icon: "pi pi-fw pi-undo",
              to: "/empresa/inventario/devoluciones",
            },
            {
              label: "Reconciliaciones",
              icon: "pi pi-fw pi-check-square",
              to: "/empresa/inventario/reconciliaciones",
            },
          ],
        },
        {
          label: "Trazabilidad",
          icon: "pi pi-fw pi-map",
          items: [
            {
              label: "Lotes",
              icon: "pi pi-fw pi-inbox",
              to: "/empresa/inventario/trazabilidad/lotes",
            },
            {
              label: "Números de Serie",
              icon: "pi pi-fw pi-barcode",
              to: "/empresa/inventario/trazabilidad/seriales",
            },
          ],
        },
        {
          label: "Reportes",
          icon: "pi pi-fw pi-chart-line",
          items: [
            {
              label: "Dashboard",
              icon: "pi pi-fw pi-th-large",
              to: "/empresa/inventario/reportes",
            },
            {
              label: "Análisis ABC",
              icon: "pi pi-fw pi-chart-pie",
              to: "/empresa/inventario/reportes/abc",
            },
            {
              label: "Rotación",
              icon: "pi pi-fw pi-sync",
              to: "/empresa/inventario/reportes/rotacion",
            },
            {
              label: "Pronósticos",
              icon: "pi pi-fw pi-chart-bar",
              to: "/empresa/inventario/reportes/pronosticos",
            },
            {
              label: "Stock Bajo",
              icon: "pi pi-fw pi-exclamation-triangle",
              to: "/empresa/inventario/reportes/stock-bajo",
            },
            {
              label: "Stock Muerto",
              icon: "pi pi-fw pi-times-circle",
              to: "/empresa/inventario/reportes/stock-muerto",
            },
            {
              label: "Valoración",
              icon: "pi pi-fw pi-dollar",
              to: "/empresa/inventario/reportes/valoracion",
            },
            {
              label: "Movimientos",
              icon: "pi pi-fw pi-history",
              to: "/empresa/inventario/reportes/movimientos",
            },
            {
              label: "Salidas sin Factura",
              icon: "pi pi-fw pi-file-excel",
              to: "/empresa/inventario/reportes/salidas-sin-factura",
            },
            {
              label: "Kardex",
              icon: "pi pi-fw pi-list",
              to: "/empresa/inventario/reportes/kardex",
            },
            {
              label: "Envejecimiento",
              icon: "pi pi-fw pi-clock",
              to: "/empresa/inventario/reportes/envejecimiento",
            },
            {
              label: "Vencimientos",
              icon: "pi pi-fw pi-calendar-times",
              to: "/empresa/inventario/reportes/vencimientos",
            },
            {
              label: "Rend. Proveedores",
              icon: "pi pi-fw pi-star-fill",
              to: "/empresa/inventario/reportes/rendimiento-proveedores",
            },
          ],
        },
        {
          label: "Importar / Exportar",
          icon: "pi pi-fw pi-upload",
          to: "/empresa/inventario/importar",
        },
      ],
    },

    // ── CRM ──
    {
      label: "CRM",
      icon: "pi pi-fw pi-chart-line",
      items: [
        {
          label: "Dashboard",
          icon: "pi pi-fw pi-home",
          to: "/empresa/crm",
        },
        {
          label: "Clientes",
          icon: "pi pi-fw pi-users",
          to: "/empresa/crm/clientes",
        },
        {
          label: "Leads / Oportunidades",
          icon: "pi pi-fw pi-chart-line",
          to: "/empresa/crm/leads",
        },
        {
          label: "Cotizaciones",
          icon: "pi pi-fw pi-file-text",
          to: "/empresa/crm/cotizaciones",
        },
        {
          label: "Casos / Reclamos",
          icon: "pi pi-fw pi-exclamation-circle",
          to: "/empresa/crm/casos",
        },
        {
          label: "Actividades",
          icon: "pi pi-fw pi-check-square",
          to: "/empresa/crm/actividades",
        },
        {
          label: "Interacciones",
          icon: "pi pi-fw pi-comments",
          to: "/empresa/crm/interacciones",
        },
      ],
    },

    // ── TALLER ──
    {
      label: "Taller",
      icon: "pi pi-fw pi-wrench",
      items: [
        {
          label: "Dashboard Operativo",
          icon: "pi pi-fw pi-chart-line",
          to: "/empresa/workshop",
        },
        {
          label: "Operaciones Diarias",
          icon: "pi pi-fw pi-refresh",
          items: [
            {
              label: "Garita / Vigilancia",
              icon: "pi pi-fw pi-shield",
              to: "/empresa/workshop/garita",
            },
            {
              label: "Citas",
              icon: "pi pi-fw pi-calendar",
              to: "/empresa/workshop/appointments",
            },
            {
              label: "Recepciones",
              icon: "pi pi-fw pi-inbox",
              to: "/empresa/workshop/receptions",
            },
            {
              label: "Órdenes de Trabajo",
              icon: "pi pi-fw pi-file-edit",
              to: "/empresa/workshop/service-orders",
            },
            {
              label: "Tablero de Planeación",
              icon: "pi pi-fw pi-th-large",
              to: "/empresa/workshop/planning",
            },
            {
              label: "Control de Tiempos",
              icon: "pi pi-fw pi-stopwatch",
              to: "/empresa/workshop/labor-times",
            },
            {
              label: "Servicios Externos (T.O.T.)",
              icon: "pi pi-fw pi-send",
              to: "/empresa/workshop/tot",
            },
          ],
        },
        {
          label: "Diagnóstico y Cotización",
          icon: "pi pi-fw pi-search",
          items: [
            {
              label: "Diagnósticos",
              icon: "pi pi-fw pi-search-plus",
              to: "/empresa/workshop/diagnoses",
            },
            {
              label: "Trabajos Adicionales",
              icon: "pi pi-fw pi-plus-circle",
              to: "/empresa/workshop/additionals",
            },
            {
              label: "Cotizaciones",
              icon: "pi pi-fw pi-file-edit",
              to: "/empresa/workshop/quotations",
            },
          ],
        },
        {
          label: "Facturación",
          icon: "pi pi-fw pi-dollar",
          to: "/empresa/workshop/billing",
        },
        {
          label: "Materiales",
          icon: "pi pi-fw pi-box",
          to: "/empresa/workshop/materials",
        },
        {
          label: "Calidad y Entrega",
          icon: "pi pi-fw pi-verified",
          items: [
            {
              label: "Control de Calidad",
              icon: "pi pi-fw pi-check-square",
              to: "/empresa/workshop/quality-checks",
            },
            {
              label: "Entregas",
              icon: "pi pi-fw pi-sign-out",
              to: "/empresa/workshop/deliveries",
            },
          ],
        },
        {
          label: "Historial",
          icon: "pi pi-fw pi-history",
          items: [
            {
              label: "Historial de Vehículo",
              icon: "pi pi-fw pi-car",
              to: "/empresa/workshop/vehicle-history",
            },
            {
              label: "Garantías",
              icon: "pi pi-fw pi-shield",
              to: "/empresa/workshop/warranties",
            },
            {
              label: "Retrabajo",
              icon: "pi pi-fw pi-replay",
              to: "/empresa/workshop/reworks",
            },
          ],
        },
        {
          label: "Reportes",
          icon: "pi pi-fw pi-chart-bar",
          to: "/empresa/workshop/reports",
        },
        {
          label: "Configuración",
          icon: "pi pi-fw pi-cog",
          items: [
            {
              label: "Tipos de Servicio",
              icon: "pi pi-fw pi-tags",
              to: "/empresa/workshop/service-types",
            },
            {
              label: "Operaciones",
              icon: "pi pi-fw pi-list",
              to: "/empresa/workshop/operations",
            },
            {
              label: "Bahías",
              icon: "pi pi-fw pi-sitemap",
              to: "/empresa/workshop/bays",
            },
            {
              label: "Checklists",
              icon: "pi pi-fw pi-list-check",
              to: "/empresa/workshop/checklists",
            },
            {
              label: "Motivos de Ingreso",
              icon: "pi pi-fw pi-sign-in",
              to: "/empresa/workshop/ingress-motives",
            },
            {
              label: "Especialidades Técnicas",
              icon: "pi pi-fw pi-star",
              to: "/empresa/workshop/technician-specialties",
            },
            {
              label: "Sucursales",
              icon: "pi pi-fw pi-building",
              to: "/empresa/workshop/branches",
            },
            {
              label: "Turnos",
              icon: "pi pi-fw pi-clock",
              to: "/empresa/workshop/shifts",
            },
          ],
        },
      ],
    },

    // ── CONCESIONARIO ──
    {
      label: "Concesionario",
      icon: "pi pi-fw pi-car",
      items: [
        {
          label: "Dashboard",
          icon: "pi pi-fw pi-chart-line",
          to: "/empresa/concesionario",
        },
        {
          label: "Inventario de Vehículos",
          icon: "pi pi-fw pi-car",
          to: "/empresa/concesionario/vehicles",
        },
        {
          label: "Cotizaciones",
          icon: "pi pi-fw pi-file-text",
          to: "/empresa/concesionario/quotes",
        },
        {
          label: "Financiamiento",
          icon: "pi pi-fw pi-money-bill",
          to: "/empresa/concesionario/financing",
        },
      ],
    },

    // ── FINANZAS ──
    {
      label: "Finanzas",
      icon: "pi pi-fw pi-dollar",
      items: [
        {
          label: "Dashboard Financiero",
          icon: "pi pi-fw pi-chart-line",
          to: "/empresa/finance",
        },
        {
          label: "Cuentas por Cobrar",
          icon: "pi pi-fw pi-arrow-up",
          to: "/empresa/finance/cuentas-cobrar",
        },
        {
          label: "Cuentas por Pagar",
          icon: "pi pi-fw pi-arrow-down",
          to: "/empresa/finance/cuentas-pagar",
        },
      ],
    },

    // ── CONFIGURACIÓN ──
    {
      label: "Configuración",
      icon: "pi pi-fw pi-cog",
      items: [
        {
          label: "General",
          icon: "pi pi-fw pi-cog",
          to: "/empresa/configuracion/general",
        },
        {
          label: "Usuarios y Permisos",
          icon: "pi pi-fw pi-users",
          to: "/empresa/configuracion/usuarios",
        },
        {
          label: "Catálogo",
          icon: "pi pi-fw pi-tags",
          items: [
            {
              label: "Categorías",
              icon: "pi pi-fw pi-tags",
              to: "/empresa/inventario/categorias",
            },
            {
              label: "Marcas",
              icon: "pi pi-fw pi-flag",
              to: "/empresa/inventario/marcas",
            },
            {
              label: "Modelos",
              icon: "pi pi-fw pi-book",
              to: "/empresa/inventario/modelos",
            },
            {
              label: "Compatibilidad",
              icon: "pi pi-fw pi-th-large",
              to: "/empresa/inventario/compatibilidad",
            },
            {
              label: "Unidades de Medida",
              icon: "pi pi-fw pi-box",
              to: "/empresa/inventario/unidades",
            },
          ],
        },
      ],
    },
  ];

  return <AppSubMenu model={model} />;
};

export default AppMenuEmpresa;
