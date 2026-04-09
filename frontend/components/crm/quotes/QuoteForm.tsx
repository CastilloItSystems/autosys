"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";

import { createQuoteSchema, CreateQuoteInput } from "@/libs/zods/crm/quoteZod";
import {
  Quote,
  QUOTE_TYPE_OPTIONS,
} from "@/libs/interfaces/crm/quote.interface";
import quoteService from "@/app/api/crm/quoteService";
import customerCrmService from "@/app/api/crm/customerCrmService";
import leadService from "@/app/api/crm/leadService";
import { handleFormError } from "@/utils/errorHandlers";

interface Props {
  quote: Quote | null;
  visible: boolean;
  onHide: () => void;
  onSaved: () => void;
  toast: React.RefObject<Toast> | null;
}

const currencyOptions = [
  { label: "USD", value: "USD" },
  { label: "VES", value: "VES" },
  { label: "EUR", value: "EUR" },
];

function calcItemTotal(qty: number, price: number, discPct: number, taxPct: number): number {
  return qty * price * (1 - discPct / 100) * (1 + taxPct / 100);
}

export default function QuoteForm({ quote, visible, onHide, onSaved, toast }: Props) {
  const isEditing = !!quote;
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<{ label: string; value: string }[]>([]);
  const [leads, setLeads] = useState<{ label: string; value: string }[]>([]);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateQuoteInput>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: quote
      ? {
          title: quote.title,
          type: quote.type as any,
          customerId: quote.customerId,
          leadId: quote.leadId ?? undefined,
          description: quote.description ?? undefined,
          currency: quote.currency ?? "USD",
          discountPct: Number(quote.discountPct) ?? 0,
          taxPct: Number(quote.taxPct) ?? 0,
          validUntil: quote.validUntil
            ? quote.validUntil.slice(0, 10)
            : undefined,
          paymentTerms: quote.paymentTerms ?? undefined,
          deliveryTerms: quote.deliveryTerms ?? undefined,
          notes: quote.notes ?? undefined,
          assignedTo: quote.assignedTo ?? undefined,
          items: (quote.items ?? []).map((it) => ({
            description: it.description,
            quantity: Number(it.quantity),
            unitPrice: Number(it.unitPrice),
            discountPct: Number(it.discountPct),
            taxPct: Number(it.taxPct),
            itemId: it.itemId ?? undefined,
            notes: it.notes ?? undefined,
          })),
        }
      : {
          currency: "USD",
          discountPct: 0,
          taxPct: 0,
          items: [],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const watchedItems = watch("items");
  const watchedCustomerId = watch("customerId");

  // Load customers
  useEffect(() => {
    customerCrmService
      .getActive()
      .then((res) => {
        const list = (res as any)?.data ?? res ?? [];
        setCustomers(
          list.map((c: any) => ({ label: `${c.name} (${c.code})`, value: c.id }))
        );
      })
      .catch(() => {});
  }, []);

  // Load leads for selected customer
  useEffect(() => {
    if (!watchedCustomerId) {
      setLeads([]);
      setValue("leadId", undefined);
      return;
    }
    leadService
      .getAll({ customerId: watchedCustomerId, limit: 200 })
      .then((res) => {
        const list = (res as any)?.data ?? res ?? [];
        setLeads(
          list.map((l: any) => ({
            label: `${l.title} [${l.channel}]`,
            value: l.id,
          }))
        );
      })
      .catch(() => setLeads([]));
  }, [watchedCustomerId, setValue]);

  // Reset form when quote changes
  useEffect(() => {
    if (!visible) return;
    if (quote) {
      reset({
        title: quote.title,
        type: quote.type as any,
        customerId: quote.customerId,
        leadId: quote.leadId ?? undefined,
        description: quote.description ?? undefined,
        currency: quote.currency ?? "USD",
        discountPct: Number(quote.discountPct) ?? 0,
        taxPct: Number(quote.taxPct) ?? 0,
        validUntil: quote.validUntil ? quote.validUntil.slice(0, 10) : undefined,
        paymentTerms: quote.paymentTerms ?? undefined,
        deliveryTerms: quote.deliveryTerms ?? undefined,
        notes: quote.notes ?? undefined,
        assignedTo: quote.assignedTo ?? undefined,
        items: (quote.items ?? []).map((it) => ({
          description: it.description,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          discountPct: Number(it.discountPct),
          taxPct: Number(it.taxPct),
          itemId: it.itemId ?? undefined,
          notes: it.notes ?? undefined,
        })),
      });
    } else {
      reset({
        currency: "USD",
        discountPct: 0,
        taxPct: 0,
        items: [],
      });
    }
  }, [visible, quote, reset]);

  // ── Totals computed live ──────────────────────────────────────────────────
  const itemTotals = (watchedItems ?? []).map((it) =>
    calcItemTotal(
      Number(it.quantity) || 0,
      Number(it.unitPrice) || 0,
      Number(it.discountPct) || 0,
      Number(it.taxPct) || 0
    )
  );
  const subtotal = itemTotals.reduce((a, b) => a + b, 0);
  const globalDiscPct = Number(watch("discountPct")) || 0;
  const globalTaxPct = Number(watch("taxPct")) || 0;
  const discountAmt = subtotal * (globalDiscPct / 100);
  const afterDiscount = subtotal - discountAmt;
  const taxAmt = afterDiscount * (globalTaxPct / 100);
  const total = afterDiscount + taxAmt;

  const onSubmit = async (data: CreateQuoteInput) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        leadId: data.leadId || undefined,
        description: data.description || undefined,
        paymentTerms: data.paymentTerms || undefined,
        deliveryTerms: data.deliveryTerms || undefined,
        notes: data.notes || undefined,
        assignedTo: data.assignedTo || undefined,
        validUntil: data.validUntil || undefined,
      };
      if (isEditing && quote) {
        await quoteService.update(quote.id, payload as any);
        toast?.current?.show({ severity: "success", summary: "Cotización actualizada" });
      } else {
        await quoteService.create(payload as any);
        toast?.current?.show({ severity: "success", summary: "Cotización creada" });
      }
      onSaved();
      onHide();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        outlined
        severity="secondary"
        onClick={onHide}
        disabled={submitting}
        type="button"
      />
      <Button
        label={isEditing ? "Guardar Cambios" : "Crear Cotización"}
        icon="pi pi-check"
        form="quote-form"
        type="submit"
        loading={submitting}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div className="flex align-items-center gap-2">
          <i className="pi pi-file-edit text-primary" />
          <span>{isEditing ? `Editar Cotización · ${quote?.quoteNumber}` : "Nueva Cotización"}</span>
        </div>
      }
      style={{ width: "900px" }}
      breakpoints={{ "960px": "95vw", "640px": "98vw" }}
      footer={footer}
      modal
      draggable={false}
      maximizable
    >
      <form id="quote-form" onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <div className="grid formgrid row-gap-3">

          {/* Título */}
          <div className="col-12 field">
            <label className="font-semibold">
              Título <span className="text-red-500">*</span>
            </label>
            <InputText
              {...register("title")}
              placeholder="Ej: Cotización de repuestos Motor 2.4L"
              className={errors.title ? "p-invalid" : ""}
            />
            {errors.title && <small className="p-error">{errors.title.message}</small>}
          </div>

          {/* Tipo + Moneda */}
          <div className="col-12 md:col-6 field">
            <label className="font-semibold">
              Tipo <span className="text-red-500">*</span>
            </label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={QUOTE_TYPE_OPTIONS}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar tipo"
                  className={errors.type ? "p-invalid" : ""}
                />
              )}
            />
            {errors.type && <small className="p-error">{errors.type.message}</small>}
          </div>

          <div className="col-12 md:col-6 field">
            <label className="font-semibold">Moneda</label>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={currencyOptions}
                  optionLabel="label"
                  optionValue="value"
                />
              )}
            />
          </div>

          {/* Cliente */}
          <div className="col-12 md:col-6 field">
            <label className="font-semibold">
              Cliente <span className="text-red-500">*</span>
            </label>
            <Controller
              name="customerId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value || null}
                  onChange={(e) => field.onChange(e.value)}
                  options={customers}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar cliente"
                  filter
                  showClear
                  className={errors.customerId ? "p-invalid" : ""}
                />
              )}
            />
            {errors.customerId && (
              <small className="p-error">{errors.customerId.message}</small>
            )}
          </div>

          {/* Lead */}
          <div className="col-12 md:col-6 field">
            <label>Lead vinculado</label>
            <Controller
              name="leadId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value || null}
                  onChange={(e) => field.onChange(e.value)}
                  options={leads}
                  optionLabel="label"
                  optionValue="value"
                  placeholder={
                    watchedCustomerId
                      ? leads.length === 0
                        ? "Sin leads para este cliente"
                        : "Seleccionar lead (opcional)"
                      : "Selecciona un cliente primero"
                  }
                  disabled={!watchedCustomerId || leads.length === 0}
                  showClear
                  filter
                />
              )}
            />
          </div>

          {/* Descuento Global + IVA */}
          <div className="col-12 md:col-4 field">
            <label>Descuento Global %</label>
            <Controller
              name="discountPct"
              control={control}
              render={({ field }) => (
                <InputNumber
                  value={field.value ?? 0}
                  onValueChange={(e) => field.onChange(e.value ?? 0)}
                  min={0}
                  max={100}
                  suffix="%"
                  mode="decimal"
                  minFractionDigits={2}
                />
              )}
            />
          </div>

          <div className="col-12 md:col-4 field">
            <label>IVA %</label>
            <Controller
              name="taxPct"
              control={control}
              render={({ field }) => (
                <InputNumber
                  value={field.value ?? 0}
                  onValueChange={(e) => field.onChange(e.value ?? 0)}
                  min={0}
                  max={100}
                  suffix="%"
                  mode="decimal"
                  minFractionDigits={2}
                />
              )}
            />
          </div>

          {/* Válida hasta */}
          <div className="col-12 md:col-4 field">
            <label>Válida hasta</label>
            <InputText
              {...register("validUntil")}
              type="date"
            />
          </div>

          {/* Descripción */}
          <div className="col-12 field">
            <label>Descripción</label>
            <InputTextarea
              {...register("description")}
              rows={2}
              placeholder="Descripción general de la cotización"
            />
          </div>

          {/* Condiciones */}
          <div className="col-12 md:col-6 field">
            <label>Condiciones de Pago</label>
            <InputText
              {...register("paymentTerms")}
              placeholder="Ej: 50% adelanto, 50% contra entrega"
            />
          </div>

          <div className="col-12 md:col-6 field">
            <label>Condiciones de Entrega</label>
            <InputText
              {...register("deliveryTerms")}
              placeholder="Ej: 5 días hábiles"
            />
          </div>

          {/* Notas */}
          <div className="col-12 field">
            <label>Notas internas</label>
            <InputTextarea
              {...register("notes")}
              rows={2}
              placeholder="Notas internas (no visibles al cliente)"
            />
          </div>

          <div className="col-12">
            <Divider />
          </div>

          {/* ── Items ── */}
          <div className="col-12">
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="font-semibold text-900">Líneas de Cotización</span>
              <Button
                type="button"
                label="Agregar línea"
                icon="pi pi-plus"
                size="small"
                outlined
                onClick={() =>
                  append({
                    description: "",
                    quantity: 1,
                    unitPrice: 0,
                    discountPct: 0,
                    taxPct: 0,
                  })
                }
              />
            </div>

            {fields.length === 0 && (
              <div className="text-center text-500 py-3 border-1 border-dashed border-300 border-round">
                Sin líneas. Haz clic en "Agregar línea" para comenzar.
              </div>
            )}

            {fields.map((field, index) => {
              const it = watchedItems?.[index];
              const lineTotal = calcItemTotal(
                Number(it?.quantity) || 0,
                Number(it?.unitPrice) || 0,
                Number(it?.discountPct) || 0,
                Number(it?.taxPct) || 0
              );
              return (
                <div
                  key={field.id}
                  className="grid formgrid align-items-end border-1 border-200 border-round p-2 mb-2"
                >
                  {/* Descripción */}
                  <div className="col-12 md:col-4 field mb-2">
                    <label className="text-xs">Descripción *</label>
                    <InputText
                      {...register(`items.${index}.description`)}
                      placeholder="Descripción del ítem"
                      className={
                        errors.items?.[index]?.description ? "p-invalid" : ""
                      }
                      size={1}
                    />
                    {errors.items?.[index]?.description && (
                      <small className="p-error">
                        {errors.items[index]?.description?.message}
                      </small>
                    )}
                  </div>

                  {/* Cantidad */}
                  <div className="col-6 md:col-1 field mb-2">
                    <label className="text-xs">Cant.</label>
                    <Controller
                      name={`items.${index}.quantity`}
                      control={control}
                      render={({ field: f }) => (
                        <InputNumber
                          value={f.value ?? 1}
                          onValueChange={(e) => f.onChange(e.value ?? 1)}
                          min={0.001}
                          mode="decimal"
                          minFractionDigits={2}
                          className={
                            errors.items?.[index]?.quantity ? "p-invalid" : ""
                          }
                        />
                      )}
                    />
                  </div>

                  {/* Precio unitario */}
                  <div className="col-6 md:col-2 field mb-2">
                    <label className="text-xs">P. Unit.</label>
                    <Controller
                      name={`items.${index}.unitPrice`}
                      control={control}
                      render={({ field: f }) => (
                        <InputNumber
                          value={f.value ?? 0}
                          onValueChange={(e) => f.onChange(e.value ?? 0)}
                          min={0}
                          mode="decimal"
                          minFractionDigits={2}
                        />
                      )}
                    />
                  </div>

                  {/* Descuento % */}
                  <div className="col-6 md:col-1 field mb-2">
                    <label className="text-xs">Desc. %</label>
                    <Controller
                      name={`items.${index}.discountPct`}
                      control={control}
                      render={({ field: f }) => (
                        <InputNumber
                          value={f.value ?? 0}
                          onValueChange={(e) => f.onChange(e.value ?? 0)}
                          min={0}
                          max={100}
                          suffix="%"
                          mode="decimal"
                          minFractionDigits={1}
                        />
                      )}
                    />
                  </div>

                  {/* IVA % */}
                  <div className="col-6 md:col-1 field mb-2">
                    <label className="text-xs">IVA %</label>
                    <Controller
                      name={`items.${index}.taxPct`}
                      control={control}
                      render={({ field: f }) => (
                        <InputNumber
                          value={f.value ?? 0}
                          onValueChange={(e) => f.onChange(e.value ?? 0)}
                          min={0}
                          max={100}
                          suffix="%"
                          mode="decimal"
                          minFractionDigits={1}
                        />
                      )}
                    />
                  </div>

                  {/* Total línea */}
                  <div className="col-8 md:col-2 field mb-2">
                    <label className="text-xs">Total</label>
                    <InputNumber
                      value={lineTotal}
                      readOnly
                      mode="decimal"
                      minFractionDigits={2}
                      inputClassName="font-semibold bg-gray-50"
                    />
                  </div>

                  {/* Eliminar */}
                  <div className="col-4 md:col-1 field mb-2 flex align-items-end">
                    <Button
                      type="button"
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      rounded
                      onClick={() => remove(index)}
                      tooltip="Eliminar línea"
                      tooltipOptions={{ position: "top" }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Totals summary */}
            {fields.length > 0 && (
              <div className="flex flex-column align-items-end gap-1 mt-3 pr-2">
                <div className="flex justify-content-between w-16rem text-sm">
                  <span className="text-600">Subtotal:</span>
                  <span className="font-semibold">{subtotal.toFixed(2)}</span>
                </div>
                {globalDiscPct > 0 && (
                  <div className="flex justify-content-between w-16rem text-sm">
                    <span className="text-600">Descuento ({globalDiscPct}%):</span>
                    <span className="text-red-500">-{discountAmt.toFixed(2)}</span>
                  </div>
                )}
                {globalTaxPct > 0 && (
                  <div className="flex justify-content-between w-16rem text-sm">
                    <span className="text-600">IVA ({globalTaxPct}%):</span>
                    <span>{taxAmt.toFixed(2)}</span>
                  </div>
                )}
                <Divider className="my-1 w-16rem" />
                <div className="flex justify-content-between w-16rem">
                  <span className="font-bold text-900">TOTAL:</span>
                  <span className="font-bold text-primary text-lg">{total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </Dialog>
  );
}
