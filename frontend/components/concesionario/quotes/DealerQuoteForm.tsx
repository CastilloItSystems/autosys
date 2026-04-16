"use client";

import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import dealerQuoteService, {
  SaveDealerQuoteRequest,
} from "@/app/api/dealer/dealerQuoteService";
import type { DealerQuote } from "@/libs/interfaces/dealer/dealerQuote.interface";
import { handleFormError } from "@/utils/errorHandlers";

const STATUS_OPTIONS = [
  { label: "Borrador", value: "DRAFT" },
  { label: "Enviada", value: "SENT" },
  { label: "Negociación", value: "NEGOTIATING" },
  { label: "Aprobada", value: "APPROVED" },
  { label: "Rechazada", value: "REJECTED" },
  { label: "Expirada", value: "EXPIRED" },
  { label: "Convertida", value: "CONVERTED" },
];

const YES_NO_OPTIONS = [
  { label: "Sí", value: true },
  { label: "No", value: false },
];

type DealerQuoteFormValues = {
  dealerUnitId: string;
  customerName: string;
  customerDocument: string;
  customerPhone: string;
  customerEmail: string;
  listPrice?: number;
  discountPct?: number;
  offeredPrice?: number;
  taxPct?: number;
  currency: string;
  validUntil?: Date | null;
  paymentTerms: string;
  financingRequired: boolean;
  notes: string;
  status: string;
  isActive: boolean;
};

interface DealerQuoteFormProps {
  quote: DealerQuote | null;
  unitOptions: Array<{ label: string; value: string }>;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}

export default function DealerQuoteForm({
  quote,
  unitOptions,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: DealerQuoteFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DealerQuoteFormValues>({
    mode: "onBlur",
    defaultValues: {
      dealerUnitId: quote?.dealerUnitId || "",
      customerName: quote?.customerName || "",
      customerDocument: quote?.customerDocument || "",
      customerPhone: quote?.customerPhone || "",
      customerEmail: quote?.customerEmail || "",
      listPrice: quote?.listPrice != null ? Number(quote.listPrice) : undefined,
      discountPct:
        quote?.discountPct != null ? Number(quote.discountPct) : undefined,
      offeredPrice:
        quote?.offeredPrice != null ? Number(quote.offeredPrice) : undefined,
      taxPct: quote?.taxPct != null ? Number(quote.taxPct) : 16,
      currency: quote?.currency || "USD",
      validUntil: quote?.validUntil ? new Date(quote.validUntil) : null,
      paymentTerms: quote?.paymentTerms || "",
      financingRequired: quote?.financingRequired ?? false,
      notes: quote?.notes || "",
      status: quote?.status || "DRAFT",
      isActive: quote?.isActive ?? true,
    },
  });

  const onSubmit = async (data: DealerQuoteFormValues) => {
    onSubmittingChange?.(true);
    try {
      const payload: SaveDealerQuoteRequest = {
        dealerUnitId: data.dealerUnitId,
        customerName: data.customerName.trim(),
        customerDocument: data.customerDocument || null,
        customerPhone: data.customerPhone || null,
        customerEmail: data.customerEmail || null,
        listPrice: data.listPrice ?? null,
        discountPct: data.discountPct ?? null,
        offeredPrice: data.offeredPrice ?? null,
        taxPct: data.taxPct ?? null,
        currency: data.currency || "USD",
        validUntil: data.validUntil ? data.validUntil.toISOString() : null,
        paymentTerms: data.paymentTerms || null,
        financingRequired: data.financingRequired,
        notes: data.notes || null,
        status: data.status,
        isActive: data.isActive,
      };

      if (quote?.id) {
        await dealerQuoteService.update(quote.id, payload);
      } else {
        await dealerQuoteService.create(payload);
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
      id={formId || "dealer-quote-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid formgrid">
        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Unidad *</label>
          <Controller
            name="dealerUnitId"
            control={control}
            rules={{ required: "Debe seleccionar una unidad" }}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={unitOptions}
                className={errors.dealerUnitId ? "p-invalid" : ""}
                filter
                placeholder="Seleccione una unidad"
              />
            )}
          />
          {errors.dealerUnitId && (
            <small className="p-error">{errors.dealerUnitId.message}</small>
          )}
        </div>

        <div className="col-12 md:col-3 field">
          <label className="font-semibold">Estatus</label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={STATUS_OPTIONS}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-3 field">
          <label className="font-semibold">Financiamiento</label>
          <Controller
            name="financingRequired"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(Boolean(e.value))}
                options={YES_NO_OPTIONS}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Cliente *</label>
          <Controller
            name="customerName"
            control={control}
            rules={{ required: "El nombre del cliente es requerido" }}
            render={({ field }) => (
              <InputText
                {...field}
                className={errors.customerName ? "p-invalid" : ""}
                autoFocus
              />
            )}
          />
          {errors.customerName && (
            <small className="p-error">{errors.customerName.message}</small>
          )}
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Documento</label>
          <Controller
            name="customerDocument"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Teléfono</label>
          <Controller
            name="customerPhone"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Email</label>
          <Controller
            name="customerEmail"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>

        <div className="col-12 md:col-2 field">
          <label className="font-semibold">Moneda</label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>

        <div className="col-12 md:col-3 field">
          <label className="font-semibold">Vigente hasta</label>
          <Controller
            name="validUntil"
            control={control}
            render={({ field }) => (
              <Calendar
                value={field.value ?? null}
                onChange={(e) => field.onChange((e.value as Date) || null)}
                showIcon
                dateFormat="dd/mm/yy"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-3 field">
          <label className="font-semibold">Precio Lista</label>
          <Controller
            name="listPrice"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                mode="decimal"
                min={0}
                minFractionDigits={2}
                maxFractionDigits={2}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-3 field">
          <label className="font-semibold">Desc. %</label>
          <Controller
            name="discountPct"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                mode="decimal"
                min={0}
                max={100}
                minFractionDigits={2}
                maxFractionDigits={2}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-3 field">
          <label className="font-semibold">Precio Ofertado</label>
          <Controller
            name="offeredPrice"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                mode="decimal"
                min={0}
                minFractionDigits={2}
                maxFractionDigits={2}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-3 field">
          <label className="font-semibold">Impuesto %</label>
          <Controller
            name="taxPct"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                mode="decimal"
                min={0}
                max={100}
                minFractionDigits={2}
                maxFractionDigits={2}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Términos de pago</label>
          <Controller
            name="paymentTerms"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>

        <div className="col-12 field mb-0">
          <label className="font-semibold">Notas</label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>
      </div>
    </form>
  );
}
