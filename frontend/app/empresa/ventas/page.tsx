"use client";

import QuickActions, {
  type QuickAction,
} from "@/components/common/QuickActions";
import SalesDashboard from "@/modules/sales/dashboard/components/SalesDashboard";

const SALES_ACTIONS: QuickAction[] = [
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
    description: "Prefacturas pendientes",
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
];

export default function VentasPage() {
  return (
    <div className="flex flex-column gap-4">
      <QuickActions actions={SALES_ACTIONS} icon="pi pi-shopping-cart" />
      <SalesDashboard />
    </div>
  );
}
