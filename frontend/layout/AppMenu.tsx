import AppSubMenu from "./AppSubMenu";
import type { MenuModel } from "@/types";

const AppMenu = () => {
  const model: MenuModel[] = [
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
  ];

  return <AppSubMenu model={model} />;
};

export default AppMenu;
