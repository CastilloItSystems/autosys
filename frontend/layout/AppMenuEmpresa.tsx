import { useRefineriaStore } from "@/store/refineriaStore";
import AppSubMenu from "./AppSubMenu";
import type { MenuModel } from "@/types";
// import { useEmpresaStore } from "@/store/autoSysStore";
import { useVentasStore } from "@/store/ventasStore";
import { Badge } from "primereact/badge";
import { useEmpresasStore } from "@/store/empresasStore";

const AppMenuEmpresa = () => {
  const { activeEmpresa } = useEmpresasStore();
  const { obtenerEstadisticas } = useVentasStore();
  const estadisticas = obtenerEstadisticas();

  const model: MenuModel[] = [
    // =============================================
    // DASHBOARDS Y OPERACIONES PRINCIPALES
    // =============================================
    {
      label: activeEmpresa?.nombre || "Selecciona una Empresa",
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

    // =============================================
    // MÓDULOS
    // =============================================
    {
      label: "modulos",
      icon: "pi pi-fw pi-align-left",
      items: [
        // =============================================
        // MÓDULO: INVENTARIO
        // =============================================
        {
          label: "inventario",
          icon: "pi pi-fw pi-box",
          items: [
            // --- Accesos rápidos ---
            {
              label: "dashboard",
              icon: "pi pi-fw pi-chart-line",
              to: "/empresa/inventario/dashboard",
            },
            {
              label: "artículos",
              icon: "pi pi-fw pi-box",
              to: "/empresa/inventario/items",
            },
            {
              label: "stock bajo",
              icon: "pi pi-fw pi-exclamation-triangle",
              to: "/empresa/inventario/stock/low-stock",
            },
            {
              label: "movimientos",
              icon: "pi pi-fw pi-exchange",
              to: "/empresa/inventario/movimientos",
            },
            // --- Navegación principal ---
            {
              label: "búsqueda",
              icon: "pi pi-fw pi-search",
              to: "/empresa/inventario/busqueda",
            },
            {
              label: "stock",
              icon: "pi pi-fw pi-chart-bar",
              to: "/empresa/inventario/stock",
            },
            {
              label: "compras",
              icon: "pi pi-fw pi-shopping-cart",
              items: [
                {
                  label: "órdenes de compra",
                  icon: "pi pi-fw pi-shopping-cart",
                  to: "/empresa/inventario/ordenes-compra",
                },
                {
                  label: "notas de entrada",
                  icon: "pi pi-fw pi-inbox",
                  to: "/empresa/inventario/recepciones",
                },
                {
                  label: "proveedores",
                  icon: "pi pi-fw pi-users",
                  to: "/empresa/inventario/proveedores",
                },
              ],
            },
            {
              label: "ventas",
              icon: "pi pi-fw pi-money-bill",
              items: [
                {
                  label: "órdenes de venta",
                  icon: "pi pi-fw pi-money-bill",
                  to: "/empresa/inventario/ordenes-venta",
                },
                {
                  label: "notas de salida",
                  icon: "pi pi-fw pi-external-link",
                  to: "/empresa/inventario/notas-salida",
                },
                {
                  label: "reservas",
                  icon: "pi pi-fw pi-bookmark",
                  to: "/empresa/inventario/reservas",
                },
              ],
            },
            {
              label: "almacén",
              icon: "pi pi-fw pi-database",
              items: [
                {
                  label: "almacenes",
                  icon: "pi pi-fw pi-database",
                  to: "/empresa/inventario/almacenes",
                },
                {
                  label: "transferencias",
                  icon: "pi pi-arrow-right-arrow-left",
                  to: "/empresa/inventario/transferencias",
                },
                {
                  label: "ajustes",
                  icon: "pi pi-fw pi-pencil",
                  to: "/empresa/inventario/ajustes",
                },
                {
                  label: "conteos cíclicos",
                  icon: "pi pi-list-check",
                  to: "/empresa/inventario/conteos",
                },
                {
                  label: "préstamos",
                  icon: "pi pi-fw pi-bookmark",
                  to: "/empresa/inventario/prestamos",
                },
                {
                  label: "devoluciones",
                  icon: "pi pi-fw pi-undo",
                  to: "/empresa/inventario/devoluciones",
                },
                {
                  label: "reconciliaciones",
                  icon: "pi pi-fw pi-check-square",
                  to: "/empresa/inventario/reconciliaciones",
                },
              ],
            },
            {
              label: "trazabilidad",
              icon: "pi pi-fw pi-map",
              items: [
                {
                  label: "lotes",
                  icon: "pi pi-fw pi-inbox",
                  to: "/empresa/inventario/trazabilidad/lotes",
                },
                {
                  label: "números de serie",
                  icon: "pi pi-fw pi-barcode",
                  to: "/empresa/inventario/trazabilidad/seriales",
                },
              ],
            },
            {
              label: "reportes",
              icon: "pi pi-fw pi-chart-line",
              items: [
                {
                  label: "dashboard",
                  icon: "pi pi-fw pi-th-large",
                  to: "/empresa/inventario/reportes",
                },
                {
                  label: "análisis ABC",
                  icon: "pi pi-fw pi-chart-pie",
                  to: "/empresa/inventario/reportes/abc",
                },
                {
                  label: "rotación",
                  icon: "pi pi-fw pi-sync",
                  to: "/empresa/inventario/reportes/rotacion",
                },
                {
                  label: "pronósticos",
                  icon: "pi pi-fw pi-chart-bar",
                  to: "/empresa/inventario/reportes/pronosticos",
                },
              ],
            },
            {
              label: "importar / exportar",
              icon: "pi pi-fw pi-upload",
              to: "/empresa/inventario/importar",
            },
            {
              label: "configuración",
              icon: "pi pi-fw pi-cog",
              items: [
                {
                  label: "categorías",
                  icon: "pi pi-fw pi-tags",
                  to: "/empresa/inventario/categorias",
                },
                {
                  label: "marcas",
                  icon: "pi pi-fw pi-flag",
                  to: "/empresa/inventario/marcas",
                },
                {
                  label: "modelos",
                  icon: "pi pi-fw pi-book",
                  to: "/empresa/inventario/modelos",
                },
                {
                  label: "compatibilidad",
                  icon: "pi pi-fw pi-th-large",
                  to: "/empresa/inventario/compatibilidad",
                },
                {
                  label: "unidades de medida",
                  icon: "pi pi-fw pi-box",
                  to: "/empresa/inventario/unidades",
                },
              ],
            },
          ],
        },

        // =============================================
        // MÓDULO: CRM (CLIENTES Y VEHÍCULOS)
        // =============================================
        {
          label: "crm",
          icon: "pi pi-fw pi-users",
          items: [
            {
              label: "configuraciones",
              icon: "pi pi-fw pi-cog",
              items: [
                {
                  label: "marcas de vehículos",
                  icon: "pi pi-fw pi-tag",
                  to: "/empresa/crm/vehiculos/marcas",
                },
                {
                  label: "modelos de vehículos",
                  icon: "pi pi-fw pi-list",
                  to: "/empresa/crm/vehiculos/modelos",
                },
              ],
            },
            {
              label: "gestión de datos",
              icon: "pi pi-fw pi-database",
              items: [
                {
                  label: "clientes",
                  icon: "pi pi-fw pi-users",
                  to: "/autosys/crm/clientes",
                },
                {
                  label: "vehículos",
                  icon: "pi pi-fw pi-car",
                  to: "/autosys/crm/vehiculos/",
                },
              ],
            },
          ],
        },

        // =============================================
        // MÓDULO: TALLER
        // =============================================
        {
          label: "taller",
          icon: "pi pi-fw pi-wrench",
          items: [
            {
              label: "configuraciones",
              icon: "pi pi-fw pi-cog",
              items: [
                {
                  label: "categorías de servicios",
                  icon: "pi pi-fw pi-tags",
                  to: "/empresa/workshop/service-categories",
                },
                {
                  label: "subcategorías de servicios",
                  icon: "pi pi-fw pi-tag",
                  to: "/empresa/workshop/service-subcategories",
                },
                {
                  label: "estados de órdenes",
                  icon: "pi pi-fw pi-tags",
                  to: "/empresa/workshop/work-order-statuses",
                },
                {
                  label: "servicios",
                  icon: "pi pi-fw pi-cog",
                  to: "/empresa/workshop/services",
                },
              ],
            },
            {
              label: "operaciones diarias",
              icon: "pi pi-fw pi-refresh",
              items: [
                {
                  label: "bahías de servicio",
                  icon: "pi pi-fw pi-cog",
                  to: "/empresa/operation/service-bays",
                },
                {
                  label: "dashboard órdenes de trabajo",
                  icon: "pi pi-fw pi-chart-line",
                  to: "/empresa/operation/workshop",
                },
                {
                  label: "gestión órdenes de trabajo",
                  icon: "pi pi-fw pi-file-edit",
                  to: "/empresa/workshop",
                },
                {
                  label: "gestión de puestos",
                  icon: "pi pi-fw pi-sitemap",
                  to: "/empresa/workshop/service-bays",
                },
              ],
            },
            {
              label: "facturación y pagos",
              icon: "pi pi-fw pi-dollar",
              items: [
                {
                  label: "facturas",
                  icon: "pi pi-fw pi-file",
                  to: "/empresa/workshop/invoices",
                },
                {
                  label: "pagos",
                  icon: "pi pi-fw pi-money-bill",
                  to: "/empresa/workshop/payments",
                },
              ],
            },
          ],
        },

        // =============================================
        // MÓDULO: CONCESIONARIO
        // =============================================
        {
          label: "concesionario",
          icon: "pi pi-fw pi-car",
          items: [
            {
              label: "dashboard",
              icon: "pi pi-fw pi-chart-line",
              to: "/empresa/concesionario",
            },
            {
              label: "inventario de vehículos",
              icon: "pi pi-fw pi-car",
              to: "/empresa/concesionario/vehicles",
            },
            {
              label: "cotizaciones",
              icon: "pi pi-fw pi-file-text",
              to: "/empresa/concesionario/quotes",
            },
            {
              label: "financiamiento",
              icon: "pi pi-fw pi-money-bill",
              to: "/empresa/concesionario/financing",
            },
          ],
        },

        // =============================================
        // MÓDULO: FINANZAS
        // =============================================
        {
          label: "finanzas",
          icon: "pi pi-fw pi-dollar",
          items: [
            {
              label: "análisis financiero",
              icon: "pi pi-fw pi-chart-line",
              items: [
                {
                  label: "dashboard financiero",
                  icon: "pi pi-fw pi-chart-line",
                  to: "/empresa/finance",
                },
              ],
            },
            {
              label: "gestión de cuentas",
              icon: "pi pi-fw pi-wallet",
              items: [
                {
                  label: "cuentas por cobrar",
                  icon: "pi pi-fw pi-arrow-up",
                  to: "/empresa/finance/cuentas-cobrar",
                },
                {
                  label: "cuentas por pagar",
                  icon: "pi pi-fw pi-arrow-down",
                  to: "/empresa/finance/cuentas-pagar",
                },
              ],
            },
          ],
        },

        // =============================================
        // MÓDULO: CONFIGURACIÓN GENERAL
        // =============================================
        {
          label: "configuracion",
          icon: "pi pi-fw pi-cog",
          items: [
            {
              label: "sistema",
              icon: "pi pi-fw pi-server",
              items: [
                {
                  label: "configuración general",
                  icon: "pi pi-fw pi-cog",
                  to: "/empresa/configuracion/general",
                },
                {
                  label: "usuarios y permisos",
                  icon: "pi pi-fw pi-users",
                  to: "/empresa/configuracion/usuarios",
                },
              ],
            },
            {
              label: "reportes y analíticas",
              icon: "pi pi-fw pi-chart-bar",
              items: [
                {
                  label: "reportes financieros",
                  icon: "pi pi-fw pi-file-pdf",
                  to: "/empresa/reportes/financieros",
                },
                {
                  label: "reportes de operaciones",
                  icon: "pi pi-fw pi-chart-line",
                  to: "/empresa/reportes/operaciones",
                },
                {
                  label: "reportes de inventario",
                  icon: "pi pi-fw pi-box",
                  items: [
                    {
                      label: "dashboard",
                      icon: "pi pi-fw pi-th-large",
                      to: "/empresa/reportes/inventario",
                    },
                    {
                      label: "análisis abc",
                      icon: "pi pi-fw pi-chart-pie",
                      to: "/empresa/reportes/inventario/abc",
                    },
                    {
                      label: "análisis de rotación",
                      icon: "pi pi-fw pi-sync",
                      to: "/empresa/reportes/inventario/rotacion",
                    },
                    {
                      label: "pronósticos",
                      icon: "pi pi-fw pi-chart-bar",
                      to: "/empresa/reportes/inventario/pronosticos",
                    },
                    {
                      label: "stock bajo",
                      icon: "pi pi-fw pi-exclamation-triangle",
                      to: "/empresa/reportes/inventario/stock-bajo",
                    },
                    {
                      label: "stock muerto",
                      icon: "pi pi-fw pi-times-circle",
                      to: "/empresa/reportes/inventario/stock-muerto",
                    },
                    {
                      label: "valoración",
                      icon: "pi pi-fw pi-dollar",
                      to: "/empresa/reportes/inventario/valoracion",
                    },
                    {
                      label: "movimientos",
                      icon: "pi pi-fw pi-exchange",
                      to: "/empresa/reportes/inventario/movimientos",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  return <AppSubMenu model={model} />;
};

export default AppMenuEmpresa;
