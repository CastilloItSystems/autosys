"use client";
import React, { useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputTextarea } from "primereact/inputtextarea";
import ServiceOrderSelector from "@/components/common/ServiceOrderSelector";
import ItemsTable, { ColumnDef } from "@/components/inventory/common/ItemsTable";
import AdditionalItemRow, { AdditionalItemRowColWidths } from "./AdditionalItemRow";
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

const EMPTY_ITEM = { type: "LABOR" as const, description: "", quantity: 1, unitPrice: 0, unitCost: 0 };

// Column widths for AdditionalItemRow
const itemColWidths: AdditionalItemRowColWidths = {
  handle: { width: "2rem", minWidth: "2rem", flexShrink: 0 },
  type: { width: "12rem", minWidth: "12rem", flexShrink: 0 },
  description: { flex: "1 1 0", minWidth: "15rem" },
  quantity: { width: "6rem", minWidth: "6rem", flexShrink: 0 },
  unitPrice: { width: "9rem", minWidth: "9rem", flexShrink: 0 },
  totalLine: { width: "9rem", minWidth: "9rem", flexShrink: 0 },
  remove: { width: "3rem", minWidth: "3rem", flexShrink: 0 },
};

const itemsTableColumns: ColumnDef[] = [
  { label: "", style: itemColWidths.handle },
  { label: "Tipo", style: itemColWidths.type },
  { label: "Descripción", style: itemColWidths.description },
  { label: "Cant.", style: itemColWidths.quantity },
  { label: "Precio Unit.", style: itemColWidths.unitPrice },
  { label: "Total", style: itemColWidths.totalLine },
  { label: "", style: itemColWidths.remove },
];

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
    formState: { errors },
  } = useForm<CreateAdditionalForm>({
    resolver: zodResolver(additional ? updateAdditionalSchema : createAdditionalSchema),
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

  useEffect(() => {
    if (additional) {
      reset({
        description: additional.description ?? "",
        serviceOrderId: additional.serviceOrderId ?? "",
        items: additional.items ?? [],
      });
    } else {
      reset({
        description: "",
        serviceOrderId: "",
        items: [],
      });
    }
  }, [additional, reset]);

  const totalItems = (items ?? []).reduce((sum, item) => sum + (item.quantity ?? 0) * (item.unitPrice ?? 0), 0);

  const onSubmit = async (data: CreateAdditionalForm) => {
    onSubmittingChange?.(true);
    try {
      const estimatedPrice = (data.items ?? []).reduce(
        (sum, it) => sum + (it.quantity ?? 0) * (it.unitPrice ?? 0),
        0
      );

      if (additional?.id) {
        // Update only the main fields
        await additionalService.update(additional.id, {
          description: data.description,
        });
      } else {
        // Create the main work with computed estimatedPrice
        const res = await additionalService.create({
          description: data.description,
          serviceOrderId: data.serviceOrderId,
          estimatedPrice,
        });

        // Create all items
        for (const item of data.items ?? []) {
          await additionalService.createItem(res.data.id, {
            type: item.type,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost ?? 0,
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
    <form id={formId ?? "additional-form"} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="space-y-6">
        {/* SECCIÓN 1: Trabajo adicional */}
        <div>
          <h3 className="text-base font-semibold text-900 mb-3">Trabajo Adicional</h3>
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
              {errors.description && <small className="p-error block mt-1">{errors.description.message}</small>}
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Ítems */}
        <div className="grid">
          <ItemsTable
            fields={fields}
            append={append}
            remove={remove}
            move={move}
            defaultItem={EMPTY_ITEM}
            columns={itemsTableColumns}
            renderRow={({ field, index, dragHandleProps, isDragging }) => (
              <AdditionalItemRow
                control={control}
                index={index}
                rowErrors={errors.items?.[index]}
                colWidths={itemColWidths}
                onRemove={() => remove(index)}
                canRemove={fields.length > 0}
                dragHandleProps={dragHandleProps}
                isDragging={isDragging}
                itemValues={items?.[index]}
              />
            )}
            title="Ítems"
            minWidth={650}
          />
          {items && items.length > 0 && (
            <div className="col-12 flex justify-content-end pt-2 border-top-1 border-200">
              <div className="flex gap-3 align-items-center">
                <span className="text-sm font-semibold text-600">Total:</span>
                <span className="text-lg font-bold text-primary">
                  {totalItems.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* SECCIÓN 3: Orden de Trabajo */}
        <div>
          <h3 className="text-base font-semibold text-900 mb-3">Orden de Trabajo</h3>
          {embedded ? (
            <div className="p-3 border-1 border-surface-200 border-round text-600 text-sm">
              {additional?.serviceOrder?.folio ?? additional?.serviceOrderId?.slice(0, 8) ?? "—"}
            </div>
          ) : (
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
          )}
          {!embedded && errors.serviceOrderId && <small className="p-error block mt-1">{errors.serviceOrderId.message}</small>}
        </div>
      </div>
    </form>
  );
}
