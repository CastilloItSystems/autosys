"use client";
import React, { useContext, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { categorySchema } from "@/libs/zods/inventory";
import {
  createCategory,
  updateCategory,
} from "@/app/api/inventory/categoryService";
import { Toast } from "primereact/toast";
import { handleFormError } from "@/utils/errorHandlers";
import { LayoutContext } from "@/layout/context/layoutcontext";

type FormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  category: any;
  hideFormDialog: () => void;
  categories: any[];
  setCategories: (b: any[]) => void;
  setCategory: (b: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
  toast: React.RefObject<Toast> | null;
}

const CategoryForm = ({
  category,
  toast,
  hideFormDialog,
  categories,
  setCategories,
  showToast,
}: CategoryFormProps) => {
  const { layoutConfig } = useContext(LayoutContext);
  const filledInput = layoutConfig.inputStyle === "filled";

  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(categorySchema),
  });

  useEffect(() => {
    if (category) {
      Object.keys(category).forEach((key) =>
        setValue(key as any, category[key])
      );
    }
  }, [category, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (category) {
        const updated = await updateCategory(category.id, data);
        setCategories(
          categories.map((b) => (b.id === updated.id ? updated : b))
        );
        showToast("success", "Éxito", "Categoría actualizada");
      } else {
        const created = await createCategory(data);
        setCategories([...categories, created]);
        showToast("success", "Éxito", "Categoría creada");
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
                <i className="pi pi-bookmark mr-3 text-primary text-3xl"></i>
                {category ? "Modificar Categoría" : "Crear Categoría"}
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
                label={category ? "Actualizar" : "Crear"}
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

export default CategoryForm;
