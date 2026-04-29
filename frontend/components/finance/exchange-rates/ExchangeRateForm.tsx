"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import FormActionButtons from "@/shared/components/FormActionButtons";
import { handleFormError } from "@/utils/errorHandlers";
import exchangeRateService from "@/modules/finance/exchangeRates/services/exchangeRateService";
import type { ExchangeRate } from "@/modules/finance/exchangeRates/interfaces/exchangeRate.interface";
import {
  createExchangeRateSchema,
  type CreateExchangeRateFormValues,
} from "@/modules/finance/exchangeRates/schemas/exchangeRateZod";

const CURRENCY_OPTIONS = [
  { label: "USD — Dólar Americano", value: "USD" },
  { label: "VES — Bolívar Venezolano", value: "VES" },
  { label: "EUR — Euro", value: "EUR" },
];

interface Props {
  exchangeRate?: ExchangeRate | null;
  formId: string;
  onSave: () => void;
  onSubmittingChange: (v: boolean) => void;
  toast: React.RefObject<Toast>;
}

export default function ExchangeRateForm({
  exchangeRate,
  formId,
  onSave,
  onSubmittingChange,
  toast,
}: Props) {
  const isEditing = !!exchangeRate;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateExchangeRateFormValues>({
    resolver: zodResolver(createExchangeRateSchema),
    mode: "onBlur",
    defaultValues: {
      fromCurrency: exchangeRate?.fromCurrency ?? "USD",
      toCurrency: exchangeRate?.toCurrency ?? "VES",
      rate: exchangeRate ? Number(exchangeRate.rate) : undefined,
      rateDate: exchangeRate
        ? exchangeRate.rateDate.split("T")[0]
        : new Date().toISOString().split("T")[0],
      notes: exchangeRate?.notes ?? "",
    },
  });

  const onSubmit = async (values: CreateExchangeRateFormValues) => {
    try {
      onSubmittingChange(true);
      if (isEditing && exchangeRate) {
        await exchangeRateService.update(exchangeRate.id, {
          rate: values.rate,
          rateDate: values.rateDate,
          notes: values.notes,
        });
      } else {
        await exchangeRateService.create({
          fromCurrency: values.fromCurrency,
          toCurrency: values.toCurrency,
          rate: values.rate,
          rateDate: values.rateDate,
          source: "MANUAL",
          notes: values.notes,
        });
      }
      onSave();
    } catch (err) {
      handleFormError(err, toast);
    } finally {
      onSubmittingChange(false);
    }
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-column gap-3"
    >
      <div className="grid">
        {/* fromCurrency */}
        <div className="col-6">
          <label className="block text-sm font-medium mb-1">
            Moneda origen <span className="text-red-500">*</span>
          </label>
          <Controller
            name="fromCurrency"
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                options={CURRENCY_OPTIONS}
                placeholder="Seleccionar..."
                disabled={isEditing}
                className={`w-full${errors.fromCurrency ? " p-invalid" : ""}`}
              />
            )}
          />
          {errors.fromCurrency && (
            <small className="p-error">{errors.fromCurrency.message}</small>
          )}
        </div>

        {/* toCurrency */}
        <div className="col-6">
          <label className="block text-sm font-medium mb-1">
            Moneda destino <span className="text-red-500">*</span>
          </label>
          <Controller
            name="toCurrency"
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                options={CURRENCY_OPTIONS}
                placeholder="Seleccionar..."
                disabled={isEditing}
                className={`w-full${errors.toCurrency ? " p-invalid" : ""}`}
              />
            )}
          />
          {errors.toCurrency && (
            <small className="p-error">{errors.toCurrency.message}</small>
          )}
        </div>

        {/* rate */}
        <div className="col-6">
          <label className="block text-sm font-medium mb-1">
            Tasa de cambio <span className="text-red-500">*</span>
          </label>
          <Controller
            name="rate"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={4}
                useGrouping
                placeholder="0.0000"
                className={`w-full${errors.rate ? " p-invalid" : ""}`}
              />
            )}
          />
          {errors.rate && (
            <small className="p-error">{errors.rate.message}</small>
          )}
        </div>

        {/* rateDate */}
        <div className="col-6">
          <label className="block text-sm font-medium mb-1">
            Fecha de la tasa <span className="text-red-500">*</span>
          </label>
          <Controller
            name="rateDate"
            control={control}
            render={({ field }) => (
              <Calendar
                value={field.value ? new Date(field.value + "T12:00:00") : null}
                onChange={(e) => {
                  if (e.value instanceof Date) {
                    const iso = e.value.toISOString().split("T")[0];
                    field.onChange(iso);
                  }
                }}
                dateFormat="dd/mm/yy"
                showIcon
                maxDate={new Date()}
                className={`w-full${errors.rateDate ? " p-invalid" : ""}`}
              />
            )}
          />
          {errors.rateDate && (
            <small className="p-error">{errors.rateDate.message}</small>
          )}
        </div>

        {/* notes */}
        <div className="col-12">
          <label className="block text-sm font-medium mb-1">Notas</label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                {...field}
                rows={3}
                autoResize
                maxLength={500}
                placeholder="Observaciones opcionales..."
                className="w-full"
              />
            )}
          />
        </div>
      </div>
    </form>
  );
}
