"use client";

import React from "react";
import { classNames } from "primereact/utils";
import { z } from "zod";

interface PasswordRequirementsProps {
  password?: string;
  confirmPassword?: string;
  showConfirm?: boolean;
}

export const PasswordRequirements = ({
  password = "",
  confirmPassword = "",
  showConfirm = true,
}: PasswordRequirementsProps) => {
  const p = password || "";

  const hasLength = p.length >= 6;

  const hasMix = (() => {
    let conditions = 0;
    if (/[A-Z]/.test(p)) conditions++;
    if (/[a-z]/.test(p)) conditions++;
    if (/[0-9]/.test(p)) conditions++;
    if (/[^A-Za-z0-9]/.test(p)) conditions++;
    return conditions >= 2;
  })();

  const passwordsMatch = p === confirmPassword && p !== "";

  return (
    <div className="mb-4 p-3 border-round surface-50">
      <strong>Requisitos:</strong>
      <ul className="mt-2 mb-0 pl-3 text-sm">
        <li className={classNames({ "text-green-500": hasLength })}>
          Al menos 6 caracteres
        </li>
        <li className={classNames({ "text-green-500": hasMix })}>
          Mezcla de al menos 2 (mayúsculas, minúsculas, números o símbolos)
        </li>
        {showConfirm && (
          <li className={classNames({ "text-green-500": passwordsMatch })}>
            Las contraseñas coinciden
          </li>
        )}
      </ul>
    </div>
  );
};

export const passwordValidator = z
  .string()
  .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
  .refine(
    (val) => {
      let conditionsMet = 0;
      if (/[A-Z]/.test(val)) conditionsMet++;
      if (/[a-z]/.test(val)) conditionsMet++;
      if (/[0-9]/.test(val)) conditionsMet++;
      if (/[^A-Za-z0-9]/.test(val)) conditionsMet++;
      return conditionsMet >= 2;
    },
    {
      message:
        "Debe combinar al menos 2 tipos: mayúsculas, minúsculas, números o símbolos",
    },
  );

export const optionalPasswordValidator = z
  .string()
  .optional()
  .transform((val) => (val === "" ? undefined : val))
  .refine((val) => val === undefined || val.length >= 6, {
    message: "La contraseña debe tener al menos 6 caracteres",
  })
  .refine(
    (val) => {
      if (val === undefined) return true;
      let conditionsMet = 0;
      if (/[A-Z]/.test(val)) conditionsMet++;
      if (/[a-z]/.test(val)) conditionsMet++;
      if (/[0-9]/.test(val)) conditionsMet++;
      if (/[^A-Za-z0-9]/.test(val)) conditionsMet++;
      return conditionsMet >= 2;
    },
    {
      message:
        "Debe combinar al menos 2 tipos: mayúsculas, minúsculas, números o símbolos",
    },
  );
