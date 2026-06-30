"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProgressSpinner } from "primereact/progressspinner";
import { Button } from "primereact/button";
import { motion } from "framer-motion";
import Image from "next/image";
import { useEmpresaDataFull } from "@/hooks/useEmpresasDataFull";
import { useEmpresasStore } from "@/store/empresasStore";
import AutoFitText from "@/components/common/AutoFitText";
import type { Empresa } from "@/modules/companies/interfaces/empresa.interface";

const DashboardMain = () => {
  const router = useRouter();
  const { status } = useSession();
  const {
    empresas = [],
    loading,
    mutateEmpresaDataFull,
  } = useEmpresaDataFull();

  const activeEmpresaId = useEmpresasStore(
    (state) => state.activeEmpresa?.id_empresa,
  );
  const setActiveEmpresa = useEmpresasStore((state) => state.setActiveEmpresa);
  const clearActiveEmpresa = useEmpresasStore(
    (state) => state.clearActiveEmpresa,
  );

  useEffect(() => {
    if (loading || !activeEmpresaId) return;

    const activeEmpresaStillAvailable = empresas.some(
      (empresa) => empresa.id_empresa === activeEmpresaId,
    );
    if (!activeEmpresaStillAvailable) {
      clearActiveEmpresa();
    }
  }, [activeEmpresaId, clearActiveEmpresa, empresas, loading]);

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

  const handleDivClick = (empresa: Empresa) => {
    setActiveEmpresa(empresa);
    router.push("/empresa/");
  };

  // empty state if no autoSyss
  if (!loading && empresas.length === 0) {
    return (
      <div
        className="flex flex-column align-items-center justify-content-center"
        style={{ height: "300px" }}
      >
        <Image
          src="/layout/images/pages/auth/access-denied.svg"
          alt="Sin datos"
          width={120}
          height={120}
        />
        <h3 className="mt-3">No tienes Empresa</h3>
        <p className="text-500">
          Contacta al administrador para solicitar acceso.
        </p>
        <Button
          label="Recargar"
          icon="pi pi-refresh"
          onClick={() => mutateEmpresaDataFull()}
          className="mt-2"
        />
      </div>
    );
  }
  return (
    <>
      <div className="grid">
        {Array.isArray(empresas) &&
          empresas.length > 0 &&
          empresas.map((empresa, idx) => (
            <motion.div
              key={empresa.id_empresa}
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
                <div className="flex flex-column md:flex-row align-items-center w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={empresa.logo_url || "/demo/images/nature/nature1.jpg"}
                    alt={empresa.nombre}
                    width={100}
                    height={100}
                    className="rounded-lg shadow-4 object-cover mb-3 md:mb-0 md:mr-3 card p-0 flex-shrink-0"
                    style={{ background: "#f4f6fa" }}
                  />
                  <div className="ml-3 flex-1 min-w-0 text-center md:text-left">
                    {/* <span className="text-primary block white-space-nowrap text-xs font-medium opacity-80">
                      {empresa.direccion}
                    </span> */}
                    <div className="mb-1">
                      <AutoFitText
                        text={empresa.name_prefijo}
                        className="text-primary font-bold"
                        maxFontSize={30}
                        minFontSize={14}
                      />
                    </div>
                    <span
                      className="text-primary block text-xs opacity-70"
                      style={{ overflowWrap: "anywhere" }}
                    >
                      {empresa.numerorif}
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
