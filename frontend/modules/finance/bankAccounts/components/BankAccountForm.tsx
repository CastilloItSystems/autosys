"use client";

import React, { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import type {
  BankAccount,
  CreateBankAccountData,
  BankAccountType,
} from "../interfaces/bankAccount";
import bankAccountService from "../services/bankAccountService";
import { handleFormError } from "@/utils/errorHandlers";
import AccountNumberInput from "@/shared/components/AccountNumberInput";

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

const BANK_OPTIONS = [
  {
    label: "0001 - Banco Central de Venezuela",
    value: "Banco Central de Venezuela",
    code: "0001",
  },
  {
    label: "0102 - Banco de Venezuela",
    value: "Banco de Venezuela",
    code: "0102",
  },
  {
    label: "0104 - Banco Venezolano de Crédito",
    value: "Banco Venezolano de Crédito",
    code: "0104",
  },
  { label: "0105 - Mercantil Banco", value: "Mercantil Banco", code: "0105" },
  { label: "0108 - BBVA Provincial", value: "BBVA Provincial", code: "0108" },
  { label: "0114 - Bancaribe", value: "Bancaribe", code: "0114" },
  { label: "0115 - Banco Exterior", value: "Banco Exterior", code: "0115" },
  { label: "0128 - Banco Caroní", value: "Banco Caroní", code: "0128" },
  { label: "0134 - Banesco", value: "Banesco", code: "0134" },
  { label: "0137 - Banco Sofitasa", value: "Banco Sofitasa", code: "0137" },
  { label: "0138 - Banco Plaza", value: "Banco Plaza", code: "0138" },
  { label: "0146 - Bangente", value: "Bangente", code: "0146" },
  {
    label: "0151 - BFC Banco Fondo Común",
    value: "BFC Banco Fondo Común",
    code: "0151",
  },
  { label: "0156 - 100% Banco", value: "100% Banco", code: "0156" },
  {
    label: "0157 - DelSur Banco Universal",
    value: "DelSur Banco Universal",
    code: "0157",
  },
  { label: "0163 - Banco del Tesoro", value: "Banco del Tesoro", code: "0163" },
  {
    label: "0166 - Banco Agrícola de Venezuela",
    value: "Banco Agrícola de Venezuela",
    code: "0166",
  },
  { label: "0168 - Bancrecer", value: "Bancrecer", code: "0168" },
  {
    label: "0169 - R4 Banco Microfinanciero",
    value: "R4 Banco Microfinanciero",
    code: "0169",
  },
  { label: "0171 - Banco Activo", value: "Banco Activo", code: "0171" },
  { label: "0172 - Bancamiga", value: "Bancamiga", code: "0172" },
  {
    label: "0173 - Banco Internacional de Desarrollo",
    value: "Banco Internacional de Desarrollo",
    code: "0173",
  },
  { label: "0174 - Banplus", value: "Banplus", code: "0174" },
  {
    label: "0175 - Banco Digital de los Trabajadores",
    value: "Banco Digital de los Trabajadores",
    code: "0175",
  },
  { label: "0177 - BANFANB", value: "BANFANB", code: "0177" },
  {
    label: "0178 - N58 Banco Digital",
    value: "N58 Banco Digital",
    code: "0178",
  },
  {
    label: "0191 - Banco Nacional de Crédito (BNC)",
    value: "Banco Nacional de Crédito (BNC)",
    code: "0191",
  },
  {
    label: "0601 - Instituto Municipal de Crédito Popular",
    value: "Instituto Municipal de Crédito Popular",
    code: "0601",
  },
];

const requiresBankDetails = (type?: BankAccountType) =>
  type === "CHECKING" || type === "SAVINGS";

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
    watch,
    getValues,
    setValue,
    clearErrors,
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

  const selectedType = watch("type");
  const selectedBankName = watch("bankName");
  const shouldShowBankDetails = requiresBankDetails(selectedType);

  const bankOptions = useMemo(() => {
    const currentBankName = account?.bankName?.trim();
    if (
      !currentBankName ||
      BANK_OPTIONS.some((option) => option.value === currentBankName)
    ) {
      return BANK_OPTIONS;
    }

    return [
      { label: currentBankName, value: currentBankName, code: "" },
      ...BANK_OPTIONS,
    ];
  }, [account?.bankName]);

  const selectedBank = bankOptions.find(
    (option) => option.value === selectedBankName
  );

  useEffect(() => {
    if (!shouldShowBankDetails) {
      clearErrors(["bankName", "accountNumber"]);
    }
  }, [clearErrors, shouldShowBankDetails]);

  const handleBankChange = (bankName: string) => {
    const bank = bankOptions.find((option) => option.value === bankName);
    if (!bankName) {
      setValue("accountNumber", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    if (!bank?.code) return;

    const currentNumber = getValues("accountNumber") ?? "";
    const digits = currentNumber.replace(/\D/g, "");
    const suffix = digits.length > 4 ? digits.slice(4) : "";
    setValue("accountNumber", `${bank.code}${suffix}`.slice(0, 20), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit = async (data: CreateBankAccountData) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      const isBankAccount = requiresBankDetails(data.type);
      const payload: CreateBankAccountData = {
        ...data,
        name: data.name.trim(),
        bankName: isBankAccount ? data.bankName?.trim() : "",
        accountNumber: isBankAccount ? data.accountNumber?.trim() : "",
        notes: data.notes?.trim() || "",
      };

      if (account) {
        await bankAccountService.update(account.id, payload);
      } else {
        await bankAccountService.create(payload);
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
      className="flex flex-column gap-2 pt-2"
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
              placeholder="Ej. Cuenta principal USD"
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

      {shouldShowBankDetails && (
        <>
          <div className="field">
            <label className="block mb-1 font-medium">Banco *</label>
            <Controller
              name="bankName"
              control={control}
              rules={{
                validate: (value) =>
                  !requiresBankDetails(getValues("type")) ||
                  Boolean(value?.trim()) ||
                  "El banco es obligatorio",
              }}
              render={({ field }) => (
                <Dropdown
                  value={field.value || null}
                  onChange={(e) => {
                    const nextValue = e.value ?? "";
                    field.onChange(nextValue);
                    handleBankChange(nextValue);
                  }}
                  onBlur={field.onBlur}
                  options={bankOptions}
                  className="w-full"
                  placeholder="Seleccione un banco"
                  filter
                  showClear
                />
              )}
            />
            {errors.bankName && (
              <small className="p-error">{errors.bankName.message}</small>
            )}
          </div>

          <div className="field">
            <label className="block mb-1 font-medium">Número de cuenta *</label>
            <Controller
              name="accountNumber"
              control={control}
              rules={{
                validate: (value) => {
                  if (!requiresBankDetails(getValues("type"))) return true;
                  if (!value?.trim()) {
                    return "El número de cuenta es obligatorio";
                  }
                  if (!/^\d{20}$/.test(value)) {
                    return "El número de cuenta debe tener 20 dígitos";
                  }
                  if (
                    selectedBank?.code &&
                    !value.startsWith(selectedBank.code)
                  ) {
                    return `El número debe iniciar con ${selectedBank.code}`;
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <AccountNumberInput
                  ref={field.ref}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  className="w-full"
                  placeholder={
                    selectedBank?.code
                      ? `${selectedBank.code}...`
                      : "20 dígitos"
                  }
                />
              )}
            />
            {errors.accountNumber && (
              <small className="p-error">{errors.accountNumber.message}</small>
            )}
          </div>
        </>
      )}

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
            <InputTextarea {...field} rows={2} className="w-full" />
          )}
        />
      </div>
    </form>
  );
}
