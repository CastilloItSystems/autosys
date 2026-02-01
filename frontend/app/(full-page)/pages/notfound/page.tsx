"use client";

import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import React from "react";
import { motion } from "framer-motion";
import { Card } from "primereact/card";
import { Ripple } from "primereact/ripple";

// Variantes de animación para los elementos
const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.3,
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const NotFound = () => {
  const router = useRouter();

  const navigateToDashboard = () => {
    router.push("/");
  };
  const navigateToHelp = () => {
    router.push("/pages/help");
  };
  const navigateBack = () => {
    router.back();
  };

  return (
    <div className="surface-ground h-screen w-screen flex align-items-center justify-content-center">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-11 sm:w-30rem text-center p-3 sm:p-5"
      >
        <Card className="p-4 surface-card shadow-3 border-round-2xl">
          <motion.div variants={itemVariants} className="mb-4">
            <i
              className="pi pi-exclamation-triangle text-5xl text-orange-500 mb-3"
              style={{ fontSize: "5rem" }}
            ></i>
            <h1 className="text-4xl font-bold text-900 mt-0">
              Página No Encontrada
            </h1>
          </motion.div>
          <motion.div variants={itemVariants} className="mb-4">
            <p className="text-color-secondary text-lg mb-0">
              Parece que estás perdido. Puedes intentar estas opciones o volver
              al{" "}
              <a
                onClick={navigateToDashboard}
                className="font-bold text-primary hover:underline"
                style={{ cursor: "pointer" }}
              >
                dashboard
              </a>
              .
            </p>
          </motion.div>

          <motion.ul variants={itemVariants} className="list-none p-0 m-0 mb-4">
            <motion.li variants={itemVariants} className="mb-2">
              <a
                onClick={navigateToHelp}
                className="flex align-items-center py-2 px-3 hover:surface-hover transition-colors transition-duration-150 border-round-md"
                style={{ cursor: "pointer" }}
              >
                <span className="inline-flex align-items-center justify-content-center flex-shrink-0 border-round bg-yellow-500 text-white w-3rem h-3rem">
                  <i className="pi pi-compass text-2xl"></i>
                </span>
                <span className="ml-3 text-left">
                  <span className="mb-2 font-bold text-color block">
                    Centro de Ayuda
                  </span>
                  <p className="m-0 text-color-secondary text-sm">
                    Accede a la base de conocimientos
                  </p>
                </span>
                <i className="ml-auto pi pi-chevron-right text-color"></i>
                <Ripple />
              </a>
            </motion.li>
            <motion.li variants={itemVariants}>
              <a
                onClick={navigateToHelp}
                className="flex align-items-center py-2 px-3 hover:surface-hover transition-colors transition-duration-150 border-round-md"
                style={{ cursor: "pointer" }}
              >
                <span className="inline-flex align-items-center justify-content-center flex-shrink-0 border-round bg-teal-500 text-white w-3rem h-3rem">
                  <i className="pi pi-user text-2xl"></i>
                </span>
                <span className="ml-3 text-left">
                  <span className="mb-2 font-bold text-color block">
                    Servicio al Cliente
                  </span>
                  <p className="m-0 text-color-secondary text-sm">
                    Obtén respuestas instantáneas
                  </p>
                </span>
                <i className="ml-auto pi pi-chevron-right text-color"></i>
                <Ripple />
              </a>
            </motion.li>
          </motion.ul>

          <motion.div
            variants={itemVariants}
            className="flex flex-column gap-3"
          >
            <Button
              onClick={navigateToDashboard}
              label="Ir al Dashboard"
              icon="pi pi-home"
              className="p-button-primary w-full"
            />
            <Button
              onClick={navigateBack}
              label="Volver Atrás"
              icon="pi pi-arrow-left"
              className="p-button-secondary p-button-outlined w-full"
            />
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
};

export default NotFound;
