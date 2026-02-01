import { useRefineriaStore } from "@/store/refineriaStore";
import AppSubMenu from "./AppSubMenu";
import type { MenuModel } from "@/types";
import { useAutoSysStore } from "@/store/autoSysStore";
import { useVentasStore } from "@/store/ventasStore";
import { Badge } from "primereact/badge";

const AppMenuAutoSys = () => {
  const { activeAutoSys } = useAutoSysStore();
  const { obtenerEstadisticas } = useVentasStore();
  const estadisticas = obtenerEstadisticas();

  const model: MenuModel[] = [
    // =============================================
    // DASHBOARDS Y OPERACIONES PRINCIPALES
    // =============================================
    {
      label: activeAutoSys?.nombre || "Selecciona un AutoSys",
      icon: "pi pi-home",
      items: [
        {
          label: "Dashboard de Operaciones",
          icon: "pi pi-fw pi-chart-line",
          to: "/autosys/operation",
        },
        {
          label: "Dashboard de Finanzas",
          icon: "pi pi-fw pi-dollar",
          to: "/autosys/finance",
        },
        {
          label: "Dashboard de Ventas",
          icon: "pi pi-fw pi-shopping-cart",
          to: "/autosys/ventas",
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
            {
              label: "configuraciones",
              icon: "pi pi-fw pi-cog",
              items: [
                {
                  label: "categorias",
                  icon: "pi pi-fw pi-tags",
                  to: "/autosys/inventario/categorias",
                },
                {
                  label: "marcas",
                  icon: "pi pi-fw pi-flag",
                  to: "/autosys/inventario/marcas",
                },
                {
                  label: "modelos",
                  icon: "pi pi-fw pi-book",
                  to: "/autosys/inventario/modelos",
                },
                {
                  label: "unidades de medida",
                  icon: "pi pi-fw pi-box",
                  to: "/autosys/inventario/unidades",
                },
                {
                  label: "proveedores",
                  icon: "pi pi-fw pi-users",
                  to: "/autosys/inventario/proveedores",
                },
                {
                  label: "almacenes",
                  icon: "pi pi-fw pi-database",
                  to: "/autosys/inventario/almacenes",
                },
              ],
            },
            {
              label: "operaciones diarias",
              icon: "pi pi-fw pi-refresh",
              items: [
                {
                  label: "artículos",
                  icon: "pi pi-fw pi-box",
                  to: "/autosys/inventario/items",
                },
                {
                  label: "stock actual",
                  icon: "pi pi-fw pi-chart-bar",
                  to: "/autosys/inventario/stock",
                },
                {
                  label: "movimientos",
                  icon: "pi pi-fw pi-exchange",
                  to: "/autosys/inventario/movimientos",
                },
              ],
            },
            {
              label: "compras y ventas",
              icon: "pi pi-fw pi-shopping-cart",
              items: [
                {
                  label: "órdenes de compra",
                  icon: "pi pi-fw pi-shopping-cart",
                  to: "/autosys/inventario/ordenes-compra",
                },
                {
                  label: "órdenes de venta",
                  icon: "pi pi-fw pi-money-bill",
                  to: "/autosys/inventario/ordenes-venta",
                },
                {
                  label: "reservas",
                  icon: "pi pi-fw pi-bookmark",
                  to: "/autosys/inventario/reservas",
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
                  to: "/autosys/crm/vehiculos/marcas",
                },
                {
                  label: "modelos de vehículos",
                  icon: "pi pi-fw pi-list",
                  to: "/autosys/crm/vehiculos/modelos",
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
                  to: "/autosys/workshop/service-categories",
                },
                {
                  label: "subcategorías de servicios",
                  icon: "pi pi-fw pi-tag",
                  to: "/autosys/workshop/service-subcategories",
                },
                {
                  label: "estados de órdenes",
                  icon: "pi pi-fw pi-tags",
                  to: "/autosys/workshop/work-order-statuses",
                },
                {
                  label: "servicios",
                  icon: "pi pi-fw pi-cog",
                  to: "/autosys/workshop/services",
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
                  to: "/autosys/operation/service-bays",
                },
                {
                  label: "dashboard órdenes de trabajo",
                  icon: "pi pi-fw pi-chart-line",
                  to: "/autosys/operation/workshop",
                },
                {
                  label: "gestión órdenes de trabajo",
                  icon: "pi pi-fw pi-file-edit",
                  to: "/autosys/workshop",
                },
                {
                  label: "gestión de puestos",
                  icon: "pi pi-fw pi-sitemap",
                  to: "/autosys/workshop/service-bays",
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
                  to: "/autosys/workshop/invoices",
                },
                {
                  label: "pagos",
                  icon: "pi pi-fw pi-money-bill",
                  to: "/autosys/workshop/payments",
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
              to: "/autosys/concesionario",
            },
            {
              label: "inventario de vehículos",
              icon: "pi pi-fw pi-car",
              to: "/autosys/concesionario/vehicles",
            },
            {
              label: "cotizaciones",
              icon: "pi pi-fw pi-file-text",
              to: "/autosys/concesionario/quotes",
            },
            {
              label: "financiamiento",
              icon: "pi pi-fw pi-money-bill",
              to: "/autosys/concesionario/financing",
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
                  to: "/autosys/finance",
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
                  to: "/autosys/finance/cuentas-cobrar",
                },
                {
                  label: "cuentas por pagar",
                  icon: "pi pi-fw pi-arrow-down",
                  to: "/autosys/finance/cuentas-pagar",
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
                  to: "/autosys/configuracion/general",
                },
                {
                  label: "usuarios y permisos",
                  icon: "pi pi-fw pi-users",
                  to: "/autosys/configuracion/usuarios",
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
                  to: "/autosys/reportes/financieros",
                },
                {
                  label: "reportes de operaciones",
                  icon: "pi pi-fw pi-chart-line",
                  to: "/autosys/reportes/operaciones",
                },
                {
                  label: "reportes de inventario",
                  icon: "pi pi-fw pi-box",
                  to: "/autosys/reportes/inventario",
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

export default AppMenuAutoSys;
