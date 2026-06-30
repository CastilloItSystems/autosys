"use client";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import type {
  Expense,
  CreateExpenseData,
  ExpenseCategory,
} from "../interfaces/expense";
import { EXPENSE_CATEGORY_LABELS } from "../interfaces/expense";
import expenseService from "../services/expenseService";
import { handleFormError } from "@/utils/errorHandlers";
import { CURRENCY_SYMBOLS } from "@/utils/currencyFormat";
import { useBcvRate } from "@/hooks/useBcvRate";

const CATEGORY_OPTIONS = Object.entries(EXPENSE_CATEGORY_LABELS).map(
  ([value, label]) => ({
    label,
    value: value as ExpenseCategory,
  }),
);

const CURRENCY_OPTIONS = [
  { label: "USD - Dólar", value: "USD" },
  { label: "VES - Bolívar", value: "VES" },
  { label: "EUR - Euro", value: "EUR" },
];

interface Props {
  expense?: Expense | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<Toast>;
}

export default function ExpenseForm({
  expense,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: Props) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateExpenseData>({
    mode: "onBlur",
    defaultValues: {
      category: expense?.category ?? "UTILITIES",
      description: expense?.description ?? "",
      currency: expense?.currency ?? "USD",
      exchangeRate: expense?.exchangeRate ?? undefined,
      amount: expense ? Number(expense.amount) : 0,
      taxAmount: expense ? Number(expense.taxAmount) : 0,
      expenseDate: expense?.expenseDate
        ? expense.expenseDate.split("T")[0]
        : new Date().toISOString().split("T")[0],
      notes: expense?.notes ?? "",
    },
  });

  const currency = (watch("currency") || "USD") as "USD" | "EUR" | "VES";
  const watchExchangeRate = watch("exchangeRate");

  const { rate: bcvRate, loading: bcvLoading } = useBcvRate(currency);
  const { rate: referenceUsdRate } = useBcvRate("USD");
  const { rate: referenceEurRate } = useBcvRate("EUR");

  const autoRate =
    currency === "VES"
      ? referenceUsdRate && referenceUsdRate > 1
        ? referenceUsdRate
        : bcvRate
      : currency === "EUR"
      ? referenceEurRate && referenceEurRate > 0
        ? referenceEurRate
        : bcvRate
      : bcvRate;

  useEffect(() => {
    if (currency === "USD") return;
    if (autoRate && autoRate > 0 && !watchExchangeRate) {
      setValue("exchangeRate", autoRate, { shouldDirty: true });
    }
  }, [autoRate, currency]); // eslint-disable-line react-hooks/exhaustive-deps

  const rateLabel =
    currency === "VES"
      ? "Tasa ref. Bs./USD"
      : currency === "EUR"
      ? "Tasa Bs./EUR"
      : "Tasa Bs./USD";

  const onSubmit = async (data: CreateExpenseData) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      const payload = {
        ...data,
        total: Number(data.amount) + Number(data.taxAmount ?? 0),
      };
      if (expense) {
        await expenseService.update(expense.id, payload);
      } else {
        await expenseService.create(payload);
      }
      await onSave();
    } catch (err) {
      handleFormError(err, toast);
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  return (
    <form
      id={formId || "expense-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-column gap-3 pt-2"
    >
      <div className="field">
        <label className="block mb-1 font-medium">Categoría *</label>
        <Controller
          name="category"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Dropdown
              {...field}
              options={CATEGORY_OPTIONS}
              className="w-full"
            />
          )}
        />
      </div>

      <div className="field">
        <label className="block mb-1 font-medium">Descripción *</label>
        <Controller
          name="description"
          control={control}
          rules={{ required: "La descripción es obligatoria" }}
          render={({ field }) => (
            <InputText
              {...field}
              className="w-full"
              placeholder="Internet Inter abril 2026"
            />
          )}
        />
        {errors.description && (
          <small className="p-error">{errors.description.message}</small>
        )}
      </div>

      {/* Fecha + Moneda + Tasa */}
      <div className="grid">
        <div className={`${currency !== "USD" ? "col-4" : "col-6"} field`}>
          <label className="block mb-1 font-medium">Fecha *</label>
          <Controller
            name="expenseDate"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InputText {...field} type="date" className="w-full" />
            )}
          />
        </div>
        <div className={`${currency !== "USD" ? "col-4" : "col-6"} field`}>
          <label className="block mb-1 font-medium">Moneda *</label>
          <Controller
            name="currency"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Dropdown
                {...field}
                options={CURRENCY_OPTIONS}
                className="w-full"
                onChange={(e) => {
                  field.onChange(e.value);
                  // Clear rate so auto-fill kicks in for new currency
                  setValue("exchangeRate", undefined);
                }}
              />
            )}
          />
        </div>
        {currency !== "USD" && (
          <div className="col-4 field">
            <label className="block mb-1 font-medium flex align-items-center gap-2">
              {rateLabel}
              {bcvLoading && (
                <i className="pi pi-spin pi-spinner text-xs text-500" />
              )}
              {!bcvLoading && autoRate && autoRate > 1 && (
                <span className="text-xs text-green-600 font-normal">
                  BCV:{" "}
                  {autoRate.toLocaleString("es-VE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}
                </span>
              )}
            </label>
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
                  placeholder={
                    bcvLoading
                      ? "Cargando BCV..."
                      : `Bs. por 1 ${currency === "VES" ? "USD" : currency}`
                  }
                  className="w-full"
                />
              )}
            />
          </div>
        )}
      </div>

      {/* Monto + IVA */}
      <div className="grid">
        <div className="col-6 field">
          <label className="block mb-1 font-medium">Monto *</label>
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              {CURRENCY_SYMBOLS[currency] ?? "$"}
            </span>
            <Controller
              name="amount"
              control={control}
              rules={{ required: true, min: 0.01 }}
              render={({ field }) => (
                <InputNumber
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value ?? 0)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  className="w-full"
                />
              )}
            />
          </div>
        </div>
        <div className="col-6 field">
          <label className="block mb-1 font-medium">IVA / Impuesto</label>
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              {CURRENCY_SYMBOLS[currency] ?? "$"}
            </span>
            <Controller
              name="taxAmount"
              control={control}
              render={({ field }) => (
                <InputNumber
                  value={field.value ?? 0}
                  onValueChange={(e) => field.onChange(e.value ?? 0)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  className="w-full"
                />
              )}
            />
          </div>
        </div>
      </div>

      <div className="field">
        <label className="block mb-1 font-medium">Notas</label>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <InputTextarea
              {...field}
              value={field.value ?? ""}
              rows={2}
              className="w-full"
            />
          )}
        />
      </div>
    </form>
  );
}
