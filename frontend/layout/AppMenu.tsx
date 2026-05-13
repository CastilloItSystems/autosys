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
