"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import type {
  BankAccount,
  CreateBankAccountData,
} from "@/modules/finance/bankAccounts/interfaces/bankAccount";
import bankAccountService from "@/modules/finance/bankAccounts/services/bankAccountService";
import { handleFormError } from "@/utils/errorHandlers";

const TYPE_OPTIONS = [
  { label: "Corriente", value: "CHECKING" },
  { label: "Ahorro", value: "SAVINGS" },
  { label: "Caja / Efectivo", value: "CASH" },
  { label: "Cripto", value: "CRYPTO" },
];

const CURRENCY_OPTIONS = [
  { label: "USD - Dólar", value: "USD" },
  { label: "VES - Bolívar", value: "VES" },
  { label: "EUR - Euro", value: "EUR" },
];

interface Props {
  account?: BankAccount | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<Toast>;
}

export default function BankAccountForm({
  account,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateBankAccountData>({
    mode: "onBlur",
    defaultValues: {
      name: account?.name ?? "",
      type: account?.type ?? "CASH",
      bankName: account?.bankName ?? "",
      accountNumber: account?.accountNumber ?? "",
      currency: account?.currency ?? "USD",
      initialBalance: account?.initialBalance ?? 0,
      notes: account?.notes ?? "",
    },
  });

  const onSubmit = async (data: CreateBankAccountData) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      if (account) {
        await bankAccountService.update(account.id, data);
      } else {
        await bankAccountService.create(data);
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
      id={formId || "bank-account-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-column gap-3 pt-2"
    >
      <div className="field">
        <label className="block mb-1 font-medium">Nombre *</label>
        <Controller
          name="name"
          control={control}
          rules={{ required: "El nombre es obligatorio" }}
          render={({ field }) => (
            <InputText
              {...field}
              className="w-full"
              placeholder="BNC Corriente USD"
            />
          )}
        />
        {errors.name && (
          <small className="p-error">{errors.name.message}</small>
        )}
      </div>

      <div className="grid">
        <div className="col-6 field">
          <label className="block mb-1 font-medium">Tipo *</label>
          <Controller
            name="type"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Dropdown {...field} options={TYPE_OPTIONS} className="w-full" />
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

      <div className="field">
        <label className="block mb-1 font-medium">Banco</label>
        <Controller
          name="bankName"
          control={control}
          render={({ field }) => (
            <InputText
              {...field}
              className="w-full"
              placeholder="BNC, Banesco, etc."
            />
          )}
        />
      </div>

      <div className="field">
        <label className="block mb-1 font-medium">Número de cuenta</label>
        <Controller
          name="accountNumber"
          control={control}
          render={({ field }) => (
            <InputText {...field} className="w-full" placeholder="0108-..." />
          )}
        />
      </div>

      {!account && (
        <div className="field">
          <label className="block mb-1 font-medium">Saldo inicial</label>
          <Controller
            name="initialBalance"
            control={control}
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
      )}

      <div className="field">
        <label className="block mb-1 font-medium">Notas</label>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <InputTextarea {...field} rows={3} className="w-full" />
          )}
        />
      </div>
    </form>
  );
}
