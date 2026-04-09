"use client";

import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { motion } from "framer-motion";

interface QuickAction {
  label: string;
  icon: string;
  to: string;
  color: string;
  description: string;
}

const quickActions: QuickAction[] = [
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
    description: "Directorio CRM",
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
    icon: "pi pi-users",
    to: "/empresa/inventario/proveedores",
    color: "teal",
    description: "Directorio",
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
    label: "Órdenes de Trabajo",
    icon: "pi pi-wrench",
    to: "/empresa/workshop",
    color: "bluegray",
    description: "Taller de servicio",
  },
  {
    label: "Vehículos",
    icon: "pi pi-car",
    to: "/empresa/concesionario/vehicles",
    color: "gray",
    description: "Inventario",
  },
  {
    label: "Reportes Ventas",
    icon: "pi pi-chart-bar",
    to: "/empresa/ventas/reportes",
    color: "red",
    description: "Estadísticas y KPIs",
  },
  {
    label: "Movimientos",
    icon: "pi pi-history",
    to: "/empresa/inventario/movimientos",
    color: "yellow",
    description: "Historial y Kardex",
  },
];

export default function QuickActions() {
  const router = useRouter();

  return (
    <div className=" mb-0">
      <h5 className="mb-3">
        <i className="pi pi-bolt mr-2 text-primary"></i>
        Accesos Rápidos
      </h5>
      <div className="grid">
        {quickActions.map((action, idx) => (
          <div key={idx} className="col-6 md:col-3 lg:col-3 xl:col-2">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                className="card w-full p-3 flex flex-column align-items-center gap-2"
                severity="secondary"
                text
                onClick={() => router.push(action.to)}
                style={{
                  borderRadius: "12px",
                  border: "1px solid var(--surface-border)",
                  minHeight: "100px",
                }}
              >
                <div
                  className="flex align-items-center justify-content-center border-round-xl"
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    backgroundColor: `var(--${action.color}-100)`,
                  }}
                >
                  <i
                    className={`${action.icon} text-${action.color}-500 text-xl`}
                  ></i>
                </div>
                <span className="font-semibold text-900 text-sm">
                  {action.label}
                </span>
                <span className="text-500 text-xs">{action.description}</span>
              </Button>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}
