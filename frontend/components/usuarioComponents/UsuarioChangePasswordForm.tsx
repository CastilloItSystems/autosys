"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "primereact/button";
import { Password } from "primereact/password";
import { classNames } from "primereact/utils";

import { updateUser, User } from "@/app/api/userService";

// Validación
const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
      .regex(/[0-9]/, "Debe contener al menos un número")
      .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof passwordSchema>;

interface UsuarioChangePasswordFormProps {
  usuario: User | null;
  onPasswordChanged?: () => void;
  hideUsuarioPasswordFormDialog?: () => void;
  showToast: (
    severity: "success" | "error" | "warn" | "info",
    summary: string,
    detail: string,
  ) => void;
}

const UsuarioChangePasswordForm = ({
  usuario,
  onPasswordChanged,
  hideUsuarioPasswordFormDialog,
  showToast,
}: UsuarioChangePasswordFormProps) => {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!usuario?.id) {
      showToast("error", "Error", "Usuario inválido");
      return;
    }

    try {
      setSubmitting(true);

      await updateUser(usuario.id, {
        password: data.newPassword,
      });

      showToast(
        "success",
        "Éxito",
        `Contraseña actualizada para ${usuario.nombre}`,
      );

      reset();
      hideUsuarioPasswordFormDialog?.();
      onPasswordChanged?.();
    } catch (error) {
      console.error("Error actualizando contraseña:", error);
      showToast("error", "Error", "No se pudo cambiar la contraseña");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-2">
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <div className="field mb-4">
          <label htmlFor="newPassword" className="block font-medium mb-2">
            Nueva contraseña
          </label>
          <Password
            id="newPassword"
            toggleMask
            feedback={false}
            className={classNames("w-full", {
              "p-invalid": errors.newPassword,
            })}
            inputClassName="w-full"
            {...register("newPassword")}
          />
          {errors.newPassword && (
            <small className="p-error">{errors.newPassword.message}</small>
          )}
        </div>

        <div className="field mb-4">
          <label htmlFor="confirmPassword" className="block font-medium mb-2">
            Confirmar contraseña
          </label>
          <Password
            id="confirmPassword"
            toggleMask
            feedback={false}
            className={classNames("w-full", {
              "p-invalid": errors.confirmPassword,
            })}
            inputClassName="w-full"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <small className="p-error">{errors.confirmPassword.message}</small>
          )}
        </div>

        <div className="mb-4 p-3 border-round surface-50">
          <strong>Requisitos:</strong>
          <ul className="mt-2 mb-0 pl-3 text-sm">
            <li
              className={classNames({
                "text-green-500": (watch("newPassword") || "").length >= 8,
              })}
            >
              Al menos 8 caracteres
            </li>
            <li
              className={classNames({
                "text-green-500": /[A-Z]/.test(watch("newPassword") || ""),
              })}
            >
              Al menos una letra mayúscula
            </li>
            <li
              className={classNames({
                "text-green-500": /[0-9]/.test(watch("newPassword") || ""),
              })}
            >
              Al menos un número
            </li>
            <li
              className={classNames({
                "text-green-500": /[^A-Za-z0-9]/.test(
                  watch("newPassword") || "",
                ),
              })}
            >
              Al menos un carácter especial
            </li>
            <li
              className={classNames({
                "text-green-500":
                  watch("newPassword") === watch("confirmPassword") &&
                  watch("newPassword") !== "",
              })}
            >
              Las contraseñas coinciden
            </li>
          </ul>
        </div>

        <div className="flex justify-content-end gap-3">
          <Button
            type="button"
            label="Cancelar"
            className="p-button-outlined p-button-secondary"
            onClick={() => {
              reset();
              hideUsuarioPasswordFormDialog?.();
            }}
            disabled={submitting}
          />
          <Button
            type="submit"
            label="Cambiar Contraseña"
            icon={submitting ? "pi pi-spin pi-spinner" : "pi pi-key"}
            disabled={submitting}
          />
        </div>
      </form>
    </div>
  );
};

export default UsuarioChangePasswordForm;
