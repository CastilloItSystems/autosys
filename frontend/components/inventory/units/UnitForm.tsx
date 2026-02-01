"use client";
import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { classNames } from "primereact/utils";
import { unitSchema } from "@/libs/zods/inventory/unitZod";
import { createUnit, updateUnit } from "@/app/api/inventory/unitService";
import { Toast } from "primereact/toast";
import { handleFormError } from "@/utils/errorHandlers";
import { LayoutContext } from "@/layout/context/layoutcontext";

type FormData = z.infer<typeof unitSchema>;

interface UnitFormProps {
  unit: any;
  hideFormDialog: () => void;
  units: any[];
  setUnits: (u: any[]) => void;
  setUnit: (u: any) => void;
  showToast: (severity: "success" | "error", summary: string, detail: string) => void;
  toast: React.RefObject<Toast> | null;
}

const UnitForm = ({ unit, toast, hideFormDialog, units, setUnits, setUnit, showToast }: UnitFormProps) => {
  const { layoutConfig } = useContext(LayoutContext);
  const filledInput = layoutConfig.inputStyle === "filled";

  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(unitSchema),
  });

  useEffect(() => {
    if (unit) {
      Object.keys(unit).forEach((key) => setValue(key as any, unit[key]));
    }
  }, [unit, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (unit) {
        const updated = await updateUnit(unit.id, data);
        setUnits(units.map((u) => (u.id === updated.id ? updated : u)));
        showToast("success", "Éxito", "Unidad actualizada");
      } else {
        const created = await createUnit(data as any);
        setUnits([...units, created]);
        showToast("success", "Éxito", "Unidad creada");
      }
      hideFormDialog();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-fluid surface-50 p-3 border-round shadow-2">
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-tag mr-3 text-primary text-3xl"></i>
                {unit ? "Modificar Unidad" : "Crear Unidad"}
              </h2>
            </div>
          </div>

          <div className="grid formgrid row-gap-2">
            <div className="field col-12 md:col-6">
              <label htmlFor="nombre" className="font-medium text-900">
                Nombre <span className="text-red-500">*</span>
              </label>
              <InputText
                id="nombre"
                {...register("nombre")}
                className={classNames("w-full", { "p-filled": filledInput })}
              />
              {errors.nombre && <small className="p-error">{errors.nombre.message}</small>}
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="abreviacion" className="font-medium text-900">
                Abreviación
              </label>
              <InputText id="abreviacion" {...register("abreviacion")} className={classNames("w-full", { "p-filled": filledInput })} />
            </div>

            <div className="field col-12">
              <label htmlFor="descripcion" className="font-medium text-900">
                Descripción
              </label>
              <InputTextarea id="descripcion" {...register("descripcion")} rows={3} />
            </div>

            <div className="field col-12 md:col-6 text-right">
              <Button
                type="submit"
                label={unit ? "Actualizar" : "Crear"}
                icon={submitting ? "pi pi-spin pi-spinner" : "pi pi-check"}
                className="p-button-success"
                disabled={submitting}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UnitForm;
