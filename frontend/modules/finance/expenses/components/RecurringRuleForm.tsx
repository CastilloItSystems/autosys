"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import type {
  ExpenseRecurringRule,
  CreateRecurringRuleData,
  ExpenseCategory,
  RecurringFrequency,
} from "../interfaces/expense";
import { EXPENSE_CATEGORY_LABELS } from "../interfaces/expense";
import expenseService from "../services/expenseService";
import { handleFormError } from "@/utils/errorHandlers";

const CATEGORY_OPTIONS = Object.entries(EXPENSE_CATEGORY_LABELS).map(
  ([value, label]) => ({
    label,
    value: value as ExpenseCategory,
  }),
);

const FREQUENCY_OPTIONS: { label: string; value: RecurringFrequency }[] = [
  { label: "Semanal", value: "WEEKLY" },
  { label: "Quincenal", value: "BIWEEKLY" },
  { label: "Mensual", value: "MONTHLY" },
  { label: "Trimestral", value: "QUARTERLY" },
  { label: "Anual", value: "YEARLY" },
];

const CURRENCY_OPTIONS = [
  { label: "USD - Dólar", value: "USD" },
  { label: "VES - Bolívar", value: "VES" },
  { label: "EUR - Euro", value: "EUR" },
];

interface Props {
  rule?: ExpenseRecurringRule | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<Toast>;
}

export default function RecurringRuleForm({
  rule,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: Props) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateRecurringRuleData>({
    mode: "onBlur",
    defaultValues: {
      name: rule?.name ?? "",
      category: rule?.category ?? "UTILITIES",
      description: rule?.description ?? "",
      amount: rule ? Number(rule.amount) : 0,
      currency: rule?.currency ?? "USD",
      frequency: rule?.frequency ?? "MONTHLY",
      dayOfMonth: rule?.dayOfMonth ?? 1,
      startDate: rule?.startDate
        ? rule.startDate.split("T")[0]
        : new Date().toISOString().split("T")[0],
      endDate: rule?.endDate ? rule.endDate.split("T")[0] : undefined,
    },
  });

  const frequency = watch("frequency");
  const currency = watch("currency") || "USD";
  const currencyPrefix =
    currency === "VES" ? "Bs. " : currency === "EUR" ? "€ " : "$ ";

  const onSubmit = async (data: CreateRecurringRuleData) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      if (rule) {
        await expenseService.updateRule(rule.id, data);
      } else {
        await expenseService.createRule(data);
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
      id={formId || "recurring-rule-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-column gap-3 pt-2"
    >
      <div className="field">
        <label className="block mb-1 font-medium">Nombre de la regla *</label>
        <Controller
          name="name"
          control={control}
          rules={{ required: "El nombre es obligatorio" }}
          render={({ field }) => (
            <InputText
              {...field}
              className="w-full"
              placeholder="Internet Inter mensual"
            />
          )}
        />
        {errors.name && (
          <small className="p-error">{errors.name.message}</small>
        )}
      </div>

      <div className="grid">
        <div className="col-6 field">
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
        <div className="col-6 field">
          <label className="block mb-1 font-medium">Frecuencia *</label>
          <Controller
            name="frequency"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Dropdown
                {...field}
                options={FREQUENCY_OPTIONS}
                className="w-full"
              />
            )}
          />
        </div>
      </div>

      <div className="field">
        <label className="block mb-1 font-medium">Descripción *</label>
        <Controller
          name="description"
          control={control}
          rules={{ required: "Requerido" }}
          render={({ field }) => (
            <InputText
              {...field}
              className="w-full"
              placeholder="Pago mensual de Internet"
            />
          )}
        />
        {errors.description && (
          <small className="p-error">{errors.description.message}</small>
        )}
      </div>

      <div className="grid">
        <div className="col-6 field">
          <label className="block mb-1 font-medium">Monto *</label>
          <Controller
            name="amount"
            control={control}
            rules={{ required: true, min: 0.01 }}
            render={({ field }) => (
              <InputNumber
                value={field.value}
                onValueChange={(e) => field.onChange(e.value ?? 0)}
                mode="decimal"
                prefix={currencyPrefix}
                minFractionDigits={2}
                maxFractionDigits={2}
                className="w-full"
              />
            )}
          />
        </div>
        <div className="col-6 field">
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
              />
            )}
          />
        </div>
      </div>

      {(frequency === "MONTHLY" ||
        frequency === "QUARTERLY" ||
        frequency === "YEARLY") && (
        <div className="field">
          <label className="block mb-1 font-medium">Día del mes (1-28)</label>
          <Controller
            name="dayOfMonth"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? 1}
                onValueChange={(e) => field.onChange(e.value ?? 1)}
                min={1}
                max={28}
                showButtons
                className="w-full"
              />
            )}
          />
        </div>
      )}

      <div className="grid">
        <div className="col-6 field">
          <label className="block mb-1 font-medium">Inicio *</label>
          <Controller
            name="startDate"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InputText {...field} type="date" className="w-full" />
            )}
          />
        </div>
        <div className="col-6 field">
          <label className="block mb-1 font-medium">Fin (opcional)</label>
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                value={field.value ?? ""}
                type="date"
                className="w-full"
              />
            )}
          />
        </div>
      </div>
    </form>
  );
}
