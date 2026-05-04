"use client";

import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import CustomerSelector from "@/components/common/CustomerSelector";
import { useCustomerDetailData } from "@/modules/crm/customer/hooks/useCustomerCrmData";
import dealerReservationService, {
  SaveDealerReservationRequest,
} from "../services/dealerReservationService";
import { handleFormError } from "@/utils/errorHandlers";
import { useBcvRate } from "@/hooks/useBcvRate";
import type {
  DealerReservationFormValues,
  DealerReservationFormProps,
} from "../interfaces/dealerReservationForm.interface";
import {
  RESERVATION_STATUS_OPTIONS,
  RESERVATION_CURRENCY_OPTIONS,
  RESERVATION_FX_SOURCE_OPTIONS,
  RESERVATION_CURRENCY_SYMBOLS,
  formatFormReservationCrossRef,
} from "../utils/dealerReservation.utils";

export default function DealerReservationForm({
  reservation,
  unitOptions,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: DealerReservationFormProps) {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DealerReservationFormValues>({
    mode: "onBlur",
    defaultValues: {
      dealerUnitId: reservation?.dealerUnitId || "",
      customerId: reservation?.customerId || "",
      customerName: reservation?.customerName || "",
      customerDocument: reservation?.customerDocument || "",
      customerPhone: reservation?.customerPhone || "",
      customerEmail: reservation?.customerEmail || "",
      offeredPrice:
        reservation?.offeredPrice != null
          ? Number(reservation.offeredPrice)
          : undefined,
      depositAmount:
        reservation?.depositAmount != null
          ? Number(reservation.depositAmount)
          : undefined,
      currency: reservation?.currency || "USD",
      exchangeRate:
        reservation?.exchangeRate != null
          ? Number(reservation.exchangeRate)
          : undefined,
      exchangeRateSource: reservation?.exchangeRateSource || "BCV_AUTO",
      expiresAt: reservation?.expiresAt
        ? new Date(reservation.expiresAt)
        : null,
      notes: reservation?.notes || "",
      sourceChannel: reservation?.sourceChannel || "",
      status: reservation?.status || "PENDING",
      isActive: reservation?.isActive ?? true,
    },
  });
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<
    string | null
  >(null);
  const { customer: selectedCustomer } =
    useCustomerDetailData(selectedCustomerId);

  const watchCurrency = watch("currency") as "USD" | "VES" | "EUR";
  const watchFxSource = watch("exchangeRateSource");
  const watchExchangeRate = watch("exchangeRate");
  const watchOfferedPrice = watch("offeredPrice");
  const watchDepositAmount = watch("depositAmount");

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

  React.useEffect(() => {
    if (!selectedCustomer) return;
    setValue("customerName", selectedCustomer.name || "");
    setValue("customerDocument", selectedCustomer.taxId || "");
    setValue(
      "customerPhone",
      selectedCustomer.phone || selectedCustomer.mobile || "",
    );
    setValue("customerEmail", selectedCustomer.email || "");
  }, [selectedCustomer, setValue]);

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

  // When currency changes, reset rate source to BCV_AUTO and clear pending rate
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

  const currencyPrefix = RESERVATION_CURRENCY_SYMBOLS[watchCurrency] + " ";

  const offeredCrossRef = watchOfferedPrice
    ? formatFormReservationCrossRef(
        watchOfferedPrice,
        watchCurrency,
        watchExchangeRate,
      )
    : null;
  const depositCrossRef = watchDepositAmount
    ? formatFormReservationCrossRef(
        watchDepositAmount,
        watchCurrency,
        watchExchangeRate,
      )
    : null;

  const onSubmit = async (data: DealerReservationFormValues) => {
    onSubmittingChange?.(true);
    try {
      const payload: SaveDealerReservationRequest = {
        dealerUnitId: data.dealerUnitId,
        customerId: data.customerId,
        customerName: data.customerName.trim(),
        customerDocument: data.customerDocument || null,
        customerPhone: data.customerPhone || null,
        customerEmail: data.customerEmail || null,
        offeredPrice: data.offeredPrice ?? null,
        depositAmount: data.depositAmount ?? null,
        currency: data.currency || "USD",
        exchangeRate: data.exchangeRate ?? null,
        exchangeRateSource: data.exchangeRateSource || "BCV_AUTO",
        expiresAt: data.expiresAt ? data.expiresAt.toISOString() : null,
        notes: data.notes || null,
        sourceChannel: data.sourceChannel || null,
        status: data.status,
        isActive: data.isActive,
      };

      if (reservation?.id) {
        await dealerReservationService.update(reservation.id, payload);
      } else {
        await dealerReservationService.create(payload);
      }

      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      onSubmittingChange?.(false);
    }
  };

  const handleCustomerChange = (
    customerId: string | null,
    onChange: (value: string) => void,
  ) => {
    const id = customerId ?? "";
    onChange(id);
    setSelectedCustomerId(id || null);
    if (!id) {
      setValue("customerName", "");
      setValue("customerDocument", "");
      setValue("customerPhone", "");
      setValue("customerEmail", "");
    }
  };

  return (
    <form
      id={formId || "dealer-reservation-form"}
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

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Estatus</label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={RESERVATION_STATUS_OPTIONS}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Cliente CRM *</label>
          <Controller
            name="customerId"
            control={control}
            rules={{ required: "Debe seleccionar un cliente" }}
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

        <div className="col-12 md:col-3 field">
          <label className="font-semibold">Documento</label>
          <Controller
            name="customerDocument"
            control={control}
            render={({ field }) => (
              <InputText {...field} value={field.value || ""} />
            )}
          />
        </div>

        <div className="col-12 md:col-3 field">
          <label className="font-semibold">Teléfono</label>
          <Controller
            name="customerPhone"
            control={control}
            render={({ field }) => (
              <InputText {...field} value={field.value || ""} />
            )}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Email</label>
          <Controller
            name="customerEmail"
            control={control}
            render={({ field }) => (
              <InputText {...field} value={field.value || ""} />
            )}
          />
        </div>

        <div className="col-12 md:col-3 field">
          <label className="font-semibold">Canal</label>
          <Controller
            name="sourceChannel"
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
                options={RESERVATION_CURRENCY_OPTIONS}
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
                options={RESERVATION_FX_SOURCE_OPTIONS}
                disabled={watchCurrency === "USD"}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-3 field">
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
          {offeredCrossRef && (
            <small className="text-500">{offeredCrossRef}</small>
          )}
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Depósito</label>
          <Controller
            name="depositAmount"
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
          {depositCrossRef && (
            <small className="text-500">{depositCrossRef}</small>
          )}
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Vigencia</label>
          <Controller
            name="expiresAt"
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

        <div className="col-12 field mb-0">
          <label className="font-semibold">Notas</label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputText {...field} value={field.value || ""} />
            )}
          />
        </div>
      </div>
    </form>
  );
}
