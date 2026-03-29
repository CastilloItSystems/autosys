"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { ProgressSpinner } from "primereact/progressspinner";
import { serviceTypeService } from "@/app/api/workshop";
import { handleFormError } from "@/utils/errorHandlers";
import {
  createServiceTypeSchema,
  updateServiceTypeSchema,
  type CreateServiceTypeForm,
} from "@/libs/zods/workshop/serviceTypeZod";
import type { ServiceType } from "@/libs/interfaces/workshop";

interface ServiceTypeFormProps {
  serviceType: ServiceType | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<any>;
}

export default function ServiceTypeForm({
  serviceType,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: ServiceTypeFormProps) {
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateServiceTypeForm>({
    resolver: zodResolver(serviceType ? updateServiceTypeSchema : createServiceTypeSchema),
    mode: "onBlur",
    defaultValues: { code: "", name: "", description: "", standardMinutes: undefined, standardLaborPrice: undefined },
  });

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (serviceType) {
      reset({
        code: serviceType.code ?? "",
        name: serviceType.name ?? "",
        description: serviceType.description ?? "",
        standardMinutes: serviceType.standardMinutes ?? undefined,
        standardLaborPrice: serviceType.standardLaborPrice ?? undefined,
      });
    } else {
      reset({ code: "", name: "", description: "", standardMinutes: undefined, standardLaborPrice: undefined });
    }
  }, [serviceType, reset, isLoading]);

  const onSubmit = async (data: CreateServiceTypeForm) => {
    onSubmittingChange?.(true);
    try {
      const payload = {
        ...data,
        description: data.description || undefined,
      };
      if (serviceType?.id) {
        await serviceTypeService.update(serviceType.id, payload);
      } else {
        await serviceTypeService.create(payload as any);
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
    <form id={formId ?? "service-type-form"} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
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
                placeholder="Ej: MANT-PREV"
                className={errors.code ? "p-invalid" : ""}
                autoFocus
                disabled={!!serviceType?.id}
                title={serviceType?.id ? "El código no puede ser modificado" : ""}
              />
            )}
          />
          {errors.code && <small className="p-error block mt-1">{errors.code.message}</small>}
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
                placeholder="Ej: Mantenimiento Preventivo"
                className={errors.name ? "p-invalid" : ""}
              />
            )}
          />
          {errors.name && <small className="p-error block mt-1">{errors.name.message}</small>}
        </div>

        {/* Minutos estándar */}
        <div className="col-12 md:col-6">
          <label htmlFor="standardMinutes" className="block text-900 font-medium mb-2">
            Minutos estándar
          </label>
          <Controller
            name="standardMinutes"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="standardMinutes"
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                min={0}
                placeholder="Ej: 60"
                className={errors.standardMinutes ? "p-invalid" : ""}
              />
            )}
          />
          {errors.standardMinutes && <small className="p-error block mt-1">{errors.standardMinutes.message}</small>}
        </div>

        {/* Precio mano de obra */}
        <div className="col-12 md:col-6">
          <label htmlFor="standardLaborPrice" className="block text-900 font-medium mb-2">
            Precio mano de obra
          </label>
          <Controller
            name="standardLaborPrice"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="standardLaborPrice"
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                mode="currency"
                currency="MXN"
                locale="es-MX"
                minFractionDigits={2}
                min={0}
                placeholder="0.00"
                className={errors.standardLaborPrice ? "p-invalid" : ""}
              />
            )}
          />
          {errors.standardLaborPrice && <small className="p-error block mt-1">{errors.standardLaborPrice.message}</small>}
        </div>

        {/* Descripción */}
        <div className="col-12">
          <label htmlFor="description" className="block text-900 font-medium mb-2">
            Descripción
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
                placeholder="Descripción opcional del tipo de servicio"
                className={errors.description ? "p-invalid" : ""}
              />
            )}
          />
          {errors.description && <small className="p-error block mt-1">{errors.description.message}</small>}
        </div>
      </div>
    </form>
  );
}
