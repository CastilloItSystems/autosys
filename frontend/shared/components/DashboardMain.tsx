"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProgressSpinner } from "primereact/progressspinner";
import { Button } from "primereact/button";
import { motion } from "framer-motion";
import useSWR from "swr";
import { useEmpresaDataFull } from "@/modules/companies/hooks/useEmpresasDataFull";
import { useEmpresasStore } from "@/modules/companies/store/empresasStore";

const DashboardMain = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const { empresas = [], loading } = useEmpresaDataFull();

  // Para refrescar datos globales con SWR
  const { mutate } = useSWR("empresa-data-global");
  const { setActiveEmpresa } = useEmpresasStore();

  // Filtrar empresas según el acceso del usuario
  const empresasFilter = React.useMemo(() => {
    if (!Array.isArray(empresas)) return [];

    // Ajuste: Accedemos directamente a las propiedades del objeto user, ya que no tiene una propiedad 'usuario' anidada según tu log.
    const acceso = user?.access;
    const userEmpresas = user?.empresas;

    if (acceso === "full") {
      return empresas;
    } else if (acceso === "limited" && Array.isArray(userEmpresas)) {
      return empresas.filter((w: any) =>
        userEmpresas.some((userEmpresa: any) => userEmpresa.empresaId === w.id),
      );
    } else {
      return [];
    }
  }, [user, empresas]);
  console.log(empresas);
  // Evitar problemas de hidratación: solo renderizar cuando la sesión esté lista
  if (status === "loading" || loading) {
    return (
      <div
        className="flex justify-content-center align-items-center"
        style={{ height: "300px" }}
      >
        <ProgressSpinner />
      </div>
    );
  }

  const handleDivClick = (empresa: any) => {
    setActiveEmpresa(empresa);
    router.push("/empresa/");
  };

  // show spinner while loading
  if (loading) {
    return (
      <div
        className="flex justify-content-center align-items-center"
        style={{ height: "300px" }}
      >
        <ProgressSpinner />
      </div>
    );
  }

  // empty state if no autoSyss
  if (!loading && empresas.length === 0) {
    return (
      <div
        className="flex flex-column align-items-center justify-content-center"
        style={{ height: "300px" }}
      >
        <img
          src="/layout/images/pages/auth/access-denied.svg"
          alt="Sin datos"
          width={120}
        />
        <h3 className="mt-3">No tienes Empresa</h3>
        <p className="text-500">
          Contacta al administrador para solicitar acceso.
        </p>
        <Button
          label="Recargar"
          icon="pi pi-refresh"
          onClick={() => mutate()}
          className="mt-2"
        />
      </div>
    );
  }
  return (
    <>
      <div className="grid">
        {Array.isArray(empresasFilter) &&
          empresasFilter.length > 0 &&
          empresasFilter.map((empresa, idx) => (
            <motion.div
              key={empresa.id}
              className="col-12 md:col-6 lg:col-4 xl:col-4 p-2 clickable"
              onClick={() => handleDivClick(empresa)}
              initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              transition={{
                duration: 0.6,
                delay: idx * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{
                scale: 1.03,
                // boxShadow: "0 8px 32px 0 rgba(0,0,0,0.12)",
              }}
              whileTap={{ scale: 0.98 }}
              style={{ cursor: "pointer" }}
            >
              <div className="card h-full flex flex-column surface-card hover:surface-hover transition-colors transition-duration-300">
                <div className="flex flex-column md:flex-row align-items-center ">
                  <img
                    src={empresa.logoUrl || "/demo/images/nature/nature1.jpg"}
                    alt={empresa.name}
                    width={100}
                    height={100}
                    className="rounded-lg shadow-4 object-cover mb-3 md:mb-0 md:mr-3 card p-0"
                    style={{ background: "#f4f6fa" }}
                  />
                  <div className="ml-3">
                    {/* <span className="text-primary block white-space-nowrap text-xs font-medium opacity-80">
                      {empresa.direccion}
                    </span> */}
                    <span className="text-primary block text-2xl md:text-3xl font-bold mb-1">
                      {empresa.prefixName}
                    </span>
                    <span className="text-primary block white-space-nowrap text-xs opacity-70">
                      {empresa.rif}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
      </div>
    </>
  );
};

export default DashboardMain;
