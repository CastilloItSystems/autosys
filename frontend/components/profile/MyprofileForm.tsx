"use client";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";
import { profileSchema } from "@/libs/zods";
import { Toast } from "primereact/toast";
import { Usuario } from "@/libs/interfaces";
import { handleFormError } from "@/utils/errorHandlers";
import { updateUser } from "@/app/api/userService";
import { useSession } from "next-auth/react";
import PhoneInput from "@/components/common/PhoneInput";

type FormData = z.infer<typeof profileSchema>;

interface MyprofileFormProps {
  usuario: Usuario;
  formId?: string;
  onSave: () => void | Promise<void>;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast>;
}

const MyprofileForm = ({
  usuario,
  formId = "profile-form",
  onSave,
  onSubmittingChange,
  toast,
}: MyprofileFormProps) => {
  const { update } = useSession();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    if (usuario) {
      if (usuario.nombre !== undefined) setValue("nombre", usuario.nombre);
      if (usuario.telefono !== undefined && usuario.telefono !== null)
        setValue("telefono", usuario.telefono);
    }
  }, [usuario, setValue]);

  const onSubmit = async (data: FormData) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      const usuarioActualizado = await updateUser(usuario.id, data);
      await update({
        updatedUsuario: {
          nombre: usuarioActualizado.nombre,
          telefono: usuarioActualizado.telefono,
        },
      });
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <div className="grid formgrid p-fluid p-3">
        <div className="field mb-4 col-12 md:col-8">
          <label htmlFor="nombre" className="font-medium text-900">
            Nombre
          </label>
          <InputText
            id="nombre"
            type="text"
            className={classNames("w-full", { "p-invalid": errors.nombre })}
            {...register("nombre")}
          />
          {errors.nombre && (
            <small className="p-error">{errors.nombre.message}</small>
          )}
        </div>

        <div className="field mb-4 col-12 md:col-4">
          <label className="block font-medium text-900 mb-2">Teléfono</label>
          <Controller
            name="telefono"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <PhoneInput
                  id="telefono"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error}
                />
                {fieldState.error && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {fieldState.error.message}
                  </small>
                )}
              </>
            )}
          />
        </div>
      </div>
    </form>
  );
};

export default MyprofileForm;
