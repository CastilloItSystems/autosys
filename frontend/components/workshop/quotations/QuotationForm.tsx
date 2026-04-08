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
import { createQuotationSchema, updateQuotationSchema, type CreateQuotationFormValues } from "@/libs/zods/workshop";
import { QUOTATION_ITEM_TYPE_OPTIONS, QUOTATION_ITEM_TYPE_LABELS } from "./QuotationStatusBadge";

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
  discount: 0,
  tax: 0,
  approved: true,
  order: 0,
};

const fmt = (v: number) => v.toLocaleString("es-MX", { minimumFractionDigits: 2 });

export default function QuotationForm({
  quotation, receptionId, diagnosisId, customerId, customerVehicleId,
  formId, onSave, onSubmittingChange, toast,
}: Props) {
  const isUpdate = !!quotation?.id;
  const schema = isUpdate ? updateQuotationSchema : createQuotationSchema;

  const defaultValues: any = isUpdate
    ? {
        validUntil: quotation.validUntil ? new Date(quotation.validUntil) : null,
        notes: quotation.notes ?? "",
        internalNotes: quotation.internalNotes ?? "",
        items: quotation.items.map(it => ({
          id: it.id,
          type: it.type,
          referenceId: it.referenceId ?? undefined,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          unitCost: it.unitCost,
          discount: it.discount,
          tax: it.tax,
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

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateQuotationFormValues>({
    resolver: zodResolver(schema as any),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");

  // Calcular totales reactivos
  const totals = (items ?? []).reduce(
    (acc, it) => {
      const sub = (it.quantity ?? 0) * (it.unitPrice ?? 0);
      const disc = it.discount ?? 0;
      const tax = it.tax ?? 0;
      acc.subtotal += sub;
      acc.discount += disc;
      acc.tax += tax;
      acc.total += sub - disc + tax;
      return acc;
    },
    { subtotal: 0, discount: 0, tax: 0, total: 0 }
  );

  const onSubmit = async (data: any) => {
    onSubmittingChange(true);
    try {
      const payload: any = {
        ...data,
        validUntil: data.validUntil ? new Date(data.validUntil).toISOString() : null,
      };
      if (isUpdate) {
        await quotationService.update(quotation!.id, payload);
      } else {
        await quotationService.create(payload);
      }
      onSave();
    } catch (err) {
      handleFormError(err, toast.current!);
    } finally {
      onSubmittingChange(false);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      {/* Encabezado */}
      <div className="grid">
        <div className="col-12 md:col-6">
          <label className="block mb-1 font-semibold text-sm">Válida hasta</label>
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
      <Divider align="left">
        <span className="font-bold text-sm">Ítems de la cotización</span>
      </Divider>

      {fields.map((field, idx) => (
        <div key={field.id} className="border-1 border-round border-300 p-3 mb-2 surface-50">
          <div className="flex justify-content-between align-items-center mb-2">
            <Tag value={`Ítem ${idx + 1}`} severity="info" rounded />
            {fields.length > 1 && (
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                type="button"
                size="small"
                onClick={() => remove(idx)}
                tooltip="Eliminar ítem"
              />
            )}
          </div>
          <div className="grid">
            <div className="col-12 md:col-4">
              <label className="block mb-1 text-sm font-semibold">Tipo *</label>
              <Controller
                name={`items.${idx}.type`}
                control={control}
                render={({ field: f }) => (
                  <Dropdown
                    {...f}
                    options={QUOTATION_ITEM_TYPE_OPTIONS}
                    placeholder="Tipo de ítem"
                    className={errors.items?.[idx]?.type ? "p-invalid" : ""}
                  />
                )}
              />
            </div>
            <div className="col-12 md:col-8">
              <label className="block mb-1 text-sm font-semibold">Descripción *</label>
              <Controller
                name={`items.${idx}.description`}
                control={control}
                render={({ field: f }) => (
                  <InputText
                    {...f}
                    placeholder="Descripción del servicio o repuesto"
                    className={errors.items?.[idx]?.description ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.items?.[idx]?.description && (
                <small className="p-error">{errors.items[idx]?.description?.message}</small>
              )}
            </div>
            <div className="col-6 md:col-3">
              <label className="block mb-1 text-sm font-semibold">Cantidad *</label>
              <Controller
                name={`items.${idx}.quantity`}
                control={control}
                render={({ field: f }) => (
                  <InputNumber
                    value={f.value}
                    onValueChange={(e) => f.onChange(e.value)}
                    minFractionDigits={0}
                    maxFractionDigits={2}
                    min={0.01}
                    className={errors.items?.[idx]?.quantity ? "p-invalid" : ""}
                  />
                )}
              />
            </div>
            <div className="col-6 md:col-3">
              <label className="block mb-1 text-sm font-semibold">Precio unitario *</label>
              <Controller
                name={`items.${idx}.unitPrice`}
                control={control}
                render={({ field: f }) => (
                  <InputNumber
                    value={f.value}
                    onValueChange={(e) => f.onChange(e.value ?? 0)}
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    min={0}
                    prefix="$ "
                    className={errors.items?.[idx]?.unitPrice ? "p-invalid" : ""}
                  />
                )}
              />
            </div>
            <div className="col-6 md:col-3">
              <label className="block mb-1 text-sm font-semibold">Descuento</label>
              <Controller
                name={`items.${idx}.discount`}
                control={control}
                render={({ field: f }) => (
                  <InputNumber
                    value={f.value}
                    onValueChange={(e) => f.onChange(e.value ?? 0)}
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    min={0}
                    prefix="$ "
                  />
                )}
              />
            </div>
            <div className="col-6 md:col-3">
              <label className="block mb-1 text-sm font-semibold">Impuesto</label>
              <Controller
                name={`items.${idx}.tax`}
                control={control}
                render={({ field: f }) => (
                  <InputNumber
                    value={f.value}
                    onValueChange={(e) => f.onChange(e.value ?? 0)}
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    min={0}
                    prefix="$ "
                  />
                )}
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        label="Agregar ítem"
        icon="pi pi-plus"
        outlined
        size="small"
        className="mb-3"
        onClick={() => append({ ...EMPTY_ITEM, order: fields.length })}
      />

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
          <label className="block mb-1 font-semibold text-sm">Notas para el cliente</label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputTextarea {...field} value={field.value ?? ""} rows={3} placeholder="Condiciones, observaciones para el cliente..." />
            )}
          />
        </div>
        <div className="col-12 md:col-6">
          <label className="block mb-1 font-semibold text-sm">Notas internas</label>
          <Controller
            name="internalNotes"
            control={control}
            render={({ field }) => (
              <InputTextarea {...field} value={field.value ?? ""} rows={3} placeholder="Observaciones internas del equipo..." />
            )}
          />
        </div>
      </div>
    </form>
  );
}
