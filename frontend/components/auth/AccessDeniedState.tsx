"use client";

import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Ripple } from "primereact/ripple";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.1,
      duration: 0.35,
      when: "beforeChildren",
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface AccessDeniedStateProps {
  title?: string;
  message?: string;
  icon?: string;
  mode?: "page" | "content";
  showHelpLinks?: boolean;
  primaryLabel?: string;
  primaryPath?: string;
  showBackButton?: boolean;
}

const AccessDeniedState = ({
  title = "Acceso Denegado",
  message = "No tienes permisos para ver esta página. Si crees que es un error, contacta al administrador.",
  icon = "pi pi-ban",
  mode = "content",
  showHelpLinks = false,
  primaryLabel = "Ir al Dashboard",
  primaryPath = "/",
  showBackButton = true,
}: AccessDeniedStateProps) => {
  const router = useRouter();
  const isPage = mode === "page";

  const navigateToPrimary = () => {
    router.push(primaryPath);
  };

  const navigateToHelp = () => {
    router.push("/pages/help");
  };

  const navigateBack = () => {
    router.back();
  };

  return (
    <div
      className={
        isPage
          ? "surface-ground h-screen w-screen flex align-items-center justify-content-center"
          : "surface-ground border-round flex align-items-center justify-content-center p-3"
      }
      style={isPage ? undefined : { minHeight: "55vh" }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-11 sm:w-30rem text-center p-3 sm:p-5"
      >
        <Card className="p-4 surface-card shadow-3 border-round-2xl">
          <motion.div variants={itemVariants} className="mb-4">
            <i
              className={`${icon} text-5xl text-red-500 mb-3`}
              style={{ fontSize: "5rem" }}
            />
            <h1 className="text-4xl font-bold text-900 mt-0">{title}</h1>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-4">
            <p className="text-color-secondary text-lg mb-0">{message}</p>
          </motion.div>

          {showHelpLinks ? (
            <motion.ul
              variants={itemVariants}
              className="list-none p-0 m-0 mb-4"
            >
              <motion.li variants={itemVariants} className="mb-2">
                <button
                  type="button"
                  onClick={navigateToHelp}
                  className="flex align-items-center py-2 px-3 hover:surface-hover transition-colors transition-duration-150 border-round-md border-none surface-card w-full"
                  style={{ cursor: "pointer" }}
                >
                  <span className="inline-flex align-items-center justify-content-center flex-shrink-0 border-round bg-yellow-500 text-white w-3rem h-3rem">
                    <i className="pi pi-compass text-2xl" />
                  </span>
                  <span className="ml-3 text-left">
                    <span className="mb-2 font-bold text-color block">
                      Centro de Ayuda
                    </span>
                    <p className="m-0 text-color-secondary text-sm">
                      Accede a la base de conocimientos
                    </p>
                  </span>
                  <i className="ml-auto pi pi-chevron-right text-color" />
                  <Ripple />
                </button>
              </motion.li>
              <motion.li variants={itemVariants}>
                <button
                  type="button"
                  onClick={navigateToHelp}
                  className="flex align-items-center py-2 px-3 hover:surface-hover transition-colors transition-duration-150 border-round-md border-none surface-card w-full"
                  style={{ cursor: "pointer" }}
                >
                  <span className="inline-flex align-items-center justify-content-center flex-shrink-0 border-round bg-teal-500 text-white w-3rem h-3rem">
                    <i className="pi pi-user text-2xl" />
                  </span>
                  <span className="ml-3 text-left">
                    <span className="mb-2 font-bold text-color block">
                      Servicio al Cliente
                    </span>
                    <p className="m-0 text-color-secondary text-sm">
                      Obtén respuestas instantáneas
                    </p>
                  </span>
                  <i className="ml-auto pi pi-chevron-right text-color" />
                  <Ripple />
                </button>
              </motion.li>
            </motion.ul>
          ) : null}

          <motion.div variants={itemVariants} className="flex flex-column gap-3">
            <Button
              onClick={navigateToPrimary}
              label={primaryLabel}
              icon="pi pi-home"
              className="p-button-primary w-full"
            />
            {showBackButton ? (
              <Button
                onClick={navigateBack}
                label="Volver Atrás"
                icon="pi pi-arrow-left"
                className="p-button-secondary p-button-outlined w-full"
              />
            ) : null}
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
};

export default AccessDeniedState;
