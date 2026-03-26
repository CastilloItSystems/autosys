"use client";
import React, { useEffect, useState } from "react";

// Form libraries
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// PrimeReact components
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";

// API functions
import categoryService, { Category } from "@/app/api/inventory/categoryService";

// Schema de validación
const categorySchema = z.object({
  code: z
    .string()
    .min(1, "Código es requerido")
    .min(2, "Código debe tener al menos 2 caracteres")
    .max(20, "Código no puede exceder 20 caracteres"),
  name: z
    .string()
    .min(1, "Nombre es requerido")
    .min(2, "Nombre debe tener al menos 2 caracteres")
    .max(100, "Nombre no puede exceder 100 caracteres"),
  description: z
    .string()
    .max(500, "Descripción no puede exceder 500 caracteres")
    .optional(),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

type FormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  category: Category | null;
  hideFormDialog: () => void;
  onSuccess?: () => void;
  onCreated?: (item: any) => void;
  toast?: React.RefObject<any>;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

export default function CategoryForm({
  category,
  hideFormDialog,
  onSuccess,
  onCreated,
  toast,
  formId = "category-form",
  onSubmittingChange,
}: CategoryFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(categorySchema),
    mode: "onBlur",
    defaultValues: {
      code: "",
      name: "",
      description: "",
      parentId: undefined,
      isActive: true,
    },
  });

  // Cargar categorías activas para el dropdown de parentId
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryService.getActive();
        const categoriesData = response.data || [];
        // Filtrar categoría actual si estamos editando para evitar asignarse a sí misma
        const filtered = category
          ? categoriesData.filter((c) => c.id !== category.id)
          : categoriesData;
        setCategories(Array.isArray(filtered) ? filtered : []);
      } catch (error) {
        console.error("Error loading categories:", error);
        setCategories([]);
      }
    };

    loadCategories();
  }, [category?.id]);

  // Simular loading inicial para consistencia visual
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Cargar datos de la categoría si está en modo edición
  useEffect(() => {
    if (category && !isLoading) {
      reset({
        code: category.code || "",
        name: category.name || "",
        description: category.description || "",
        parentId: category.parentId || undefined,
        isActive: category.isActive ?? true,
      });
    } else if (!category && !isLoading) {
      reset({
        code: "",
        name: "",
        description: "",
        parentId: undefined,
        isActive: true,
      });
    }
  }, [category, reset, isLoading]);

  /**
   * Maneja el envío del formulario
   */
  const onSubmit = async (data: FormData) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      if (category?.id) {
        await categoryService.update(category.id, data);
        toast?.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Categoría actualizada exitosamente",
          life: 3000,
        });
      } else {
        const res = await categoryService.create(data);
        toast?.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Categoría creada exitosamente",
          life: 3000,
        });
        hideFormDialog();
        if (onSuccess) onSuccess();
        if (onCreated) onCreated(res?.data ?? res);
        return;
      }
      hideFormDialog();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message || "Error al guardar la categoría",
        life: 3000,
      });
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  const parentCategoryOptions = categories.map((cat) => ({
    label: cat.name,
    value: cat.id,
  }));

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      {isLoading ? (
        <div className="flex flex-column align-items-center justify-content-center p-4">
          <ProgressSpinner
            style={{ width: "40px", height: "40px" }}
            strokeWidth="4"
            fill="var(--surface-ground)"
            animationDuration=".5s"
          />
          <p className="mt-3 text-600 font-medium">Preparando formulario...</p>
        </div>
      ) : (
        <>
          <div className="grid">
            {/* Código */}
            <div className="col-12 md:col-6">
              <label htmlFor="code" className="block text-900 font-medium mb-2">
                Código <span className="text-red-500">*</span>
              </label>
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="code"
                    {...field}
                    placeholder="Ej: ELEC, MECH, AUTO"
                    className={errors.code ? "p-invalid" : ""}
                    autoFocus
                    disabled={!!category?.id}
                    title={
                      category?.id ? "El código no puede ser modificado" : ""
                    }
                  />
                )}
              />
              {errors.code && (
                <small className="p-error block mt-1">
                  {errors.code.message}
                </small>
              )}
            </div>

            {/* Nombre */}
            <div className="col-12 md:col-6">
              <label htmlFor="name" className="block text-900 font-medium mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="name"
                    {...field}
                    placeholder="Ej: Electrónica, Mecánica, Autopartes"
                    className={errors.name ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.name && (
                <small className="p-error block mt-1">
                  {errors.name.message}
                </small>
              )}
            </div>

            {/* Categoría Padre */}
            <div className="col-12 md:col-6">
              <label
                htmlFor="parentId"
                className="block text-900 font-medium mb-2"
              >
                Categoría Padre
              </label>
              <Controller
                name="parentId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    {...field}
                    id="parentId"
                    options={parentCategoryOptions}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccionar categoría padre (opcional)"
                    showClear
                    className={errors.parentId ? "p-invalid" : ""}
                    filter
                  />
                )}
              />
              {errors.parentId && (
                <small className="p-error block mt-1">
                  {errors.parentId.message}
                </small>
              )}
            </div>

            {/* Descripción */}
            <div className="col-12">
              <label
                htmlFor="description"
                className="block text-900 font-medium mb-2"
              >
                Descripción
              </label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    {...field}
                    id="description"
                    placeholder="Descripción de la categoría (opcional)"
                    rows={3}
                    className={errors.description ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.description && (
                <small className="p-error block mt-1">
                  {errors.description.message}
                </small>
              )}
            </div>
          </div>
        </>
      )}
    </form>
  );
}
