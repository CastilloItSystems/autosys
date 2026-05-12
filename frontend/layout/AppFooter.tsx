import React, { useContext } from "react";
import { Button } from "primereact/button";
import Image from "next/image";
import { LayoutContext } from "./context/layoutcontext";

const AppFooter = () => {
  const { layoutConfig } = useContext(LayoutContext);

  return (
    <div className="layout-footer mt-auto">
      <div className="footer-start">
        <Image
          src="/layout/images/logo-AutoSys.ico"
          alt="logo"
          width={32}
          height={32}
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
