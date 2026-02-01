"use client";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";
import { Usuario } from "@/libs/interfaces";
import { updateUser } from "@/app/api/userService";

// Esquema de validación con Zod
const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
      .regex(/[0-9]/, "Debe contener al menos un número")
      .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial"),
    password: z.string(),
  })
  .refine((data) => data.newPassword === data.password, {
    message: "Las contraseñas no coinciden",
    path: ["password"],
  });

type FormData = z.infer<typeof passwordSchema>;

interface UsuarioChangePasswordFormProps {
  usuario: any;
  onPasswordChanged?: () => void;
  hideUsuarioPasswordFormDialog?: () => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
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
      password: "",
    },
  });

  const handleAdminChangePassword = async (
    userId: string,
    newPassword: string
  ) => {
    // Simulación de llamada a la API
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simular un 10% de probabilidad de error
        if (Math.random() < 0.1) {
          reject(new Error("Error en el servidor"));
        } else {
          resolve({ success: true });
        }
      }, 1000);
    });
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (usuario) {
        // Actualizar el usuario en el backend
        const usuarioActualizado = await updateUser(usuario.id, data);

        if (usuarioActualizado) {
          // Si se actualiza correctamente, mostrar notificación de éxito
          showToast("success", "Éxito", "Contraseña cambiada correctamente");
          reset();
          hideUsuarioPasswordFormDialog?.();
          onPasswordChanged?.();

          // Si es un administrador, cambiar la contraseña del usuario
          if (usuario.isAdmin) {
            await handleAdminChangePassword(usuario.id, data.newPassword);
          }
        } else {
          // Mostrar notificación de error si no se encuentra el usuario
          showToast("error", "Error", "No se pudo actualizar la contraseña");
        }
      }
    } catch (error) {
      // Mostrar notificación de error si algo falla
      showToast("error", "Error", "Ocurrió un error al procesar la solicitud");
      console.error("Error al procesar la solicitud:", error);
    } finally {
      // Redirigir después de que todo esté completo
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-900 font-bold text-xl mb-5">Cambiar Contraseña</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <div className="grid">
          <div className="col-12 md:col-6">
            <div className="field mb-4">
              <label
                htmlFor="newPassword"
                className="block text-900 font-medium mb-2"
              >
                Nueva Contraseña
              </label>
              <InputText
                id="newPassword"
                type="password"
                placeholder="Ingrese nueva contraseña"
                className={classNames("w-full", {
                  "p-invalid": errors.newPassword,
                })}
                {...register("newPassword")}
              />
              {errors.newPassword && (
                <small className="p-error block mt-1">
                  {errors.newPassword.message}
                </small>
              )}
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field mb-4">
              <label
                htmlFor="password"
                className="block text-900 font-medium mb-2"
              >
                Confirmar Contraseña
              </label>
              <InputText
                id="password"
                type="password"
                placeholder="Confirme la contraseña"
                className={classNames("w-full", {
                  "p-invalid": errors.password,
                })}
                {...register("password")}
              />
              {errors.password && (
                <small className="p-error block mt-1">
                  {errors.password.message}
                </small>
              )}
            </div>
          </div>
        </div>

        <div className="field mb-4">
          <div className="p-3 bg-blue-50 border-round">
            <h4 className="mt-0 mb-2 text-blue-700">
              Requisitos de contraseña:
            </h4>
            <ul className="m-0 p-0 pl-3">
              <li
                className={classNames({
                  "text-green-500": watch("newPassword")?.length >= 8,
                })}
              >
                Mínimo 8 caracteres
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
                    watch("newPassword") || ""
                  ),
                })}
              >
                Al menos un carácter especial
              </li>
              <li
                className={classNames({
                  "text-green-500":
                    watch("newPassword") === watch("password") &&
                    watch("newPassword") !== "",
                })}
              >
                Las contraseñas coinciden
              </li>
            </ul>
          </div>
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
