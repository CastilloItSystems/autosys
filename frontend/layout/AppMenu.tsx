import AppSubMenu from "./AppSubMenu";
import type { MenuModel } from "@/types";

const AppMenu = () => {
  const model: MenuModel[] = [
    {
      label: "Dashboards",
      icon: "pi pi-home",
      items: [
        {
          label: "Operaciones",
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
      label: "Gestión de Usuarios",
      icon: "pi pi-fw pi-user",
      items: [
        {
          label: "Lista",
          icon: "pi pi-fw pi-list",
          to: "/users/list",
        },
        {
          label: "Crear",
          icon: "pi pi-fw pi-plus",
          to: "/users/create",
        },
      ],
    },
    {
      label: "Gestión de Gastos",
      icon: "pi pi-fw pi-user",
      items: [
        {
          label: "Partidas",
          icon: "pi pi-fw pi-truck",
          to: "/partidas",
        },
      ],
    },

    {
      label: "Gestión de AutoSysList",
      icon: "pi pi-fw pi-user",
      items: [
        {
          label: "Lista",
          icon: "pi pi-fw pi-list",
          to: "/all-autosys/list",
        },
        {
          label: "Crear",
          icon: "pi pi-fw pi-plus",
          to: "/all-autosys/create",
        },
      ],
    },
  ];

  return <AppSubMenu model={model} />;
};

export default AppMenu;
