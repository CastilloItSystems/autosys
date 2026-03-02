import Link from "next/link";
import React, { useContext } from "react";
import AppMenu from "./AppMenu";
import { LayoutContext } from "./context/layoutcontext";
import { MenuProvider } from "./context/menucontext";
import { usePathname } from "next/navigation";
import AppMenuEmpresa from "./AppMenuEmpresa";

const AppSidebar = () => {
  const { layoutConfig, setLayoutState } = useContext(LayoutContext);
  const pathname = usePathname();

  const anchor = () => {
    setLayoutState((prevLayoutState) => ({
      ...prevLayoutState,
      anchored: !prevLayoutState.anchored,
    }));
  };

  const renderMenu = () => {
    if (pathname.startsWith("/empresa")) {
      return <AppMenuEmpresa />;
    } else {
      return <AppMenu />;
    }
  };

  return (
    <React.Fragment>
      <div className="layout-menu-container">
        <MenuProvider>{renderMenu()}</MenuProvider>
      </div>
    </React.Fragment>
  );
};

AppSidebar.displayName = "AppSidebar";

export default AppSidebar;
