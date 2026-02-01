"use client";
import React, { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { useRouter } from "next/navigation";
import { InputNumber } from "primereact/inputnumber";
import { AxiosError } from "axios";
import { handleFormError } from "@/utils/errorHandlers";
import { autoSysSchema } from "@/libs/zods/autoSysZod";
import { createAutoSys, updateAutoSys } from "@/app/api/autoSysService";

type FormData = z.infer<typeof autoSysSchema>;

interface AutoSysFormProps {
  autoSys: any;
  hideAutoSysFormDialog: () => void;
  autoSyss: any[];
  setAutoSyss: (autoSyss: any[]) => void;
}

const AutoSysForm = ({
  autoSys,
  hideAutoSysFormDialog,
  autoSyss,
  setAutoSyss,
}: AutoSysFormProps) => {
  const toast = useRef<Toast | null>(null);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(autoSysSchema),
  });

  useEffect(() => {
    if (autoSys) {
      setValue("nombre", autoSys.nombre);
      setValue("estado", autoSys.estado);
      setValue("ubicacion", autoSys.ubicacion);
      setValue("rif", autoSys.rif);
      setValue("telefono", autoSys.telefono || "");
      setValue("procesamientoDia", autoSys.procesamientoDia || 0);
      setValue("legal", autoSys.legal || "");
      setValue("img", autoSys.img);
      setValue("createdAt", autoSys.createdAt);
      setValue("updatedAt", autoSys.updatedAt);
      setValue("id", autoSys.id);
    }
  }, [autoSys, setValue]);

  const findIndexById = (id: string) => {
    let index = -1;
    for (let i = 0; i < autoSyss.length; i++) {
      if (autoSyss[i].id === id) {
        index = i;
        break;
      }
    }
    return index;
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (autoSys) {
        // Actualizar el taller en el backend
        const autoSysActualizado = await updateAutoSys(autoSys.id, data);

        // Encontrar el índice del taller actualizado en el arreglo local
        const index = findIndexById(autoSys.id);

        if (index !== -1) {
          // Crear una copia del arreglo de talleres
          const AutoSyss = [...autoSyss];

          // Actualizar el taller en la copia del arreglo
          AutoSyss[index] = autoSysActualizado;

          // Actualizar el estado local con el nuevo arreglo
          setAutoSyss(AutoSyss);

          // Mostrar notificación de éxito
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Taller Actualizado",
            life: 3000,
          });

          // Cerrar el diálogo del formulario
          hideAutoSysFormDialog();
        } else {
          // Mostrar notificación de error si no se encuentra el taller
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudo encontrar el taller",
            life: 3000,
          });
        }
      } else {
        // Crear un nuevo taller
        const autoSysCreado = await createAutoSys(data);

        // Mostrar notificación de éxito
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Taller Creado",
          life: 3000,
        });

        // Redirigir a la lista de talleres
        router.push("/all-autoSys/list");
      }
    } catch (error) {
      handleFormError(error, toast); // Pasamos la referencia del toast
    } finally {
      // Redirigir después de que todo esté completo
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <Toast ref={toast} />
      {!autoSys && (
        <span className="text-900 text-xl font-bold mb-4 block">
          Crear Taller
        </span>
      )}
      <div className="grid">
        {!autoSys && (
          <div className="col-12 lg:col-2">
            <div className="text-900 font-medium text-xl mb-3">Taller</div>
            <p className="m-0 p-0 text-600 line-height-3 mr-3">
              Todos los campos son obligatorios.
            </p>
          </div>
        )}
        <div className="col-12 lg:col-10">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid formgrid p-fluid">
              <div className="field mb-4 col-12">
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

              <div className="field mb-4 col-12">
                <label htmlFor="ubicacion" className="font-medium text-900">
                  Ubicación
                </label>
                <InputText
                  id="ubicacion"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.ubicacion,
                  })}
                  {...register("ubicacion")}
                />
                {errors.ubicacion && (
                  <small className="p-error">{errors.ubicacion.message}</small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-6">
                <label htmlFor="rif" className="font-medium text-900">
                  RIF
                </label>
                <InputText
                  id="rif"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.rif,
                  })}
                  {...register("rif")}
                />
                {errors.rif && (
                  <small className="p-error">{errors.rif.message}</small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-6">
                <label htmlFor="telefono" className="font-medium text-900">
                  Teléfono
                </label>
                <InputText
                  id="telefono"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.telefono,
                  })}
                  {...register("telefono")}
                />
                {errors.telefono && (
                  <small className="p-error">{errors.telefono.message}</small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-6">
                <label className="block font-medium text-900 mb-2 flex align-items-center">
                  Capacidad de Procesamiento por Día
                </label>
                <Controller
                  name="procesamientoDia"
                  control={control}
                  defaultValue={0}
                  render={({ field, fieldState }) => (
                    <>
                      <InputNumber
                        id="procesamientoDia"
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value ?? 0)}
                        className={classNames("w-full", {
                          "p-invalid": fieldState.error,
                        })}
                        min={0}
                        locale="es"
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

              <div className="field mb-4 col-12 md:col-6">
                <label htmlFor="legal" className="font-medium text-900">
                  Representante Legal
                </label>
                <InputText
                  id="legal"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.legal,
                  })}
                  {...register("legal")}
                />
                {errors.legal && (
                  <small className="p-error">{errors.legal.message}</small>
                )}
              </div>

              <div className="field mb-4 col-12">
                <label htmlFor="img" className="font-medium text-900">
                  Imagen (URL)
                </label>
                <InputText
                  id="img"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.img,
                  })}
                  {...register("img")}
                />
                {errors.img && (
                  <small className="p-error">{errors.img.message}</small>
                )}
              </div>

              <div className="col-12">
                <Button
                  type="submit"
                  disabled={submitting} // Deshabilitar el botón mientras se envía
                  icon={submitting ? "pi pi-spinner pi-spin" : ""} // Mostrar ícono de carga
                  label={autoSys ? "Modificar Taller" : "Crear Taller"}
                  className="w-auto mt-3"
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AutoSysForm;
