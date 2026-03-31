"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { ProgressSpinner } from "primereact/progressspinner";
import { materialService } from "@/app/api/workshop";
import { handleFormError } from "@/utils/errorHandlers";
import {
  createMaterialSchema,
  updateMaterialSchema,
  type CreateMaterialForm,
} from "@/libs/zods/workshop/materialZod";
import type { ServiceOrderMaterial } from "@/libs/interfaces/workshop";

interface MaterialFormProps {
  material: ServiceOrderMaterial | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<any>;
}

export default function MaterialForm({
  material,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: MaterialFormProps) {
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateMaterialForm>({
    resolver: zodResolver(material ? updateMaterialSchema : createMaterialSchema),
    mode: "onBlur",
    defaultValues: {
      description: "",
      quantityRequested: undefined,
      unitPrice: undefined,
      unitCost: undefined,
      serviceOrderId: "",
      itemId: undefined,
    },
  });

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (material) {
      reset({
        description: material.description ?? "",
        quantityRequested: material.quantityRequested ?? undefined,
        unitPrice: material.unitPrice ?? undefined,
        unitCost: material.unitCost ?? undefined,
        serviceOrderId: material.serviceOrderId ?? "",
        itemId: material.itemId ?? undefined,
      });
    } else {
      reset({
        description: "",
        quantityRequested: undefined,
        unitPrice: undefined,
        unitCost: undefined,
        serviceOrderId: "",
        itemId: undefined,
      });
    }
  }, [material, reset, isLoading]);

  const onSubmit = async (data: CreateMaterialForm) => {
    onSubmittingChange?.(true);
    try {
      const payload = {
        ...data,
        unitCost: data.unitCost ?? undefined,
        itemId: data.itemId || undefined,
      };
      if (material?.id) {
        await materialService.update(material.id, payload);
      } else {
        await materialService.create(payload as any);
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
    <form id={formId ?? "material-form"} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
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
              <InputText
                id="description"
                {...field}
                placeholder="Ej: Filtro de aceite, Balatas delanteras..."
                className={errors.description ? "p-invalid" : ""}
                autoFocus
              />
            )}
          />
          {errors.description && <small className="p-error block mt-1">{errors.description.message}</small>}
        </div>

        {/* Cantidad solicitada */}
        <div className="col-12 md:col-6">
          <label htmlFor="quantityRequested" className="block text-900 font-medium mb-2">
            Cantidad solicitada <span className="text-red-500">*</span>
          </label>
          <Controller
            name="quantityRequested"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="quantityRequested"
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                min={1}
                showButtons
                placeholder="1"
                className={errors.quantityRequested ? "p-invalid" : ""}
              />
            )}
          />
          {errors.quantityRequested && <small className="p-error block mt-1">{errors.quantityRequested.message}</small>}
        </div>

        {/* Precio unitario */}
        <div className="col-12 md:col-6">
          <label htmlFor="unitPrice" className="block text-900 font-medium mb-2">
            Precio unitario <span className="text-red-500">*</span>
          </label>
          <Controller
            name="unitPrice"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="unitPrice"
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                mode="currency"
                currency="MXN"
                locale="es-MX"
                minFractionDigits={2}
                min={0}
                placeholder="0.00"
                className={errors.unitPrice ? "p-invalid" : ""}
              />
            )}
          />
          {errors.unitPrice && <small className="p-error block mt-1">{errors.unitPrice.message}</small>}
        </div>

        {/* Costo unitario (opcional) */}
        <div className="col-12 md:col-6">
          <label htmlFor="unitCost" className="block text-900 font-medium mb-2">
            Costo unitario <span className="text-500 font-normal">(opcional)</span>
          </label>
          <Controller
            name="unitCost"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="unitCost"
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                mode="currency"
                currency="MXN"
                locale="es-MX"
                minFractionDigits={2}
                min={0}
                placeholder="0.00"
                className={errors.unitCost ? "p-invalid" : ""}
              />
            )}
          />
          {errors.unitCost && <small className="p-error block mt-1">{errors.unitCost.message}</small>}
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

        {/* ID de Ítem de Inventario (opcional) */}
        <div className="col-12">
          <label htmlFor="itemId" className="block text-900 font-medium mb-2">
            ID de Ítem de Inventario <span className="text-500 font-normal">(opcional)</span>
          </label>
          <Controller
            name="itemId"
            control={control}
            render={({ field }) => (
              <InputText
                id="itemId"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || undefined)}
                placeholder="ID del ítem en inventario"
                className={errors.itemId ? "p-invalid" : ""}
              />
            )}
          />
          {errors.itemId && <small className="p-error block mt-1">{errors.itemId.message}</small>}
        </div>
      </div>
    </form>
  );
}
