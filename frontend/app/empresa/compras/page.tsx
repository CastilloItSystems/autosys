"use client";

import { Divider } from "primereact/divider";
import QuickActions from "@/components/common/QuickActions";
import type { QuickAction } from "@/components/common/QuickActions";

type ComprasActionGroup = {
  title: string;
  icon: string;
  actions: QuickAction[];
};

const COMPRAS_ACTION_GROUPS: ComprasActionGroup[] = [
  {
    title: "Operación",
    icon: "pi pi-shopping-cart",
    actions: [
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
];

export default function ComprasPage() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-900 m-0">
          <i className="pi pi-shopping-bag mr-2 text-primary" />
          Compras
        </h2>
        <p className="text-500 text-sm m-0 mt-1">
          Proveedores, órdenes de compra y análisis de abastecimiento
        </p>
      </div>

      {COMPRAS_ACTION_GROUPS.map((group, index) => (
        <div key={group.title}>
          {index > 0 ? <Divider className="my-4" /> : null}
          <div className="flex align-items-center gap-2 mb-3">
            <i className={`${group.icon} text-cyan-500 text-sm`} />
            <span className="font-semibold text-700 text-sm">
              {group.title}
            </span>
          </div>
          <QuickActions actions={group.actions} showTitle={false} />
        </div>
      ))}
    </div>
  );
}
