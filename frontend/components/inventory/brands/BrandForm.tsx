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
import brandsService, {
  BrandType,
  BRAND_TYPE_LABELS,
} from "@/app/api/inventory/brandService";
import type { Brand } from "@/app/api/inventory/brandService";
import { handleFormError } from "@/utils/errorHandlers";

// Schema de validación
const brandSchema = z.object({
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
  type: z.enum(["VEHICLE", "PART", "BOTH"] as const, {
    errorMap: () => ({ message: "Tipo de marca es requerido" }),
  }),
  description: z
    .string()
    .max(500, "Descripción no puede exceder 500 caracteres")
    .optional(),
});

type FormData = z.infer<typeof brandSchema>;

interface BrandFormProps {
  brand: Brand | null;
  formId?: string;
  onSave: () => void | Promise<void>;
  onCreated?: (item: any) => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<any>;
}

// Opciones de tipo con etiquetas en español
const BRAND_TYPE_OPTIONS = [
  { label: BRAND_TYPE_LABELS.VEHICLE, value: "VEHICLE" as BrandType },
  { label: BRAND_TYPE_LABELS.PART, value: "PART" as BrandType },
  { label: BRAND_TYPE_LABELS.BOTH, value: "BOTH" as BrandType },
];

export default function BrandForm({
  brand,
  formId,
  onSave,
  onCreated,
  onSubmittingChange,
  toast,
}: BrandFormProps) {
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(brandSchema),
    mode: "onBlur",
    defaultValues: {
      code: "",
      name: "",
      type: "PART",
      description: "",
    },
  });

  // Simular loading inicial para consistencia visual
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Cargar datos de la marca si está en modo edición
  useEffect(() => {
    if (brand && !isLoading) {
      reset({
        code: brand.code || "",
        name: brand.name || "",
        type: brand.type || "PART",
        description: brand.description || "",
      });
    } else if (!brand && !isLoading) {
      reset({
        code: "",
        name: "",
        type: "PART",
        description: "",
      });
    }
  }, [brand, reset, isLoading]);

  /**
   * Maneja el envío del formulario
   */
  const onSubmit = async (data: FormData) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      if (brand?.id) {
        await brandsService.update(brand.id, data);
        await onSave();
      } else {
        const res = await brandsService.create(data);
        await onSave();
        if (onCreated) onCreated(res?.data ?? res);
      }
    } catch (error: any) {
      handleFormError(error, toast);
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  return (
    <form id={formId || "brand-form"} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
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
                    placeholder="Ej: TOYOTA, BOSCH"
                    className={errors.code ? "p-invalid" : ""}
                    autoFocus
                    disabled={!!brand?.id}
                    title={brand?.id ? "El código no puede ser modificado" : ""}
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
                    placeholder="Ej: Toyota, Bosch, Nike"
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

            {/* Tipo */}
            <div className="col-12 md:col-6">
              <label htmlFor="type" className="block text-900 font-medium mb-2">
                Tipo <span className="text-red-500">*</span>
              </label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    {...field}
                    id="type"
                    options={BRAND_TYPE_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccionar tipo"
                    className={errors.type ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.type && (
                <small className="p-error block mt-1">
                  {errors.type.message}
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
                    placeholder="Descripción de la marca (opcional)"
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
