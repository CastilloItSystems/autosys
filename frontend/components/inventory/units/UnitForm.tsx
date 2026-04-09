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
import unitsService, { Unit } from "@/app/api/inventory/unitService";
import { handleFormError } from "@/utils/errorHandlers";

// Schema de validación
const unitSchema = z.object({
  code: z
    .string()
    .min(1, "Código es requerido")
    .min(2, "Código debe tener al menos 2 caracteres")
    .max(10, "Código no puede exceder 10 caracteres"),
  name: z
    .string()
    .min(1, "Nombre es requerido")
    .min(2, "Nombre debe tener al menos 2 caracteres")
    .max(100, "Nombre no puede exceder 100 caracteres"),
  abbreviation: z
    .string()
    .max(10, "Abreviación no puede exceder 10 caracteres")
    .optional(),
  type: z.enum(["COUNTABLE", "WEIGHT", "VOLUME", "LENGTH"] as const, {
    errorMap: () => ({ message: "Tipo de unidad es requerido" }),
  }),
  description: z
    .string()
    .max(500, "Descripción no puede exceder 500 caracteres")
    .optional(),
  isActive: z.boolean().optional(),
});

type FormData = z.infer<typeof unitSchema>;

interface UnitFormProps {
  model: Unit | null;
  formId?: string;
  onSave: () => void | Promise<void>;
  onCreated?: (item: any) => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<any>;
}

// Opciones de tipo con etiquetas en español
const UNIT_TYPE_OPTIONS = [
  { label: "Contable", value: "COUNTABLE" },
  { label: "Peso", value: "WEIGHT" },
  { label: "Volumen", value: "VOLUME" },
  { label: "Longitud", value: "LENGTH" },
];

export default function UnitForm({
  model: unit,
  formId,
  onSave,
  onCreated,
  onSubmittingChange,
  toast,
}: UnitFormProps) {
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(unitSchema),
    mode: "onBlur",
    defaultValues: {
      code: "",
      name: "",
      abbreviation: "",
      type: "COUNTABLE",
      description: "",
      isActive: true,
    },
  });

  // Simular loading inicial para consistencia visual
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Cargar datos de la unidad si está en modo edición
  useEffect(() => {
    if (unit && !isLoading) {
      reset({
        code: unit.code || "",
        name: unit.name || "",
        abbreviation: unit.abbreviation || "",
        type: (unit.type || "COUNTABLE") as
          | "COUNTABLE"
          | "WEIGHT"
          | "VOLUME"
          | "LENGTH",
        description: unit.description || "",
        isActive: unit.isActive ?? true,
      });
    } else if (!unit && !isLoading) {
      reset({
        code: "",
        name: "",
        abbreviation: "",
        type: "COUNTABLE",
        description: "",
        isActive: true,
      });
    }
  }, [unit, reset, isLoading]);

  /**
   * Maneja el envío del formulario
   */
  const onSubmit = async (data: FormData) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      if (unit?.id) {
        await unitsService.update(unit.id, data);
        await onSave();
      } else {
        const res = await unitsService.create(data);
        await onSave();
        if (onCreated) onCreated(res?.data ?? res);
      }
    } catch (error: any) {
      console.error("Error saving unit:", error);
      handleFormError(error, toast);
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  return (
    <form
      id={formId || "unit-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
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
                    placeholder="Ej: KG, MT, L"
                    className={errors.code ? "p-invalid" : ""}
                    autoFocus
                    disabled={!!unit?.id}
                    title={unit?.id ? "El código no puede ser modificado" : ""}
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
                    placeholder="Ej: Kilogramo, Metro, Litro"
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

            {/* Abreviación */}
            <div className="col-12 md:col-6">
              <label
                htmlFor="abbreviation"
                className="block text-900 font-medium mb-2"
              >
                Abreviación
              </label>
              <Controller
                name="abbreviation"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="abbreviation"
                    {...field}
                    placeholder="Ej: Kg, m, l"
                    className={errors.abbreviation ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.abbreviation && (
                <small className="p-error block mt-1">
                  {errors.abbreviation.message}
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
                    options={UNIT_TYPE_OPTIONS}
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
                    placeholder="Descripción de la unidad (opcional)"
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
