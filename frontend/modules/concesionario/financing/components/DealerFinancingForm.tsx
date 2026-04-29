"use client";

import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import CustomerSelector from "@/components/common/CustomerSelector";
import customerCrmService from "@/app/api/crm/customerCrmService";
import dealerFinancingService from "../services/dealerFinancingService";
import { handleFormError } from "@/utils/errorHandlers";
import { useBcvRate } from "@/hooks/useBcvRate";
import type {
  DealerFinancingFormValues,
  DealerFinancingFormProps,
} from "../interfaces/dealerFinancingForm.interface";
import {
  FINANCING_STATUS_OPTIONS,
  FINANCING_CURRENCY_OPTIONS,
  FINANCING_FX_SOURCE_OPTIONS,
  FINANCING_CURRENCY_SYMBOLS,
  formatFormCrossRef,
} from "../utils/dealerFinancing.utils";

export default function DealerFinancingForm({
  financing,
  unitOptions,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: DealerFinancingFormProps) {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DealerFinancingFormValues>({
    mode: "onBlur",
    defaultValues: {
      dealerUnitId: financing?.dealerUnit?.id || "",
      customerId: financing?.customerId || "",
      customerName: financing?.customerName || "",
      bankName: "",
      currency: financing?.currency || "USD",
      exchangeRate:
        financing?.exchangeRate != null
          ? Number(financing.exchangeRate)
          : undefined,
      exchangeRateSource: financing?.exchangeRateSource || "BCV_AUTO",
      requestedAmount:
        financing?.requestedAmount != null
          ? Number(financing.requestedAmount)
          : undefined,
      approvedAmount:
        financing?.approvedAmount != null
          ? Number(financing.approvedAmount)
          : undefined,
      termMonths: financing?.termMonths ?? undefined,
      status: financing?.status || "DRAFT",
    },
  });

  const watchCurrency = watch("currency") as "USD" | "VES" | "EUR";
  const watchFxSource = watch("exchangeRateSource");
  const watchExchangeRate = watch("exchangeRate");
  const watchRequestedAmount = watch("requestedAmount");
  const watchApprovedAmount = watch("approvedAmount");

  // Always fetch USD/VES — needed for VES conversion cross-ref
  const { rate: usdVesRate } = useBcvRate("USD");
  // EUR/VES when needed
  const { rate: eurVesRate } = useBcvRate(
    watchCurrency === "EUR" ? "EUR" : "USD",
  );

  const effectiveRate =
    watchCurrency === "USD"
      ? usdVesRate
      : watchCurrency === "EUR"
      ? eurVesRate
      : usdVesRate; // VES doc → store USD/VES for cross-ref

  const prevCurrencyRef = React.useRef<string>(watchCurrency);
  const pendingRateRef = React.useRef(false);

  // Auto-fill exchange rate when BCV rate loads
  React.useEffect(() => {
    if (watchFxSource !== "BCV_AUTO") return;
    if (effectiveRate && effectiveRate > 0) {
      setValue("exchangeRate", effectiveRate);
      pendingRateRef.current = false;
    } else {
      pendingRateRef.current = true;
    }
  }, [effectiveRate, watchFxSource, setValue]);

  // When currency changes, reset source to BCV_AUTO
  React.useEffect(() => {
    if (prevCurrencyRef.current === watchCurrency) return;
    prevCurrencyRef.current = watchCurrency;
    if (watchCurrency === "USD") {
      setValue("exchangeRateSource", "BCV_AUTO");
      setValue("exchangeRate", undefined);
    } else {
      setValue("exchangeRateSource", "BCV_AUTO");
      pendingRateRef.current = true;
    }
  }, [watchCurrency, setValue]);

  const currencyPrefix = FINANCING_CURRENCY_SYMBOLS[watchCurrency] + " ";

  const requestedCrossRef = watchRequestedAmount
    ? formatFormCrossRef(watchRequestedAmount, watchCurrency, watchExchangeRate)
    : null;
  const approvedCrossRef = watchApprovedAmount
    ? formatFormCrossRef(watchApprovedAmount, watchCurrency, watchExchangeRate)
    : null;

  const onSubmit = async (data: DealerFinancingFormValues) => {
    onSubmittingChange?.(true);
    try {
      const payload = {
        dealerUnitId: data.dealerUnitId,
        customerId: data.customerId,
        customerName: data.customerName.trim(),
        bankName: data.bankName || null,
        currency: data.currency || "USD",
        exchangeRate: data.exchangeRate ?? null,
        exchangeRateSource: data.exchangeRateSource || "BCV_AUTO",
        requestedAmount: data.requestedAmount ?? null,
        approvedAmount: data.approvedAmount ?? null,
        termMonths: data.termMonths ?? null,
        status: data.status,
      };

      if (financing?.id) {
        await dealerFinancingService.update(financing.id, payload);
      } else {
        await dealerFinancingService.create(payload);
      }
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
      return;
    }
    try {
      const res = await customerCrmService.getById(id);
      const customer = res?.data;
      if (customer) {
        setValue("customerName", customer.name || "");
      }
    } catch {
      // noop
    }
  };

  return (
    <form
      id={formId || "dealer-financing-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid formgrid">
        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Unidad *</label>
          <Controller
            name="dealerUnitId"
            control={control}
            rules={{ required: "Unidad requerida" }}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={unitOptions}
                className={errors.dealerUnitId ? "p-invalid" : ""}
                filter
              />
            )}
          />
          {errors.dealerUnitId && (
            <small className="p-error">{errors.dealerUnitId.message}</small>
          )}
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Estatus</label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={FINANCING_STATUS_OPTIONS}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Cliente CRM *</label>
          <Controller
            name="customerId"
            control={control}
            rules={{ required: "Cliente requerido" }}
            render={({ field }) => (
              <CustomerSelector
                value={field.value}
                onChange={(value) =>
                  handleCustomerChange(value, field.onChange)
                }
                invalid={!!errors.customerId}
              />
            )}
          />
          {errors.customerId && (
            <small className="p-error">{errors.customerId.message}</small>
          )}
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Banco</label>
          <Controller
            name="bankName"
            control={control}
            render={({ field }) => (
              <InputText {...field} value={field.value || ""} />
            )}
          />
        </div>

        <div className="col-12 md:col-3 field">
          <label className="font-semibold">Moneda</label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={FINANCING_CURRENCY_OPTIONS}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-3 field">
          <label className="font-semibold">Fuente Tasa</label>
          <Controller
            name="exchangeRateSource"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={FINANCING_FX_SOURCE_OPTIONS}
                disabled={watchCurrency === "USD"}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Tasa de Cambio</label>
          <Controller
            name="exchangeRate"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={4}
                min={0}
                disabled={
                  watchCurrency === "USD" || watchFxSource === "BCV_AUTO"
                }
                placeholder={
                  watchCurrency === "USD"
                    ? "N/A"
                    : effectiveRate
                    ? effectiveRate.toFixed(4)
                    : "Cargando..."
                }
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Monto solicitado</label>
          <Controller
            name="requestedAmount"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                mode="decimal"
                prefix={currencyPrefix}
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
              />
            )}
          />
          {requestedCrossRef && (
            <small className="text-500">{requestedCrossRef}</small>
          )}
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Monto aprobado</label>
          <Controller
            name="approvedAmount"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                mode="decimal"
                prefix={currencyPrefix}
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
              />
            )}
          />
          {approvedCrossRef && (
            <small className="text-500">{approvedCrossRef}</small>
          )}
        </div>

        <div className="col-12 md:col-4 field mb-0">
          <label className="font-semibold">Plazo (meses)</label>
          <Controller
            name="termMonths"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                useGrouping={false}
              />
            )}
          />
        </div>
      </div>
    </form>
  );
}
