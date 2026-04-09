"use client";
import React, { useEffect, useRef } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { handleFormError } from "@/utils/errorHandlers";
import { quotationService } from "@/app/api/workshop";
import type { WorkshopQuotation } from "@/libs/interfaces/workshop";
import {
  createQuotationSchema,
  updateQuotationSchema,
  type CreateQuotationFormValues,
} from "@/libs/zods/workshop";
import {
  QUOTATION_ITEM_TYPE_OPTIONS,
  QUOTATION_ITEM_TYPE_LABELS,
} from "./QuotationStatusBadge";
import ItemsTable from "@/components/inventory/common/ItemsTable";
import QuotationItemRow, {
  QuotationItemRowColWidths,
} from "./QuotationItemRow";
import CustomerSelector from "@/components/common/CustomerSelector";
import VehicleSelector from "@/components/common/VehicleSelector";

interface Props {
  quotation?: WorkshopQuotation | null;
  receptionId?: string;
  diagnosisId?: string;
  customerId?: string;
  customerVehicleId?: string;
  formId: string;
  onSave: () => void;
  onSubmittingChange: (v: boolean) => void;
  toast: React.RefObject<Toast>;
}

const EMPTY_ITEM = {
  type: "LABOR" as const,
  description: "",
  quantity: 1,
  unitPrice: 0,
  unitCost: 0,
  discountPct: 0,
  taxType: "IVA",
  taxRate: 0.16,
  taxAmount: 0,
  approved: true,
  order: 0,
};

const fmt = (v: number) =>
  v.toLocaleString("es-MX", { minimumFractionDigits: 2 });

const COLS: QuotationItemRowColWidths = {
  handle: { width: "2rem", flexShrink: 0 },
  type: { width: "12rem", flexShrink: 0 },
  description: { flex: "1 1 0", minWidth: "15rem" },
  quantity: { width: "6rem", flexShrink: 0 },
  unitPrice: { width: "8rem", flexShrink: 0 },
  discount: { width: "7rem", flexShrink: 0 },
  tax: { width: "7rem", flexShrink: 0 },
  totalLine: { width: "8rem", flexShrink: 0 },
  remove: { width: "3rem", flexShrink: 0 },
};

export default function QuotationForm({
  quotation,
  receptionId,
  diagnosisId,
  customerId,
  customerVehicleId,
  formId,
  onSave,
  onSubmittingChange,
  toast,
}: Props) {
  const isUpdate = !!quotation?.id;
  const schema = isUpdate ? updateQuotationSchema : createQuotationSchema;

  const defaultValues: any = isUpdate
    ? {
        validUntil: quotation.validUntil
          ? new Date(quotation.validUntil)
          : null,
        notes: quotation.notes ?? "",
        internalNotes: quotation.internalNotes ?? "",
        items: quotation.items.map((it) => ({
          id: it.id,
          type: it.type,
          referenceId: it.referenceId ?? undefined,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          unitCost: it.unitCost,
          discountPct: (it as any).discountPct ?? 0,
          taxType: (it as any).taxType ?? "IVA",
          taxRate: (it as any).taxRate ?? 0.16,
          taxAmount: (it as any).taxAmount ?? 0,
          approved: it.approved,
          order: it.order,
        })),
      }
    : {
        customerId: customerId ?? "",
        customerVehicleId: customerVehicleId ?? undefined,
        receptionId: receptionId ?? undefined,
        diagnosisId: diagnosisId ?? undefined,
        isSupplementary: false,
        validUntil: null,
        notes: "",
        internalNotes: "",
        items: [EMPTY_ITEM],
      };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateQuotationFormValues>({
    resolver: zodResolver(schema as any),
    defaultValues,
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "items",
  });
  const items = watch("items");

  // Calcular totales reactivos
  const totals = (items ?? []).reduce(
    (acc, it) => {
      const sub = (it.quantity ?? 0) * (it.unitPrice ?? 0);
      const disc = (sub * ((it as any).discountPct ?? 0)) / 100;
      const tax = (sub - disc) * ((it as any).taxRate ?? 0.16);
      acc.subtotal += sub;
      acc.discount += disc;
      acc.tax += tax;
      acc.total += sub - disc + tax;
      return acc;
    },
    { subtotal: 0, discount: 0, tax: 0, total: 0 },
  );

  const onSubmit = async (data: any) => {
    onSubmittingChange(true);
    try {
      const payload: any = {
        ...data,
        validUntil: data.validUntil
          ? new Date(data.validUntil).toISOString()
          : null,
      };
      if (isUpdate) {
        await quotationService.update(quotation!.id, payload);
      } else {
        await quotationService.create(payload);
      }
      onSave();
    } catch (err) {
      handleFormError(err, toast);
    } finally {
      onSubmittingChange(false);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      {/* Encabezado */}
      <div className="grid">
        <div className="col-12 md:col-6 lg:col-4">
          <label className="block mb-1 font-semibold text-sm">Cliente *</label>
          <Controller
            name="customerId"
            control={control}
            render={({ field, fieldState }) => (
              <CustomerSelector
                value={field.value}
                onChange={(id) => {
                  field.onChange(id);
                  setValue("customerVehicleId", ""); // Reset vehicle when customer changes
                }}
                invalid={!!fieldState.error}
              />
            )}
          />
          {errors.customerId && (
            <small className="p-error">{errors.customerId.message}</small>
          )}
        </div>

        <div className="col-12 md:col-6 lg:col-4">
          <label className="block mb-1 font-semibold text-sm">Vehículo</label>
          <Controller
            name="customerVehicleId"
            control={control}
            render={({ field, fieldState }) => (
              <VehicleSelector
                customerId={watch("customerId")}
                value={field.value}
                onChange={field.onChange}
                invalid={!!fieldState.error}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6 lg:col-4">
          <label className="block mb-1 font-semibold text-sm">
            Válida hasta
          </label>
          <Controller
            name="validUntil"
            control={control}
            render={({ field }) => (
              <Calendar
                {...field}
                value={field.value ? new Date(field.value as any) : null}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="dd/mm/yy"
                placeholder="Seleccionar fecha"
                showIcon
              />
            )}
          />
        </div>
      </div>

      {/* Ítems */}
      <div className="mb-4">
        <ItemsTable
          fields={fields}
          append={append}
          remove={remove}
          move={move}
          defaultItem={{ ...EMPTY_ITEM, order: fields.length }}
          title="Ítems de la cotización"
          columns={[
            { label: "", style: COLS.handle },
            { label: "Tipo", style: COLS.type },
            { label: "Descripción", style: COLS.description },
            { label: "Cant.", style: COLS.quantity },
            { label: "Precio Unit.", style: COLS.unitPrice },
            { label: "% Desc.", style: COLS.discount },
            { label: "I.V.A.", style: COLS.tax },
            { label: "Total Línea", style: COLS.totalLine },
            { label: "", style: COLS.remove },
          ]}
          renderRow={({ index, dragHandleProps, isDragging }) => (
            <QuotationItemRow
              key={fields[index].id}
              control={control}
              index={index}
              rowErrors={errors.items?.[index] as any}
              colWidths={COLS}
              onRemove={() => remove(index)}
              canRemove={fields.length > 1}
              dragHandleProps={dragHandleProps}
              isDragging={isDragging}
              itemValues={items?.[index]}
            />
          )}
        />
      </div>

      {/* Totales */}
      <div className="border-1 border-round border-primary-200 p-3 surface-ground mb-3">
        <div className="flex justify-content-between mb-1 text-sm">
          <span className="text-600">Subtotal</span>
          <span className="font-semibold">$ {fmt(totals.subtotal)}</span>
        </div>
        <div className="flex justify-content-between mb-1 text-sm">
          <span className="text-600">Descuento total</span>
          <span className="text-red-500">- $ {fmt(totals.discount)}</span>
        </div>
        <div className="flex justify-content-between mb-1 text-sm">
          <span className="text-600">Impuesto</span>
          <span>+ $ {fmt(totals.tax)}</span>
        </div>
        <Divider className="my-2" />
        <div className="flex justify-content-between text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">$ {fmt(totals.total)}</span>
        </div>
      </div>

      {/* Notas */}
      <div className="grid">
        <div className="col-12 md:col-6">
          <label className="block mb-1 font-semibold text-sm">
            Notas para el cliente
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                {...field}
                value={field.value ?? ""}
                rows={3}
                placeholder="Condiciones, observaciones para el cliente..."
              />
            )}
          />
        </div>
        <div className="col-12 md:col-6">
          <label className="block mb-1 font-semibold text-sm">
            Notas internas
          </label>
          <Controller
            name="internalNotes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                {...field}
                value={field.value ?? ""}
                rows={3}
                placeholder="Observaciones internas del equipo..."
              />
            )}
          />
        </div>
      </div>

      {/* Botón oculto para permitir el envío con la tecla Enter */}
      <button
        type="submit"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
    </form>
  );
}
