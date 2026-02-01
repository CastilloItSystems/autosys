"use client";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { profileSchema } from "@/libs/zods";
import { Toast } from "primereact/toast";
import { Usuario } from "@/libs/interfaces";
import { LayoutContext } from "@/layout/context/layoutcontext";
import { handleFormError } from "@/utils/errorHandlers";
import { updateUser } from "@/app/api/userService";
import { useSession } from "next-auth/react";

type FormData = z.infer<typeof profileSchema>;

interface MyprofileFormProps {
  usuario: Usuario;
  hideMyprofileFormDialog: () => void;
}
const MyprofileForm = ({
  usuario,
  hideMyprofileFormDialog,
}: MyprofileFormProps) => {
  const { data: session, update } = useSession();

  const { layoutConfig } = useContext(LayoutContext);
  const toast = useRef<Toast | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const filledInput = layoutConfig.inputStyle === "filled";
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(profileSchema),
  });
  useEffect(() => {
    if (usuario) {
      // Asignar los campos manualmente para evitar errores de tipos
      if (usuario.nombre !== undefined) setValue("nombre", usuario.nombre);

      if (usuario.telefono !== undefined)
        setValue("telefono", usuario.telefono);
      // No se asigna password porque no existe en Usuario

      // Manejar idRefineria por separado para asegurar que sea un arreglo de IDs
      setValue(
        "idRefineria",
        usuario.idRefineria
          ? usuario.idRefineria.map((ref: any) =>
              typeof ref === "object" && ref.id ? ref.id : ref
            )
          : []
      );
    }
  }, [usuario, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (usuario) {
        // Actualizar el usuario en el backend
        const usuarioActualizado = await updateUser(usuario.id, data);
        console.log("Usuario actualizado:", usuarioActualizado);
        // Encontrar el índice del usuario actualizado en el arreglo local

        if (usuarioActualizado) {
          // Actualizar sesión
          console.log("Session before update:", session);
          await update({
            ...session,
            user: {
              ...session?.user,
              usuario: {
                ...session?.user?.usuario,
                nombre: usuarioActualizado.nombre,
                telefono: usuarioActualizado.telefono,
              },
            },
            updatedUsuario: {
              // Pasar la información actualizada aquí
              nombre: usuarioActualizado.nombre,
              telefono: usuarioActualizado.telefono,
            },
          });
          console.log("Session after update:", session);
          // Mostrar notificación de éxito
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Usuario Actualizado",
            life: 3000,
          });

          // Cerrar el diálogo del formulario
          hideMyprofileFormDialog();
        } else {
          // Mostrar notificación de error si no se encuentra el usuario
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudo encontrar el usuario",
            life: 3000,
          });
        }
      }
    } catch (error) {
      handleFormError(error, toast); // Pasamos la referencia del toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="">
      <Toast ref={toast} />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-fluid surface-50 p-3 border-round shadow-2">
          {/* Header del Formulario */}
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
                {usuario ? "Modificar Usuario" : "Crear Usuario"}
              </h2>
            </div>
          </div>

          <div className="grid formgrid p-fluid">
            <div className="field mb-4 col-12 md:col-8 lg:col-8 xl:col-8">
              <label htmlFor="nombre" className="font-medium text-900">
                Nombre
              </label>
              <InputText
                id="nombre"
                type="text"
                className={classNames("w-full", {
                  "p-invalid": errors.nombre,
                })}
                {...register("nombre")}
              />
              {errors.nombre && (
                <small className="p-error">{errors.nombre.message}</small>
              )}
            </div>

            {/* Campo: Teléfono */}
            <div className="col-12 md:col-4 lg:col-4 xl:col-4">
              <label className="block font-medium text-900 mb-2 flex align-items-center">
                Teléfono
              </label>
              <Controller
                name="telefono"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <InputText
                      id="telefono"
                      placeholder="+584248286102"
                      className={classNames("w-full", {
                        "p-invalid": fieldState.error,
                        "pl-5": filledInput,
                      })}
                      value={field.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Forzar que siempre empiece con +
                        if (value === "") {
                          field.onChange("");
                        } else if (value === "+") {
                          field.onChange("+");
                        } else {
                          // Filtrar solo números y mantener el + inicial
                          const numericValue = value.replace(/[^0-9]/g, "");
                          field.onChange("+" + numericValue);
                        }
                      }}
                      onKeyDown={(e) => {
                        // Prevenir borrado del signo +
                        if (e.key === "Backspace" && field.value === "+") {
                          e.preventDefault();
                        }
                      }}
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

            {/* Botones */}
            <div className="col-12 flex justify-content-between align-items-center mt-3">
              <Button
                type="submit"
                disabled={submitting} // Deshabilitar el botón mientras se envía
                icon={submitting ? "pi pi-spinner pi-spin" : ""} // Mostrar ícono de carga
                label={usuario ? "Modificar Usuario" : "Crear Usuario"}
                className="w-auto mt-3"
              />

              <Button
                type="button"
                label="Salir"
                onClick={() => hideMyprofileFormDialog()}
                className="w-auto"
                severity="danger"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MyprofileForm;
