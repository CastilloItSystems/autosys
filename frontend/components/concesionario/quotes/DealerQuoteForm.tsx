"use client";

import React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import CustomerSelector from "@/components/common/CustomerSelector";
import customerCrmService from "@/app/api/crm/customerCrmService";
import { useBcvRate } from "@/hooks/useBcvRate";
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

const CURRENCY_OPTIONS = [
  { label: "USD ($)", value: "USD" },
  { label: "VES (Bs.)", value: "VES" },
  { label: "EUR (€)", value: "EUR" },
];

const FX_SOURCE_OPTIONS = [
  { label: "BCV automático", value: "BCV_AUTO" },
  { label: "Manual", value: "MANUAL" },
];

const CURRENCY_SYMBOLS: Record<string, string> = { USD: "$", EUR: "€", VES: "Bs." };

const formatCrossRef = (total: number, currency: string, exchangeRate?: number | null) => {
  const rate = Number(exchangeRate);
  if (!rate || rate <= 0) return null;
  if (currency === "VES")
    return `≈ $ ${(total / rate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
  return `≈ Bs. ${(total * rate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

type DealerQuoteFormValues = {
  dealerUnitId: string;
  customerId: string;
  customerName: string;
  customerDocument: string;
  customerPhone: string;
  customerEmail: string;
  listPrice?: number;
  discountPct?: number;
  offeredPrice?: number;
  taxPct?: number;
  currency: "USD" | "VES" | "EUR";
  exchangeRate?: number;
  exchangeRateSource: "BCV_AUTO" | "MANUAL";
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<DealerQuoteFormValues>({
    mode: "onBlur",
    defaultValues: {
      dealerUnitId: quote?.dealerUnitId || "",
      customerId: quote?.customerId || "",
      customerName: quote?.customerName || "",
      customerDocument: quote?.customerDocument || "",
      customerPhone: quote?.customerPhone || "",
      customerEmail: quote?.customerEmail || "",
      listPrice: quote?.listPrice != null ? Number(quote.listPrice) : undefined,
      discountPct: quote?.discountPct != null ? Number(quote.discountPct) : undefined,
      offeredPrice: quote?.offeredPrice != null ? Number(quote.offeredPrice) : undefined,
      taxPct: quote?.taxPct != null ? Number(quote.taxPct) : 16,
      currency: quote?.currency || "USD",
      exchangeRate: quote?.exchangeRate != null ? Number(quote.exchangeRate) : undefined,
      exchangeRateSource: quote?.exchangeRateSource || "BCV_AUTO",
      validUntil: quote?.validUntil ? new Date(quote.validUntil) : null,
      paymentTerms: quote?.paymentTerms || "",
      financingRequired: quote?.financingRequired ?? false,
      notes: quote?.notes || "",
      status: quote?.status || "DRAFT",
      isActive: quote?.isActive ?? true,
    },
  });

  const watchCurrency = useWatch({ control, name: "currency" }) || "USD";
  const watchFxSource = useWatch({ control, name: "exchangeRateSource" });
  const watchStatus = useWatch({ control, name: "status" });
  const watchExchangeRate = useWatch({ control, name: "exchangeRate" });
  const watchOfferedPrice = useWatch({ control, name: "offeredPrice" });

  // Always fetch USD/VES — needed for VES conversion and as cross-ref base
  const { rate: usdVesRate } = useBcvRate("USD");
  // EUR/VES rate when needed
  const { rate: eurVesRate } = useBcvRate(
    watchCurrency === "EUR" ? "EUR" : "USD",
  );

  const effectiveRate =
    watchCurrency === "USD" ? usdVesRate
    : watchCurrency === "EUR" ? eurVesRate
    : usdVesRate; // VES → store USD/VES for cross-reference

  const prevCurrencyRef = React.useRef<string>(watchCurrency);
  const pendingRateRef = React.useRef(false);

  // Auto-fill exchange rate when BCV loads or source/currency changes
  React.useEffect(() => {
    if (watchFxSource !== "BCV_AUTO") return;
    if (effectiveRate && effectiveRate > 0) {
      setValue("exchangeRate", effectiveRate);
      if (pendingRateRef.current) {
        pendingRateRef.current = false;
      }
    }
  }, [effectiveRate, watchFxSource]);

  React.useEffect(() => {
    const prev = prevCurrencyRef.current;
    if (prev === watchCurrency) return;
    prevCurrencyRef.current = watchCurrency;

    if (!effectiveRate || effectiveRate <= 0) {
      pendingRateRef.current = true;
    }
  }, [watchCurrency]);

  const currencyPrefix = CURRENCY_SYMBOLS[watchCurrency] + " ";

  const onSubmit = async (data: DealerQuoteFormValues) => {
    onSubmittingChange?.(true);
    try {
      const payload: SaveDealerQuoteRequest = {
        dealerUnitId: data.dealerUnitId,
        customerId: data.customerId,
        customerName: data.customerName.trim(),
        customerDocument: data.customerDocument || null,
        customerPhone: data.customerPhone || null,
        customerEmail: data.customerEmail || null,
        listPrice: data.listPrice ?? null,
        discountPct: data.discountPct ?? null,
        offeredPrice: data.offeredPrice ?? null,
        taxPct: data.taxPct ?? null,
        currency: data.currency || "USD",
        exchangeRate: data.exchangeRate ?? null,
        exchangeRateSource: data.exchangeRateSource || "BCV_AUTO",
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

  const handleConvertAndFiscalize = async () => {
    if (!quote?.id) return;
    onSubmittingChange?.(true);
    try {
      await dealerQuoteService.convertAndFiscalize(quote.id);
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      onSubmittingChange?.(false);
    }
  };

  const handleCustomerChange = async (
    customerId: string | null,
    onChange: (value: string) => void,
  ) => {
    const id = customerId ?? "";
    onChange(id);
    if (!id) {
      setValue("customerName", "");
      setValue("customerDocument", "");
      setValue("customerPhone", "");
      setValue("customerEmail", "");
      return;
    }
    try {
      const res = await customerCrmService.getById(id);
      const customer = res?.data;
      if (!customer) return;
      setValue("customerName", customer.name || "");
      setValue("customerDocument", customer.taxId || "");
      setValue("customerPhone", customer.phone || customer.mobile || "");
      setValue("customerEmail", customer.email || "");
    } catch {
      // noop
    }
  };

  const crossRef = watchOfferedPrice
    ? formatCrossRef(watchOfferedPrice, watchCurrency, watchExchangeRate)
    : null;

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
          <label className="font-semibold">Cliente CRM *</label>
          <Controller
            name="customerId"
            control={control}
            rules={{ required: "Debe seleccionar un cliente" }}
            render={({ field }) => (
              <CustomerSelector
                value={field.value}
                onChange={(value) => handleCustomerChange(value, field.onChange)}
                invalid={!!errors.customerId}
              />
            )}
          />
          {errors.customerId && (
            <small className="p-error">{errors.customerId.message}</small>
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

        {/* ── Moneda y tasa ── */}
        <div className="col-12 md:col-2 field">
          <label className="font-semibold">Moneda</label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={CURRENCY_OPTIONS}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-2 field">
          <label className="font-semibold">Fuente Tasa</label>
          <Controller
            name="exchangeRateSource"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={FX_SOURCE_OPTIONS}
                disabled={watchCurrency === "USD"}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-2 field">
          <label className="font-semibold">Tasa Cambiaria</label>
          <Controller
            name="exchangeRate"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                mode="decimal"
                min={0}
                minFractionDigits={2}
                maxFractionDigits={7}
                disabled={watchCurrency === "USD" || watchFxSource === "BCV_AUTO"}
              />
            )}
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

        {/* ── Precios ── */}
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
                prefix={currencyPrefix}
                min={0}
                minFractionDigits={2}
                maxFractionDigits={2}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-2 field">
          <label className="font-semibold">Desc. %</label>
          <Controller
            name="discountPct"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                mode="decimal"
                suffix="%"
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
                prefix={currencyPrefix}
                min={0}
                minFractionDigits={2}
                maxFractionDigits={2}
              />
            )}
          />
          {crossRef && (
            <small className="text-500">{crossRef}</small>
          )}
        </div>

        <div className="col-12 md:col-2 field">
          <label className="font-semibold">Impuesto %</label>
          <Controller
            name="taxPct"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                mode="decimal"
                suffix="%"
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

        {quote?.id && (
          <div className="col-12 field mb-0">
            <Button
              type="button"
              label="Convertir y Fiscalizar"
              icon="pi pi-check-circle"
              className="p-button-success"
              disabled={watchStatus !== "APPROVED"}
              onClick={handleConvertAndFiscalize}
            />
          </div>
        )}
      </div>
    </form>
  );
}
