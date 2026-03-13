"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Password } from "primereact/password";
import { classNames } from "primereact/utils";

import { updateUser, User } from "@/app/api/userService";
import { handleFormError } from "@/utils/errorHandlers";
import {
  PasswordRequirements,
  passwordValidator,
} from "./PasswordRequirements";

// Validación
const passwordSchema = z
  .object({
    newPassword: passwordValidator,
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
  toast: React.RefObject<any>;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

const UsuarioChangePasswordForm = ({
  usuario,
  onPasswordChanged,
  hideUsuarioPasswordFormDialog,
  toast,
  formId = "password-form",
  onSubmittingChange,
}: UsuarioChangePasswordFormProps) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(passwordSchema),
    mode: "onBlur",
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!usuario?.id) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Usuario inválido",
      });
      return;
    }

    if (onSubmittingChange) onSubmittingChange(true);

    try {
      await updateUser(usuario.id, {
        password: data.newPassword,
      });

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Contraseña actualizada para ${usuario.nombre}`,
      });

      reset();
      hideUsuarioPasswordFormDialog?.();
      onPasswordChanged?.();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  return (
    <div className="p-2">
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <div className="field mb-4">
          <label
            htmlFor="newPassword"
            className="block text-900 font-medium mb-2"
          >
            Nueva contraseña <span className="text-red-500">*</span>
          </label>
          <Controller
            name="newPassword"
            control={control}
            render={({ field }) => (
              <Password
                id="newPassword"
                toggleMask
                feedback={false}
                className={classNames("w-full", {
                  "p-invalid": errors.newPassword,
                })}
                inputClassName="w-full"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              />
            )}
          />
          {errors.newPassword && (
            <small className="p-error">{errors.newPassword.message}</small>
          )}
        </div>

        <div className="field mb-4">
          <label
            htmlFor="confirmPassword"
            className="block text-900 font-medium mb-2"
          >
            Confirmar contraseña <span className="text-red-500">*</span>
          </label>
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <Password
                id="confirmPassword"
                toggleMask
                feedback={false}
                className={classNames("w-full", {
                  "p-invalid": errors.confirmPassword,
                })}
                inputClassName="w-full"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              />
            )}
          />
          {errors.confirmPassword && (
            <small className="p-error">{errors.confirmPassword.message}</small>
          )}
        </div>

        <PasswordRequirements
          password={watch("newPassword")}
          confirmPassword={watch("confirmPassword")}
          showConfirm={true}
        />
      </form>
    </div>
  );
};

export default UsuarioChangePasswordForm;
