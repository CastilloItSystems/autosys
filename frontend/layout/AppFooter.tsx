import React, { useContext } from "react";
import { Button } from "primereact/button";
import { LayoutContext } from "./context/layoutcontext";

const AppFooter = () => {
  const { layoutConfig } = useContext(LayoutContext);

  return (
    <div className="layout-footer mt-auto">
      <div className="footer-start">
        <img
          src={
            "/layout/images/" +
            (layoutConfig.colorScheme === "light"
              ? "logo-AutoSys"
              : "logo-AutoSys") +
            ".ico"
          }
          alt="logo"
        />
        <span className="app-name">AutoSys</span>
      </div>
      <div className="footer-right">
        <a
          href="https://castilloitsystems.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          © Castillo It Systems
        </a>
      </div>
    </div>
  );
};

export default AppFooter;
