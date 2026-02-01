"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "primereact/button";
import React from "react";

import type { Page } from "@/types";
import Link from "next/link";

const Error: Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const navigateToDashboard = () => {
    router.push("/");
  };

  const navigateToLogin = () => {
    router.push("/auth/login");
  };

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return "Hay un problema con la configuración del servidor.";
      case "AccessDenied":
        return "Acceso denegado. No tienes permisos para acceder.";
      case "Verification":
        return "El enlace de verificación ha expirado o ya ha sido utilizado.";
      case "Default":
        return "Ha ocurrido un error inesperado.";
      default:
        return "Ha ocurrido un error inesperado durante la autenticación.";
    }
  };

  return (
    <>
      <div className="surface-ground h-screen w-screen flex align-items-center justify-content-center">
        <div
          className="surface-card py-7 px-5 sm:px-7 shadow-2 flex flex-column w-11 sm:w-30rem"
          style={{ borderRadius: "14px" }}
        >
          <h1 className="font-bold text-2xl mt-0 mb-2">
            ERROR DE AUTENTICACIÓN
          </h1>
          <p className="text-color-secondary mb-4">{getErrorMessage(error)}</p>
          <img
            src="/layout/images/pages/auth/error.svg"
            alt="error"
            className="mb-4 align-self-center"
          />
          <div className="flex gap-2">
            <Button
              label="Ir al Login"
              onClick={navigateToLogin}
              className="flex-1"
            ></Button>
            <Button
              label="Ir al Dashboard"
              onClick={navigateToDashboard}
              className="flex-1"
              outlined
            ></Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Error;
