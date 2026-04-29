"use client";
import React from "react";
import { motion } from "framer-motion";
import { Button } from "primereact/button";
import { useRouter } from "next/navigation";

interface UnderConstructionProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
}

const UnderConstruction: React.FC<UnderConstructionProps> = ({
  title = "En Construcción",
  message = "Estamos trabajando arduamente para traerte esta funcionalidad pronto.",
  showBackButton = true,
}) => {
  const router = useRouter();

  return (
    <div className="flex flex-column align-items-center justify-content-center h-full min-h-screen surface-ground px-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="surface-card p-6 shadow-2 border-round-3xl text-center flex flex-column align-items-center max-w-30rem w-full"
      >
        <motion.div
          animate={{
            rotate: [0, 10, -10, 10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 3,
          }}
          className="mb-4"
        >
          <div
            className="flex align-items-center justify-content-center border-circle bg-orange-100"
            style={{ width: "8rem", height: "8rem" }}
          >
            <i className="pi pi-briefcase text-orange-500 text-6xl"></i>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-900 font-bold text-3xl mb-3"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-600 font-medium line-height-3 mb-5"
        >
          {message}
        </motion.p>

        {showBackButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              label="Volver al Inicio"
              icon="pi pi-arrow-left"
              className="p-button-outlined p-button-rounded"
              onClick={() => router.push("/")}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default UnderConstruction;
