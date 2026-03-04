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
    label: "Artículos",
    icon: "pi pi-box",
    to: "/empresa/inventario/items",
    color: "blue",
    description: "Gestionar catálogo",
  },
  {
    label: "Stock Bajo",
    icon: "pi pi-exclamation-triangle",
    to: "/empresa/inventario/stock/low-stock",
    color: "orange",
    description: "Revisar alertas",
  },
  {
    label: "Movimientos",
    icon: "pi pi-exchange",
    to: "/empresa/inventario/movimientos",
    color: "purple",
    description: "Entradas y salidas",
  },
  {
    label: "Órdenes de Compra",
    icon: "pi pi-shopping-cart",
    to: "/empresa/inventario/ordenes-compra",
    color: "green",
    description: "Compras pendientes",
  },
  {
    label: "Órdenes de Venta",
    icon: "pi pi-money-bill",
    to: "/empresa/inventario/ordenes-venta",
    color: "cyan",
    description: "Ventas activas",
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
    color: "indigo",
    description: "Correcciones de stock",
  },
  {
    label: "Stock",
    icon: "pi pi-chart-bar",
    to: "/empresa/inventario/stock",
    color: "bluegray",
    description: "Listado completo",
  },
];

export default function QuickActions() {
  const router = useRouter();

  return (
    <div className="card mb-0">
      <h5 className="mb-3">
        <i className="pi pi-bolt mr-2 text-primary"></i>
        Accesos Rápidos
      </h5>
      <div className="grid">
        {quickActions.map((action, idx) => (
          <div key={idx} className="col-6 md:col-3 lg:col-3 xl:col-3">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                className="w-full p-3 flex flex-column align-items-center gap-2"
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
