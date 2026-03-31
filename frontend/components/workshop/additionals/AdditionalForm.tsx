"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { ProgressSpinner } from "primereact/progressspinner";
import { additionalService } from "@/app/api/workshop";
import { handleFormError } from "@/utils/errorHandlers";
import {
  createAdditionalSchema,
  updateAdditionalSchema,
  type CreateAdditionalForm,
} from "@/libs/zods/workshop/additionalZod";
import type { ServiceOrderAdditional } from "@/libs/interfaces/workshop";

interface AdditionalFormProps {
  additional: ServiceOrderAdditional | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<any>;
}

export default function AdditionalForm({
  additional,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: AdditionalFormProps) {
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAdditionalForm>({
    resolver: zodResolver(additional ? updateAdditionalSchema : createAdditionalSchema),
    mode: "onBlur",
    defaultValues: {
      description: "",
      estimatedPrice: undefined,
      serviceOrderId: "",
    },
  });

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (additional) {
      reset({
        description: additional.description ?? "",
        estimatedPrice: additional.estimatedPrice ?? undefined,
        serviceOrderId: additional.serviceOrderId ?? "",
      });
    } else {
      reset({
        description: "",
        estimatedPrice: undefined,
        serviceOrderId: "",
      });
    }
  }, [additional, reset, isLoading]);

  const onSubmit = async (data: CreateAdditionalForm) => {
    onSubmittingChange?.(true);
    try {
      if (additional?.id) {
        await additionalService.update(additional.id, data);
      } else {
        await additionalService.create(data);
      }
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      onSubmittingChange?.(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-column align-items-center justify-content-center p-4">
        <ProgressSpinner style={{ width: "40px", height: "40px" }} strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
        <p className="mt-3 text-600 font-medium">Preparando formulario...</p>
      </div>
    );
  }

  return (
    <form id={formId ?? "additional-form"} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid">
        {/* Descripción */}
        <div className="col-12">
          <label htmlFor="description" className="block text-900 font-medium mb-2">
            Descripción <span className="text-red-500">*</span>
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="description"
                {...field}
                value={field.value ?? ""}
                rows={3}
                placeholder="Describe el trabajo adicional requerido..."
                className={errors.description ? "p-invalid" : ""}
                autoFocus
              />
            )}
          />
          {errors.description && <small className="p-error block mt-1">{errors.description.message}</small>}
        </div>

        {/* Precio estimado */}
        <div className="col-12 md:col-6">
          <label htmlFor="estimatedPrice" className="block text-900 font-medium mb-2">
            Precio estimado <span className="text-red-500">*</span>
          </label>
          <Controller
            name="estimatedPrice"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="estimatedPrice"
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                mode="currency"
                currency="MXN"
                locale="es-MX"
                minFractionDigits={2}
                min={0}
                placeholder="0.00"
                className={errors.estimatedPrice ? "p-invalid" : ""}
              />
            )}
          />
          {errors.estimatedPrice && <small className="p-error block mt-1">{errors.estimatedPrice.message}</small>}
        </div>

        {/* ID de Orden de Trabajo */}
        <div className="col-12 md:col-6">
          <label htmlFor="serviceOrderId" className="block text-900 font-medium mb-2">
            ID de Orden de Trabajo <span className="text-red-500">*</span>
          </label>
          <Controller
            name="serviceOrderId"
            control={control}
            render={({ field }) => (
              <InputText
                id="serviceOrderId"
                {...field}
                placeholder="ID de la OT"
                className={errors.serviceOrderId ? "p-invalid" : ""}
              />
            )}
          />
          {errors.serviceOrderId && <small className="p-error block mt-1">{errors.serviceOrderId.message}</small>}
        </div>
      </div>
    </form>
  );
}
