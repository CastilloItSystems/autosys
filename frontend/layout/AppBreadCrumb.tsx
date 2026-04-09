import { usePathname } from "next/navigation";
import { ObjectUtils } from "primereact/utils";
import React, { useContext, useEffect, useState } from "react";
import type { AppBreadcrumbProps, Breadcrumb } from "@/types";
import { LayoutContext } from "./context/layoutcontext";
import Link from "next/link";
import { useEmpresasStore } from "@/store/empresasStore";

const AppBreadcrumb = (props: AppBreadcrumbProps) => {
  const pathname = usePathname();
  const [breadcrumb, setBreadcrumb] = useState<Breadcrumb | null>(null);
  const { breadcrumbs } = useContext(LayoutContext);
  const { activeEmpresa } = useEmpresasStore();

  useEffect(() => {
    const filteredBreadcrumbs = breadcrumbs?.find((crumb: Breadcrumb) => {
      return crumb.to?.replace(/\/$/, "") === pathname.replace(/\/$/, "");
    });
    setBreadcrumb(filteredBreadcrumbs ?? null);
  }, [pathname, breadcrumbs]);

  return (
    <div className={props.className}>
      <nav className="layout-breadcrumb">
        <ol>
          <li>
            <Link
              href={pathname.startsWith("/empresa") ? "/empresa" : "/"}
              style={{ color: "inherit" }}
            >
              <i className="pi pi-home"></i>
            </Link>
          </li>
          <li className="layout-breadcrumb-chevron"> / </li>
          {ObjectUtils.isNotEmpty(breadcrumb) &&
          pathname !== "/" &&
          pathname !== "/dashboard-sales" ? (
            breadcrumb?.labels?.map((label, index) => {
              const displayLabel =
                index === 0 &&
                label === "Empresa" &&
                activeEmpresa?.name_prefijo
                  ? activeEmpresa.name_prefijo
                  : label;
              return (
                <React.Fragment key={index}>
                  {index !== 0 && (
                    <li className="layout-breadcrumb-chevron"> / </li>
                  )}
                  <li
                    key={index}
                    className={
                      index === 0 &&
                      displayLabel === activeEmpresa?.name_prefijo
                        ? "font-bold text-primary"
                        : ""
                    }
                  >
                    {displayLabel}
                  </li>
                </React.Fragment>
              );
            })
          ) : (
            <>
              {pathname === "/" && <li key={"home"}>Centro de Operaciones</li>}
              {pathname.startsWith("/empresa") &&
                activeEmpresa?.name_prefijo && (
                  <li key={"empresa"} className="font-bold text-primary">
                    {activeEmpresa.name_prefijo}
                  </li>
                )}
              {pathname === "/dashboard-sales" && (
                <li key={"banking"}>Sales Dashboard</li>
              )}
            </>
          )}
        </ol>
      </nav>
    </div>
  );
};

export default AppBreadcrumb;
