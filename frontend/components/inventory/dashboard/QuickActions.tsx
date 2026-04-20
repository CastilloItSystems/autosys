"use client";

import QuickActions from "@/components/common/QuickActions";
import type { QuickAction } from "@/components/common/QuickActions";

export const INVENTORY_ACTIONS: QuickAction[] = [
  {
    label: "Artículos",
    icon: "pi pi-box",
    to: "/empresa/inventario/items",
    color: "purple",
    description: "Catálogo maestro",
  },
  {
    label: "Stock",
    icon: "pi pi-chart-bar",
    to: "/empresa/inventario/stock",
    color: "blue",
    description: "Disponibilidad",
  },
  {
    label: "Órdenes de Venta",
    icon: "pi pi-money-bill",
    to: "/empresa/inventario/ordenes-venta",
    color: "green",
    description: "Gestión de ventas",
  },
  {
    label: "Facturas",
    icon: "pi pi-file",
    to: "/empresa/inventario/invoice",
    color: "blue",
    description: "Cuentas por cobrar",
  },
  {
    label: "Clientes",
    icon: "pi pi-users",
    to: "/empresa/inventario/clientes",
    color: "indigo",
    description: "Directorio",
  },
  {
    label: "Órdenes de Compra",
    icon: "pi pi-shopping-cart",
    to: "/empresa/inventario/ordenes-compra",
    color: "cyan",
    description: "Abastecimiento",
  },
  {
    label: "Proveedores",
    icon: "pi pi-truck",
    to: "/empresa/inventario/proveedores",
    color: "teal",
    description: "Directorio",
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
    label: "Transferencias",
    icon: "pi pi-arrows-h",
    to: "/empresa/inventario/transferencias",
    color: "teal",
    description: "Entre almacenes",
  },
  {
    label: "Movimientos",
    icon: "pi pi-history",
    to: "/empresa/inventario/movimientos",
    color: "yellow",
    description: "Historial y Kardex",
  },
  {
    label: "Almacenes",
    icon: "pi pi-building",
    to: "/empresa/inventario/almacenes",
    color: "bluegray",
    description: "Gestión de bodegas",
  },
];

export default function InventoryQuickActions() {
  return <QuickActions actions={INVENTORY_ACTIONS} icon="pi pi-box" />;
}
