"use client";
import React, { useEffect, useState } from "react";

// Form libraries
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// PrimeReact components
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { ProgressSpinner } from "primereact/progressspinner";

// Interfaces and schemas
import { ServiceCategory } from "@/libs/interfaces/workshop";
import {
  serviceCategorySchema,
  ServiceCategoryFormData,
} from "@/libs/zods/workshop";

// API functions
import {
  createServiceCategory,
  updateServiceCategory,
} from "@/app/api/workshop";

interface ServiceCategoryFormProps {
  category: ServiceCategory | null;
  onSave: () => void;
  onCancel: () => void;
  toast: React.RefObject<any>;
}

/**
 * Formulario para crear y editar categorías de servicio en el módulo de taller.
 * Incluye validación con Zod, colores predefinidos y estados de loading controlados.
 */
export default function ServiceCategoryForm({
  category,
  onSave,
  onCancel,
  toast,
}: ServiceCategoryFormProps) {
  // Estado de loading controlado
  const [isLoading, setIsLoading] = useState(true);

  // Opciones de colores predefinidos
  const colorOptions = [
    { label: "Verde", value: "#4CAF50", color: "#4CAF50" },
    { label: "Azul", value: "#2196F3", color: "#2196F3" },
    { label: "Rojo", value: "#F44336", color: "#F44336" },
    { label: "Amarillo", value: "#FFEB3B", color: "#FFEB3B" },
    { label: "Naranja", value: "#FF9800", color: "#FF9800" },
    { label: "Morado", value: "#9C27B0", color: "#9C27B0" },
    { label: "Rosa", value: "#E91E63", color: "#E91E63" },
    { label: "Gris", value: "#9E9E9E", color: "#9E9E9E" },
    { label: "Marrón", value: "#795548", color: "#795548" },
    { label: "Negro", value: "#000000", color: "#000000" },
  ];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServiceCategoryFormData>({
    resolver: zodResolver(serviceCategorySchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      codigo: "",
      color: "#4CAF50",
      icono: "",
      orden: 0,
      activo: true,
    },
  });

  // Simular loading inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (category && !isLoading) {
      reset({
        nombre: category.nombre || "",
        descripcion: category.descripcion || "",
        codigo: category.codigo || "",
        color: category.color || "#4CAF50",
        icono: category.icono || "",
        orden: category.orden ?? 0,
        activo: category.activo ?? true,
      });
    } else if (!category && !isLoading) {
      reset({
        nombre: "",
        descripcion: "",
        codigo: "",
        color: "#4CAF50",
        icono: "",
        orden: 0,
        activo: true,
      });
    }
  }, [category, reset, isLoading]);

  /**
   * Maneja el envío del formulario para crear o actualizar una categoría
   */
  const onSubmit = async (data: ServiceCategoryFormData) => {
    console.log("data", data);
    try {
      if (category?._id) {
        await updateServiceCategory(category._id, data);
      } else {
        await createServiceCategory(data);
      }
      onSave();
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message || "Error al guardar la categoría",
        life: 3000,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
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
              <label
                htmlFor="codigo"
                className="block text-900 font-medium mb-2"
              >
                Código <span className="text-red-500">*</span>
              </label>
              <Controller
                name="codigo"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="codigo"
                    value={field.value?.toUpperCase() || ""}
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                    placeholder="Ej: MECANICA"
                    className={errors.codigo ? "p-invalid" : ""}
                    style={{ fontFamily: "monospace" }}
                  />
                )}
              />
              {errors.codigo && (
                <small className="p-error">{errors.codigo.message}</small>
              )}
            </div>

            {/* Nombre */}
            <div className="col-12 md:col-6">
              <label
                htmlFor="nombre"
                className="block text-900 font-medium mb-2"
              >
                Nombre <span className="text-red-500">*</span>
              </label>
              <Controller
                name="nombre"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="nombre"
                    {...field}
                    placeholder="Ej: Mantenimiento Preventivo"
                    className={errors.nombre ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.nombre && (
                <small className="p-error">{errors.nombre.message}</small>
              )}
            </div>

            {/* Descripción */}
            <div className="col-12">
              <label
                htmlFor="descripcion"
                className="block text-900 font-medium mb-2"
              >
                Descripción
              </label>
              <Controller
                name="descripcion"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    id="descripcion"
                    {...field}
                    rows={3}
                    placeholder="Descripción de la categoría"
                  />
                )}
              />
            </div>

            {/* Color */}
            <div className="col-12 md:col-4">
              <label
                htmlFor="color"
                className="block text-900 font-medium mb-2"
              >
                Color
              </label>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="color"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={colorOptions}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccionar color"
                    itemTemplate={(option) => (
                      <div className="flex align-items-center">
                        <div
                          className="w-1rem h-1rem border-circle mr-2"
                          style={{ backgroundColor: option.color }}
                        ></div>
                        <span>{option.label}</span>
                      </div>
                    )}
                    valueTemplate={(option) =>
                      option ? (
                        <div className="flex align-items-center">
                          <div
                            className="w-1rem h-1rem border-circle mr-2"
                            style={{ backgroundColor: option.color }}
                          ></div>
                          <span>{option.label}</span>
                        </div>
                      ) : (
                        "Seleccionar color"
                      )
                    }
                  />
                )}
              />
              {errors.color && (
                <small className="p-error">{errors.color.message}</small>
              )}
            </div>

            {/* Icono */}
            <div className="col-12 md:col-4">
              <label
                htmlFor="icono"
                className="block text-900 font-medium mb-2"
              >
                Icono (PrimeIcons)
              </label>
              <Controller
                name="icono"
                control={control}
                render={({ field }) => (
                  <div className="p-inputgroup">
                    <span className="p-inputgroup-addon">
                      <i className={`pi pi-${field.value || "cog"}`}></i>
                    </span>
                    <InputText
                      id="icono"
                      {...field}
                      placeholder="Ej: wrench, engine, cog"
                    />
                  </div>
                )}
              />
              <small className="text-500">
                Ver iconos en{" "}
                <a
                  href="https://primereact.org/icons"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  primereact.org/icons
                </a>
              </small>
            </div>

            {/* Orden */}
            <div className="col-12 md:col-4">
              <label
                htmlFor="orden"
                className="block text-900 font-medium mb-2"
              >
                Orden
              </label>
              <Controller
                name="orden"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="orden"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    placeholder="0"
                    showButtons
                    min={0}
                  />
                )}
              />
              {errors.orden && (
                <small className="p-error">{errors.orden.message}</small>
              )}
            </div>

            {/* Activo */}
            <div className="col-12">
              <Controller
                name="activo"
                control={control}
                render={({ field }) => (
                  <div className="flex align-items-center">
                    <Checkbox
                      inputId="activo"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.checked)}
                    />
                    <label
                      htmlFor="activo"
                      className="ml-2 block text-900 font-medium mb-2"
                    >
                      Categoría activa
                    </label>
                  </div>
                )}
              />
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex justify-content-end gap-2 mt-4">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              severity="secondary"
              onClick={onCancel}
              type="button"
              disabled={isSubmitting}
            />
            <Button
              label={category?._id ? "Actualizar" : "Crear"}
              icon="pi pi-check"
              type="submit"
              loading={isSubmitting}
            />
          </div>
        </>
      )}
    </form>
  );
}
