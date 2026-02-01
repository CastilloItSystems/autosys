"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRefineriaStore } from "@/store/refineriaStore";
import { useSession } from "next-auth/react";
import { ProgressSpinner } from "primereact/progressspinner";
import { Button } from "primereact/button";
import { motion } from "framer-motion";
import GraficaRecepcionesPorRefineria from "./GraficaRecepcionesPorRefineria";
import FiltrosDashboard from "./FiltrosDashboard";
import GraficaDespachoPorRefineria from "./GraficaDespachoPorRefineria";
import { useRefineryDataFull } from "@/hooks/useRefineryDataFull";
import { useAutoSysDataFull } from "@/hooks/useAutoSysDataFull";
import useSWR from "swr";
import { useAutoSysStore } from "@/store/autoSysStore";

const DashboardMain = () => {
  const { data: session, status } = useSession();
  const user = session?.user;

  const { autoSyss = [], loading } = useAutoSysDataFull();
  console.log("autoSys", autoSyss);
  // Para refrescar datos globales con SWR
  const { mutate } = useSWR("autoSys-data-global");
  const { setActiveAutoSys } = useAutoSysStore();

  const router = useRouter();

  // Filtrar refinerías según el acceso del usuario
  const autoSysFilter = React.useMemo(() => {
    if (!Array.isArray(autoSyss)) return [];
    if (user?.usuario?.acceso === "completo") {
      return autoSyss;
    } else if (
      user?.usuario?.acceso === "limitado" &&
      Array.isArray(user?.usuario?.idAutoSys)
    ) {
      return autoSyss.filter((w: { id: string | undefined }) =>
        user?.usuario?.idAutoSys?.some((idObj) => idObj.id === w.id)
      );
    } else {
      return [];
    }
  }, [user, autoSyss]);

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

  const handleDivClick = (autoSys: any) => {
    setActiveAutoSys(autoSys);
    router.push("/autosys/");
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
  if (!loading && autoSyss.length === 0) {
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
        <h3 className="mt-3">No tienes autoSyss</h3>
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
        {Array.isArray(autoSysFilter) &&
          autoSysFilter.length > 0 &&
          autoSysFilter.map((autoSys, idx) => (
            <motion.div
              key={autoSys.id}
              className="col-12 md:col-6 lg:col-4 xl:col-3 p-2 clickable"
              onClick={() => handleDivClick(autoSys)}
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
                    src={autoSys.img}
                    alt={autoSys.nombre}
                    width={100}
                    height={100}
                    className="rounded-lg shadow-4 object-cover mb-3 md:mb-0 md:mr-3 card p-0"
                    style={{ background: "#f4f6fa" }}
                  />
                  <div className="ml-3">
                    <span className="text-primary block white-space-nowrap text-xs font-medium opacity-80">
                      {autoSys.ubicacion}
                    </span>
                    <span className="text-primary block text-2xl md:text-3xl font-bold mb-1">
                      {autoSys.nombre}
                    </span>
                    <span className="text-primary block white-space-nowrap text-xs opacity-70">
                      {autoSys.rif}
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
