"use client";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { useRefineriaStore } from "@/store/refineriaStore";
import { createPartida, updatePartida } from "@/app/api/partidaService";

import { ProgressSpinner } from "primereact/progressspinner";
import { handleFormError } from "@/utils/errorHandlers";
import { useByRefineryData } from "@/hooks/useByRefineryData";
import { partidaSchema } from "@/libs/zods";
import { ColorPicker } from "primereact/colorpicker";

type FormData = z.infer<typeof partidaSchema>;

interface PartidaFormProps {
  partida: any;
  hidePartidaFormDialog: () => void;
  partidas: any[];
  setPartidas: (partidas: any[]) => void;
  setPartida: (partida: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
  toast: React.RefObject<Toast> | null;
}

const estatusValues = ["Activo", "Inactivo", "Mantenimiento"];

const PartidaForm = ({
  partida,
  toast,
  hidePartidaFormDialog,
  partidas,
  setPartidas,
  showToast,
}: PartidaFormProps) => {
  const { activeRefineria } = useRefineriaStore();
  const { productos = [], loading } = useByRefineryData(
    activeRefineria?.id || ""
  );

  // Filtrar productos por categoría "Derivados"
  const filteredProductos = productos.filter(
    (producto: any) => producto.tipoMaterial === "Derivado"
  );

  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(partidaSchema),
    defaultValues: {
      codigo: partida?.codigo ?? undefined,
      descripcion: partida?.descripcion ?? "",
      color: partida?.color ?? "",
    },
  });

  useEffect(() => {
    if (partida) {
      setValue("codigo", partida.codigo);
      setValue("descripcion", partida.descripcion);
    }
  }, [partida, setValue]);

  const onSubmit = async (data: { codigo: number; descripcion: string }) => {
    setSubmitting(true);
    try {
      if (partida) {
        const updatedPartida = await updatePartida(partida.id, {
          ...partida,
          ...data,
        });
        const updatedPartidas = partidas.map((t) =>
          t.id === updatedPartida.id ? updatedPartida : t
        );
        setPartidas(updatedPartidas);
        showToast("success", "Éxito", "Partida actualizada");
      } else {
        const newPartida = await createPartida({
          ...data,
          idRefineria: activeRefineria,
        });
        setPartidas([...partidas, newPartida]);
        showToast("success", "Éxito", "Partida creada");
      }
      hidePartidaFormDialog();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center h-screen">
        <ProgressSpinner />
      </div>
    );
  }
  console.log("errors", errors);
  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-fluid surface-50 p-3 border-round shadow-2">
          {/* Header del Formulario */}
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
                {partida ? "Modificar Partida" : "Crear Partida"}
              </h2>
            </div>
          </div>

          {/* Cuerpo del Formulario */}
          <div className="grid formgrid row-gap-2">
            {/* Campo: Código */}
            <div className="col-12 md:col-6 lg:col-4">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-hashtag mr-2 text-primary"></i>
                  Código
                </label>
                <InputText
                  id="codigo"
                  type="number"
                  className={classNames("w-full", {
                    "p-invalid": errors.codigo,
                  })}
                  {...register("codigo", { valueAsNumber: true })}
                />
                {errors.codigo && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.codigo.message}
                  </small>
                )}
              </div>
            </div>
            {/* Campo: Descripción */}
            <div className="col-12 md:col-6 lg:col-4">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-align-left mr-2 text-primary"></i>
                  Descripción
                </label>
                <InputText
                  id="descripcion"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.descripcion,
                  })}
                  {...register("descripcion")}
                />
                {errors.descripcion && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.descripcion.message}
                  </small>
                )}
              </div>
            </div>
            {/* Campo: Color */}
            <div className="col-12 md:col-6 lg:col-4 ">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-palette mr-2 text-primary"></i>
                  Color
                </label>
                <ColorPicker
                  id="color"
                  format="hex"
                  value={watch("color")}
                  {...register("color")}
                  className={classNames("w-full", {
                    "p-invalid": errors.color,
                  })}
                />
                {errors.color && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.color.message}
                  </small>
                )}
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="col-12 flex justify-content-between align-items-center mt-3">
            <Button
              type="submit"
              disabled={submitting}
              icon={submitting ? "pi pi-spinner pi-spin" : ""}
              label={partida ? "Modificar Partida" : "Crear Partida"}
              className="w-auto"
            />

            <Button
              type="button"
              label="Salir"
              onClick={() => hidePartidaFormDialog()}
              className="w-auto"
              severity="danger"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default PartidaForm;
