"use client";
import React, { useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputTextarea } from "primereact/inputtextarea";
import ServiceOrderSelector from "@/components/common/ServiceOrderSelector";
import {
  WorkshopItemsTable,
  WorkshopFinancialSummary,
  DEFAULT_WORKSHOP_ITEM,
} from "@/components/workshop/shared";
import { useServiceOrderCalculation } from "@/hooks/useServiceOrderCalculation";
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
  embedded?: boolean;
}

export default function AdditionalForm({
  additional,
  onSave,
  formId,
  onSubmittingChange,
  toast,
  embedded,
}: AdditionalFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    register,
    formState: { errors },
  } = useForm<CreateAdditionalForm>({
    resolver: zodResolver(
      additional ? updateAdditionalSchema : createAdditionalSchema,
    ),
    mode: "onBlur",
    defaultValues: {
      description: "",
      serviceOrderId: "",
      items: [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");
  const watchedTypes = (items ?? []).map((it) => it.type as any);

  const calcResult = useServiceOrderCalculation(
    (items ?? []).map((it) => ({
      type: it.type as any,
      quantity: it.quantity ?? 0,
      unitPrice: it.unitPrice ?? 0,
      discountPct: it.discountPct ?? 0,
      taxType: it.taxType as any,
    })),
  );

  useEffect(() => {
    if (additional) {
      reset({
        description: additional.description ?? "",
        serviceOrderId: additional.serviceOrderId ?? "",
        items: (additional.items ?? []).map((it: any) => ({
          id: it.id,
          type: it.type,
          description: it.description,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          unitCost: Number(it.unitCost ?? 0),
          discountPct: Number(it.discountPct ?? 0),
          taxType: it.taxType ?? "IVA",
          taxRate: Number(it.taxRate ?? 0.16),
        })),
      });
    } else {
      reset({ description: "", serviceOrderId: "", items: [] });
    }
  }, [additional, reset]);

  const onSubmit = async (data: CreateAdditionalForm) => {
    onSubmittingChange?.(true);
    try {
      if (additional?.id) {
        await additionalService.update(additional.id, {
          description: data.description,
        });
      } else {
        const res = await additionalService.create({
          description: data.description,
          serviceOrderId: data.serviceOrderId,
          estimatedPrice: calcResult.total,
        });

        for (const item of data.items ?? []) {
          await additionalService.createItem(res.data.id, {
            type: item.type,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost ?? 0,
            discountPct: item.discountPct ?? 0,
            taxType: item.taxType ?? "IVA",
            taxRate: item.taxRate ?? 0.16,
          });
        }
      }
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      onSubmittingChange?.(false);
    }
  };

  return (
    <form
      id={formId ?? "additional-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="space-y-6">
        {/* SECCIÓN 1: Trabajo adicional */}
        <div>
          <h3 className="text-base font-semibold text-900 mb-3">
            Trabajo Adicional
          </h3>
          <div className="grid">
            <div className="col-12">
              <label className="block text-900 font-medium mb-2">
                Descripción <span className="text-red-500">*</span>
              </label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    {...field}
                    value={field.value ?? ""}
                    rows={3}
                    placeholder="Describe el trabajo adicional..."
                    className={errors.description ? "p-invalid" : ""}
                    autoFocus
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
        </div>

        {/* SECCIÓN 2: Ítems */}
        <WorkshopItemsTable
          control={control}
          register={register}
          fields={fields}
          append={append}
          remove={remove}
          move={move}
          errors={errors as any}
          fieldArrayName="items"
          calcResult={calcResult}
          watchedTypes={watchedTypes}
          defaultItem={DEFAULT_WORKSHOP_ITEM}
          title="Ítems"
        />

        {/* SECCIÓN 3: Resumen financiero */}
        {(items?.length ?? 0) > 0 && (
          <WorkshopFinancialSummary totals={calcResult} />
        )}

        {/* SECCIÓN 4: Orden de Trabajo */}
        {!embedded && (
          <div>
            <h3 className="text-base font-semibold text-900 mb-3">
              Orden de Trabajo
            </h3>
            <Controller
              name="serviceOrderId"
              control={control}
              render={({ field }) => (
                <ServiceOrderSelector
                  value={field.value}
                  onChange={field.onChange}
                  invalid={!!errors.serviceOrderId}
                />
              )}
            />
            {errors.serviceOrderId && (
              <small className="p-error block mt-1">
                {errors.serviceOrderId.message}
              </small>
            )}
          </div>
        )}
        {embedded && (
          <div className="p-3 border-1 border-surface-200 border-round text-600 text-sm">
            {additional?.serviceOrder?.folio ??
              additional?.serviceOrderId?.slice(0, 8) ??
              "—"}
          </div>
        )}
      </div>
    </form>
  );
}
