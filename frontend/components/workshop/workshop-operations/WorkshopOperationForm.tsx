"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { ProgressSpinner } from "primereact/progressspinner";
import { workshopOperationService, serviceTypeService } from "@/app/api/workshop";
import { handleFormError } from "@/utils/errorHandlers";
import {
  createWorkshopOperationSchema,
  updateWorkshopOperationSchema,
  type CreateWorkshopOperationForm,
} from "@/libs/zods/workshop/workshopOperationZod";
import type { WorkshopOperation, ServiceType } from "@/libs/interfaces/workshop";

interface WorkshopOperationFormProps {
  operation: WorkshopOperation | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<any>;
}

export default function WorkshopOperationForm({
  operation,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: WorkshopOperationFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateWorkshopOperationForm>({
    resolver: zodResolver(operation ? updateWorkshopOperationSchema : createWorkshopOperationSchema),
    mode: "onBlur",
    defaultValues: {
      code: "",
      name: "",
      description: "",
      serviceTypeId: undefined,
      standardMinutes: undefined,
      listPrice: 0,
    },
  });

  useEffect(() => {
    const init = async () => {
      try {
        const res = await serviceTypeService.getAll({ isActive: "true", limit: 100 });
        setServiceTypes(res.data ?? []);
      } catch {
        // silently fail — field will just be empty
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (operation) {
      reset({
        code: operation.code ?? "",
        name: operation.name ?? "",
        description: operation.description ?? "",
        serviceTypeId: operation.serviceTypeId ?? undefined,
        standardMinutes: operation.standardMinutes ?? undefined,
        listPrice: operation.listPrice ?? 0,
      });
    } else {
      reset({ code: "", name: "", description: "", serviceTypeId: undefined, standardMinutes: undefined, listPrice: 0 });
    }
  }, [operation, reset, isLoading]);

  const onSubmit = async (data: CreateWorkshopOperationForm) => {
    onSubmittingChange?.(true);
    try {
      const payload = {
        ...data,
        description: data.description || undefined,
        serviceTypeId: data.serviceTypeId || undefined,
      };
      if (operation?.id) {
        await workshopOperationService.update(operation.id, payload);
      } else {
        await workshopOperationService.create(payload as any);
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
    <form id={formId ?? "workshop-operation-form"} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
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
                placeholder="Ej: CAMB-ACEITE"
                className={errors.code ? "p-invalid" : ""}
                autoFocus
                disabled={!!operation?.id}
                title={operation?.id ? "El código no puede ser modificado" : ""}
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
                placeholder="Ej: Cambio de aceite y filtro"
                className={errors.name ? "p-invalid" : ""}
              />
            )}
          />
          {errors.name && <small className="p-error block mt-1">{errors.name.message}</small>}
        </div>

        {/* Tipo de servicio */}
        <div className="col-12 md:col-6">
          <label htmlFor="serviceTypeId" className="block text-900 font-medium mb-2">
            Tipo de servicio
          </label>
          <Controller
            name="serviceTypeId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="serviceTypeId"
                value={field.value ?? null}
                onChange={(e) => field.onChange(e.value ?? undefined)}
                options={serviceTypes}
                optionLabel="name"
                optionValue="id"
                placeholder="Sin categoría"
                showClear
                className={errors.serviceTypeId ? "p-invalid" : ""}
              />
            )}
          />
          {errors.serviceTypeId && <small className="p-error block mt-1">{errors.serviceTypeId.message}</small>}
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
                placeholder="Ej: 45"
                className={errors.standardMinutes ? "p-invalid" : ""}
              />
            )}
          />
          {errors.standardMinutes && <small className="p-error block mt-1">{errors.standardMinutes.message}</small>}
        </div>

        {/* Precio lista */}
        <div className="col-12 md:col-6">
          <label htmlFor="listPrice" className="block text-900 font-medium mb-2">
            Precio lista <span className="text-red-500">*</span>
          </label>
          <Controller
            name="listPrice"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="listPrice"
                value={field.value ?? 0}
                onValueChange={(e) => field.onChange(e.value ?? 0)}
                mode="currency"
                currency="MXN"
                locale="es-MX"
                minFractionDigits={2}
                min={0}
                className={errors.listPrice ? "p-invalid" : ""}
              />
            )}
          />
          {errors.listPrice && <small className="p-error block mt-1">{errors.listPrice.message}</small>}
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
                placeholder="Descripción opcional de la operación"
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
