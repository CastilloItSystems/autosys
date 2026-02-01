"use client";
import React, { useEffect, useState, useCallback } from "react";

// Form libraries
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// PrimeReact components
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import {
  InputNumber,
  InputNumberValueChangeEvent,
} from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Chips } from "primereact/chips";
import { ProgressSpinner } from "primereact/progressspinner";

// Interfaces and schemas
import {
  Service,
  ServiceCategory,
  ServiceSubcategory,
} from "@/libs/interfaces/workshop";
import { serviceSchema, ServiceFormData } from "@/libs/zods/workshop";

// API functions
import {
  createService,
  updateService,
  getServiceCategories,
  getServiceSubcategories,
} from "@/app/api/workshop";

interface ServiceFormProps {
  service: Service | null;
  onSave: () => void;
  onCancel: () => void;
  toast: React.RefObject<any>;
}

export default function ServiceForm({
  service,
  onSave,
  onCancel,
  toast,
}: ServiceFormProps) {
  // Estado de loading controlado
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [subcategories, setSubcategories] = useState<ServiceSubcategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [loadingSubcategories, setLoadingSubcategories] =
    useState<boolean>(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      codigo: "",
      nombre: "",
      descripcion: "",
      categoria: "",
      subcategoria: "",
      precioBase: 0,
      tiempoEstimadoMinutos: 30,
      unidadTiempo: "minutos",
      costoHoraAdicional: 0,
      dificultad: "media",
      requiereEspecialista: false,
      garantiaMeses: 0,
      herramientasRequeridas: [],
      piezasComunes: [],
      activo: true,
    },
  });

  const categoriaWatch = watch("categoria");

  // Debug categoriaWatch changes
  useEffect(() => {
    console.log("=== CATEGORIA WATCH VALUE CHANGED ===");
    console.log("categoriaWatch value:", categoriaWatch);
    console.log("categoriaWatch type:", typeof categoriaWatch);
  }, [categoriaWatch]);

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
    if (service && !isLoading) {
      const categoriaId =
        typeof service.categoria === "string"
          ? service.categoria
          : service.categoria._id || "";

      const subcategoriaId = service.subcategoria
        ? typeof service.subcategoria === "string"
          ? service.subcategoria
          : service.subcategoria._id || ""
        : "";

      reset({
        codigo: service.codigo || "",
        nombre: service.nombre || "",
        descripcion: service.descripcion || "",
        categoria: categoriaId,
        subcategoria: subcategoriaId,
        precioBase: service.precioBase || 0,
        tiempoEstimadoMinutos: service.tiempoEstimadoMinutos || 30,
        unidadTiempo: service.unidadTiempo || "minutos",
        costoHoraAdicional: service.costoHoraAdicional || 0,
        dificultad: service.dificultad || "media",
        requiereEspecialista: service.requiereEspecialista || false,
        garantiaMeses: service.garantiaMeses || 0,
        herramientasRequeridas: service.herramientasRequeridas || [],
        piezasComunes: service.piezasComunes || [],
        activo: service.activo ?? true,
      });

      // Load subcategories for the selected category
      if (categoriaId) {
        loadSubcategories(categoriaId);
      }
    } else if (!service && !isLoading) {
      reset({
        codigo: "",
        nombre: "",
        descripcion: "",
        categoria: "",
        subcategoria: "",
        precioBase: 0,
        tiempoEstimadoMinutos: 30,
        unidadTiempo: "minutos",
        costoHoraAdicional: 0,
        dificultad: "media",
        requiereEspecialista: false,
        garantiaMeses: 0,
        herramientasRequeridas: [],
        piezasComunes: [],
        activo: true,
      });
      setSubcategories([]);
    }
  }, [service, reset, isLoading]);

  // Watch categoria changes to load subcategories
  useEffect(() => {
    console.log("=== CATEGORIA WATCH EFFECT ===");
    console.log(
      "categoriaWatch:",
      categoriaWatch,
      "type:",
      typeof categoriaWatch
    );
    console.log("Current subcategories before change:", subcategories.length);

    if (categoriaWatch && categoriaWatch.trim() !== "") {
      console.log("Loading subcategories for category:", categoriaWatch);
      setValue("subcategoria", ""); // Reset subcategory when category changes
      loadSubcategories(categoriaWatch);
    } else {
      console.log("Clearing subcategories - no category selected");
      setSubcategories([]);
    }
  }, [categoriaWatch]);

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

  const loadSubcategories = useCallback(async (categoriaId: string) => {
    console.log("=== LOAD SUBCATEGORIES FUNCTION ===");
    console.log("Input categoriaId:", categoriaId, "type:", typeof categoriaId);

    if (!categoriaId || categoriaId.trim() === "") {
      console.log("No categoriaId provided, clearing subcategories");
      setSubcategories([]);
      return;
    }

    try {
      setLoadingSubcategories(true);
      console.log("Making API call to getServiceSubcategories with filters:", {
        activo: true,
      });

      // Get all subcategories and filter on frontend since backend filtering might not work
      const response = await getServiceSubcategories({
        activo: true,
      });

      console.log("API Response received:");
      console.log("Response success:", response.success);
      console.log("Response data length (all):", response.data?.length || 0);

      // Filter subcategories by category ID
      const filteredSubcategories =
        response.data?.filter((subcategory: ServiceSubcategory) => {
          const subcategoryCategoryId =
            typeof subcategory.categoria === "string"
              ? subcategory.categoria
              : subcategory.categoria._id;

          const matches = subcategoryCategoryId === categoriaId;
          console.log(
            `Subcategory ${subcategory.nombre}: categoria=${subcategoryCategoryId} matches=${matches}`
          );
          return matches;
        }) || [];

      console.log(
        "Filtered subcategories:",
        filteredSubcategories.length,
        "items"
      );
      console.log("Filtered data:", filteredSubcategories);

      setSubcategories(filteredSubcategories);
      console.log(
        "Subcategories state updated with",
        filteredSubcategories.length,
        "filtered items"
      );
    } catch (error) {
      console.error("Error in loadSubcategories:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar subcategorías",
        life: 3000,
      });
    } finally {
      setLoadingSubcategories(false);
      console.log("Loading subcategories finished");
    }
  }, []);

  const onSubmit = async (data: ServiceFormData) => {
    console.log("Data being sent to API:", data);
    console.log("Category ID:", data.categoria);
    console.log("Subcategory ID:", data.subcategoria);
    try {
      if (service?._id) {
        await updateService(service._id, data);
      } else {
        await createService(data);
      }
      onSave();
    } catch (error: any) {
      console.error("Error saving service:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al guardar el servicio",
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

  const dificultadOptions = [
    { label: "Baja", value: "baja" },
    { label: "Media", value: "media" },
    { label: "Alta", value: "alta" },
    { label: "Experto", value: "experto" },
  ];

  const unidadTiempoOptions = [
    { label: "Minutos", value: "minutos" },
    { label: "Horas", value: "horas" },
    { label: "Días", value: "dias" },
  ];

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
                    placeholder="Ej: CAMBIO_ACEITE"
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
                    placeholder="Ej: Cambio de Aceite"
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
                Descripción <span className="text-red-500">*</span>
              </label>
              <Controller
                name="descripcion"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    id="descripcion"
                    {...field}
                    rows={3}
                    placeholder="Descripción detallada del servicio"
                    className={errors.descripcion ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.descripcion && (
                <small className="p-error">{errors.descripcion.message}</small>
              )}
            </div>

            {/* Categoría */}
            <div className="col-12 md:col-6">
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
                      console.log("=== CATEGORY DROPDOWN ONCHANGE ===");
                      console.log(
                        "Event value:",
                        e.value,
                        "type:",
                        typeof e.value
                      );
                      console.log("Event target:", e.target);
                      console.log("Event originalEvent:", e.originalEvent);
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

            {/* Subcategoría */}
            <div className="col-12 md:col-6">
              <label
                htmlFor="subcategoria"
                className="block text-900 font-medium mb-2"
              >
                Subcategoría
              </label>
              <Controller
                name="subcategoria"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="subcategoria"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={subcategories}
                    optionLabel="nombre"
                    optionValue="_id"
                    placeholder={
                      categoriaWatch
                        ? "Seleccione una subcategoría"
                        : "Primero seleccione una categoría"
                    }
                    filter
                    filterBy="nombre,codigo"
                    emptyMessage="No hay subcategorías disponibles"
                    emptyFilterMessage="No se encontraron subcategorías"
                    disabled={!categoriaWatch}
                    loading={loadingSubcategories}
                  />
                )}
              />
              {errors.subcategoria && (
                <small className="p-error">{errors.subcategoria.message}</small>
              )}
            </div>

            {/* Precio Base */}
            <div className="col-12 md:col-4">
              <label
                htmlFor="precioBase"
                className="block text-900 font-medium mb-2"
              >
                Precio Base <span className="text-red-500">*</span>
              </label>
              <Controller
                name="precioBase"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="precioBase"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    // mode="currency"
                    // currency="VES"
                    // locale="es-VE"
                    minFractionDigits={2}
                    min={0}
                    className={errors.precioBase ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.precioBase && (
                <small className="p-error">{errors.precioBase.message}</small>
              )}
            </div>

            {/* Tiempo Estimado */}
            <div className="col-12 md:col-4">
              <label
                htmlFor="tiempoEstimadoMinutos"
                className="block text-900 font-medium mb-2"
              >
                Tiempo Estimado <span className="text-red-500">*</span>
              </label>
              <Controller
                name="tiempoEstimadoMinutos"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="tiempoEstimadoMinutos"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    showButtons
                    min={1}
                    suffix=" min"
                    className={errors.tiempoEstimadoMinutos ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.tiempoEstimadoMinutos && (
                <small className="p-error">
                  {errors.tiempoEstimadoMinutos.message}
                </small>
              )}
            </div>

            {/* Unidad de Tiempo */}
            <div className="col-12 md:col-4">
              <label
                htmlFor="unidadTiempo"
                className="block text-900 font-medium mb-2"
              >
                Unidad de Tiempo
              </label>
              <Controller
                name="unidadTiempo"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="unidadTiempo"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={unidadTiempoOptions}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione unidad"
                  />
                )}
              />
            </div>

            {/* Costo Hora Adicional */}
            <div className="col-12 md:col-4">
              <label
                htmlFor="costoHoraAdicional"
                className="block text-900 font-medium mb-2"
              >
                Costo Hora Adicional
              </label>
              <Controller
                name="costoHoraAdicional"
                control={control}
                render={({ field }) => (
                  // <InputNumber
                  //   id="costoHoraAdicional"
                  //   value={field.value}
                  //   onValueChange={(e) => field.onChange(e.value)}
                  //   mode="currency"
                  //   currency="VES"
                  //   locale="es-VE"
                  //   minFractionDigits={2}
                  //   min={0}
                  // />
                  <InputNumber
                    inputId="currency-us"
                    value={field.value}
                    onValueChange={(e: InputNumberValueChangeEvent) =>
                      field.onChange(e.value)
                    }
                    // mode="currency"
                    // currency="USD"
                    // locale="en-US"
                  />
                )}
              />
            </div>

            {/* Dificultad */}
            <div className="col-12 md:col-4">
              <label
                htmlFor="dificultad"
                className="block text-900 font-medium mb-2"
              >
                Dificultad
              </label>
              <Controller
                name="dificultad"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="dificultad"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={dificultadOptions}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione dificultad"
                  />
                )}
              />
            </div>

            {/* Garantía */}
            <div className="col-12 md:col-4">
              <label
                htmlFor="garantiaMeses"
                className="block text-900 font-medium mb-2"
              >
                Garantía (meses)
              </label>
              <Controller
                name="garantiaMeses"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="garantiaMeses"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    showButtons
                    min={0}
                    suffix=" meses"
                  />
                )}
              />
            </div>

            {/* Herramientas Requeridas */}
            <div className="col-12 md:col-6">
              <label
                htmlFor="herramientasRequeridas"
                className="block text-900 font-medium mb-2"
              >
                Herramientas Requeridas
              </label>
              <Controller
                name="herramientasRequeridas"
                control={control}
                render={({ field }) => (
                  <Chips
                    id="herramientasRequeridas"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Presione Enter para agregar"
                    separator=","
                  />
                )}
              />
              <small className="text-500">
                Escriba y presione Enter para agregar cada herramienta
              </small>
            </div>

            {/* Piezas Comunes */}
            <div className="col-12 md:col-6">
              <label
                htmlFor="piezasComunes"
                className="block text-900 font-medium mb-2"
              >
                Piezas Comunes
              </label>
              <Controller
                name="piezasComunes"
                control={control}
                render={({ field }) => (
                  <Chips
                    id="piezasComunes"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Presione Enter para agregar"
                    separator=","
                  />
                )}
              />
              <small className="text-500">
                Escriba y presione Enter para agregar cada pieza
              </small>
            </div>

            {/* Requiere Especialista */}
            <div className="col-12 md:col-6">
              <Controller
                name="requiereEspecialista"
                control={control}
                render={({ field }) => (
                  <div className="flex align-items-center">
                    <Checkbox
                      inputId="requiereEspecialista"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.checked)}
                    />
                    <label
                      htmlFor="requiereEspecialista"
                      className="ml-2 text-900 font-medium"
                    >
                      Requiere Especialista
                    </label>
                  </div>
                )}
              />
            </div>

            {/* Activo */}
            <div className="col-12 md:col-6">
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
                      className="ml-2 text-900 font-medium"
                    >
                      Servicio activo
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
              label={service?._id ? "Actualizar" : "Crear"}
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
