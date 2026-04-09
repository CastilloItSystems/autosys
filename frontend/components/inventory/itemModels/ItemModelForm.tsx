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
import { InputNumber } from "primereact/inputnumber";
import { TabView, TabPanel } from "primereact/tabview";
import ModelCompatibilitySelector from "./ModelCompatibilitySelector";

// API functions
import modelsService, {
  ModelType,
  MODEL_TYPE_LABELS,
  type Model,
} from "@/app/api/inventory/modelService";
import brandsService, { type Brand } from "@/app/api/inventory/brandService";
import { handleFormError } from "@/utils/errorHandlers";

// Schema de validación
const modelSchema = z.object({
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
  brandId: z.string().min(1, "Marca es requerida"),
  type: z.enum(["VEHICLE", "PART"] as const, {
    errorMap: () => ({ message: "Tipo de modelo es requerido" }),
  }),
  year: z
    .number()
    .min(1900, "Año debe ser mayor a 1900")
    .max(new Date().getFullYear() + 1, "Año no puede ser en el futuro")
    .optional()
    .or(z.literal(null)),
  description: z
    .string()
    .max(500, "Descripción no puede exceder 500 caracteres")
    .optional(),
});

type FormData = z.infer<typeof modelSchema>;

interface ItemModelFormProps {
  model: Model | null;
  formId?: string;
  onSave: () => void | Promise<void>;
  onCreated?: (item: any) => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<any>;
}

// Opciones de tipo con etiquetas en español
const MODEL_TYPE_OPTIONS = [
  { label: MODEL_TYPE_LABELS.VEHICLE, value: "VEHICLE" as ModelType },
  { label: MODEL_TYPE_LABELS.PART, value: "PART" as ModelType },
];

export default function ItemModelForm({
  model,
  formId,
  onSave,
  onCreated,
  onSubmittingChange,
  toast,
}: ItemModelFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(modelSchema),
    mode: "onBlur",
    defaultValues: {
      code: "",
      name: "",
      brandId: "",
      type: "PART",
      year: undefined,
      description: "",
    },
  });

  // Cargar marcas activas
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const response = await brandsService.getActive();
        const brandsData = response.data || [];
        setBrands(Array.isArray(brandsData) ? brandsData : []);
      } catch (error) {
        console.error("Error loading brands:", error);
      }
    };

    loadBrands();
  }, []);

  // Simular loading inicial para consistencia visual
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Cargar datos del modelo si está en modo edición
  useEffect(() => {
    if (model && !isLoading) {
      reset({
        code: model.code || "",
        name: model.name || "",
        brandId: model.brandId || "",
        type: model.type || "PART",
        year: model.year || undefined,
        description: model.description || "",
      });
    } else if (!model && !isLoading) {
      reset({
        code: "",
        name: "",
        brandId: "",
        type: "PART",
        year: undefined,
        description: "",
      });
    }
  }, [model, reset, isLoading]);

  /**
   * Maneja el envío del formulario
   */
  const onSubmit = async (data: FormData) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      // Remove null year values for API compatibility
      const submitData = {
        ...data,
        year: data.year === null ? undefined : data.year,
      };

      if (model?.id) {
        await modelsService.update(model.id, submitData);
        await onSave();
      } else {
        const res = await modelsService.create(submitData);
        await onSave();
        if (onCreated) onCreated(res?.data ?? res);
      }
    } catch (error: any) {
      handleFormError(error, toast);
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  const brandOptions = brands.map((brand) => ({
    label: brand.name,
    value: brand.id,
  }));

  const BasicDataForm = () => (
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
              placeholder="Ej: MODEL-001, CIVIC-2024"
              className={errors.code ? "p-invalid" : ""}
              autoFocus
              disabled={!!model?.id}
              title={model?.id ? "El código no puede ser modificado" : ""}
            />
          )}
        />
        {errors.code && (
          <small className="p-error block mt-1">{errors.code.message}</small>
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
              placeholder="Ej: Honda Civic, Toyota Corolla"
              className={errors.name ? "p-invalid" : ""}
            />
          )}
        />
        {errors.name && (
          <small className="p-error block mt-1">{errors.name.message}</small>
        )}
      </div>

      {/* Marca */}
      <div className="col-12 md:col-6">
        <label htmlFor="brandId" className="block text-900 font-medium mb-2">
          Marca <span className="text-red-500">*</span>
        </label>
        <Controller
          name="brandId"
          control={control}
          render={({ field }) => (
            <Dropdown
              {...field}
              id="brandId"
              options={brandOptions}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar marca"
              className={errors.brandId ? "p-invalid" : ""}
              filter
            />
          )}
        />
        {errors.brandId && (
          <small className="p-error block mt-1">{errors.brandId.message}</small>
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
              options={MODEL_TYPE_OPTIONS}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar tipo"
              className={errors.type ? "p-invalid" : ""}
            />
          )}
        />
        {errors.type && (
          <small className="p-error block mt-1">{errors.type.message}</small>
        )}
      </div>

      {/* Año */}
      <div className="col-12 md:col-6">
        <label htmlFor="year" className="block text-900 font-medium mb-2">
          Año
        </label>
        <Controller
          name="year"
          control={control}
          render={({ field }) => (
            <InputNumber
              {...field}
              id="year"
              placeholder="Ej: 2024"
              min={1900}
              max={new Date().getFullYear() + 1}
              className={errors.year ? "p-invalid" : ""}
              useGrouping={false}
            />
          )}
        />
        {errors.year && (
          <small className="p-error block mt-1">{errors.year.message}</small>
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
              placeholder="Descripción del modelo (opcional)"
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
  );

  return (
    <form
      id={formId || "model-form"}
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
          {model?.id ? (
            <TabView>
              <TabPanel header="Datos del Modelo" leftIcon="pi pi-info-circle">
                <BasicDataForm />
              </TabPanel>
              <TabPanel header="Compatibilidad" leftIcon="pi pi-link">
                <ModelCompatibilitySelector
                  modelId={model.id}
                  modelType={model.type}
                  toast={toast}
                />
              </TabPanel>
            </TabView>
          ) : (
            <BasicDataForm />
          )}
        </>
      )}
    </form>
  );
}
