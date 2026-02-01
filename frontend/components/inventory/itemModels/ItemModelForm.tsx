"use client";
import React, { useContext, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { itemModelSchema } from "@/libs/zods/inventory";
import {
  createItemModel,
  updateItemModel,
} from "@/app/api/inventory/itemModelService";
import { Toast } from "primereact/toast";
import { handleFormError } from "@/utils/errorHandlers";
import { LayoutContext } from "@/layout/context/layoutcontext";

type FormData = z.infer<typeof itemModelSchema>;

interface ItemModelFormProps {
  model: any;
  hideFormDialog: () => void;
  models: any[];
  setModels: (b: any[]) => void;
  setModel: (b: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
  toast: React.RefObject<Toast> | null;
}

const ItemModelForm = ({
  model,
  toast,
  hideFormDialog,
  models,
  setModels,
  showToast,
}: ItemModelFormProps) => {
  const { layoutConfig } = useContext(LayoutContext);
  const filledInput = layoutConfig.inputStyle === "filled";

  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(itemModelSchema),
  });

  useEffect(() => {
    if (model) {
      Object.keys(model).forEach((key) => setValue(key as any, model[key]));
    }
  }, [model, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (model) {
        const updated = await updateItemModel(model.id, data);
        setModels(models.map((b) => (b.id === updated.id ? updated : b)));
        showToast("success", "Éxito", "Modelo actualizado");
      } else {
        const created = await createItemModel(data);
        setModels([...models, created]);
        showToast("success", "Éxito", "Modelo creado");
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
                <i className="pi pi-cube mr-3 text-primary text-3xl"></i>
                {model ? "Modificar Modelo" : "Crear Modelo"}
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
              {errors.nombre && (
                <small className="p-error">{errors.nombre.message}</small>
              )}
            </div>

            <div className="field col-12 md:col-6 text-right">
              <Button
                type="submit"
                label={model ? "Actualizar" : "Crear"}
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

export default ItemModelForm;
