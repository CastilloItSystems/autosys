"use client";
import React, { useEffect, useState } from "react";

// Form libraries
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// PrimeReact components
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";

// Interfaces and schemas
import {
  ServiceSubcategory,
  ServiceCategory,
  ServiceCategoryReference,
} from "@/libs/interfaces/workshop";
import {
  serviceSubcategorySchema,
  ServiceSubcategoryFormData,
} from "@/libs/zods/workshop";

// API functions
import {
  createServiceSubcategory,
  updateServiceSubcategory,
  getServiceCategories,
} from "@/app/api/workshop";

interface ServiceSubcategoryFormProps {
  subcategory: ServiceSubcategory | null;
  onSave: () => void;
  onCancel: () => void;
  toast: React.RefObject<any>;
}

export default function ServiceSubcategoryForm({
  subcategory,
  onSave,
  onCancel,
  toast,
}: ServiceSubcategoryFormProps) {
  // Estado de loading controlado
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServiceSubcategoryFormData>({
    resolver: zodResolver(serviceSubcategorySchema),
    defaultValues: {
      categoria: "",
      nombre: "",
      descripcion: "",
      codigo: "",
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
    loadCategories();
  }, []);

  useEffect(() => {
    if (subcategory && !isLoading) {
      const categoriaId =
        typeof subcategory.categoria === "string"
          ? subcategory.categoria
          : (subcategory.categoria as ServiceCategoryReference)._id;

      reset({
        categoria: categoriaId || "",
        nombre: subcategory.nombre || "",
        descripcion: subcategory.descripcion || "",
        codigo: subcategory.codigo || "",
        activo: subcategory.activo ?? true,
      });
    } else if (!subcategory && !isLoading) {
      reset({
        categoria: "",
        nombre: "",
        descripcion: "",
        codigo: "",
        activo: true,
      });
    }
  }, [subcategory, reset, isLoading]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await getServiceCategories({ activo: true });
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar categorías",
        life: 3000,
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  const onSubmit = async (data: ServiceSubcategoryFormData) => {
    console.log("Data being sent to API:", data);
    console.log("Category value:", data.categoria);
    try {
      if (subcategory?._id) {
        await updateServiceSubcategory(subcategory._id, data);
      } else {
        await createServiceSubcategory(data);
      }
      onSave();
    } catch (error: any) {
      console.error("Error saving subcategory:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message || "Error al guardar la subcategoría",
        life: 3000,
      });
    }
  };

  // Template for category dropdown items with color
  const categoryOptionTemplate = (option: ServiceCategory) => {
    if (!option) return null;

    return (
      <div className="flex align-items-center gap-2">
        <Tag
          value={option.codigo}
          style={{
            backgroundColor: option.color || "#607D8B",
            color: getContrastColor(option.color || "#607D8B"),
            minWidth: "100px",
          }}
        />
        <span>{option.nombre}</span>
      </div>
    );
  };

  // Helper function to get contrast color
  const getContrastColor = (hexColor: string): string => {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155 ? "#000000" : "#FFFFFF";
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
            {/* Categoría */}
            <div className="col-12">
              <label
                htmlFor="categoria"
                className="block text-900 font-medium mb-2"
              >
                Categoría <span className="text-red-500">*</span>
              </label>
              <Controller
                name="categoria"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="categoria"
                    value={field.value}
                    onChange={(e) => {
                      console.log(
                        "Dropdown onChange:",
                        e.value,
                        typeof e.value
                      );
                      field.onChange(e.value);
                    }}
                    options={categories}
                    optionLabel="nombre"
                    optionValue="_id"
                    placeholder="Seleccione una categoría"
                    filter
                    filterBy="nombre,codigo"
                    emptyMessage="No hay categorías disponibles"
                    emptyFilterMessage="No se encontraron categorías"
                    className={errors.categoria ? "p-invalid" : ""}
                    loading={loadingCategories}
                    itemTemplate={categoryOptionTemplate}
                    showClear
                  />
                )}
              />
              {errors.categoria && (
                <small className="p-error">
                  {String(errors.categoria.message)}
                </small>
              )}
            </div>

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
                    placeholder="Ej: MOTOR"
                    className={errors.codigo ? "p-invalid" : ""}
                    style={{ fontFamily: "monospace" }}
                  />
                )}
              />
              {errors.codigo && (
                <small className="p-error">
                  {String(errors.codigo.message)}
                </small>
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
                    placeholder="Ej: Motor"
                    className={errors.nombre ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.nombre && (
                <small className="p-error">
                  {String(errors.nombre.message)}
                </small>
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
                    placeholder="Descripción de la subcategoría"
                  />
                )}
              />
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
                      Subcategoría activa
                    </label>
                  </div>
                )}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-content-end gap-2 mt-4"></div>
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
              label={subcategory?._id ? "Actualizar" : "Crear"}
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
