"use client";

import { useCallback } from "react";
import useSWR from "swr";
import bankAccountService from "../services/bankAccountService";
import type { BankAccount } from "../interfaces/bankAccount";

type BankAccountParams = Parameters<typeof bankAccountService.getAll>[0];

export const useBankAccountsData = (params?: BankAccountParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["finance-bank-accounts", params],
    () => bankAccountService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    accounts: (data?.data ?? []) as BankAccount[],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useActiveBankAccountOptionsData = (
  params: BankAccountParams | null = { isActive: "true", limit: 100 },
) => {
  const { data, error, isLoading, mutate } = useSWR(
    params === null ? null : ["finance-active-bank-account-options", params],
    () => bankAccountService.getAll(params ?? undefined),
    { revalidateOnFocus: false },
  );

  const accounts = (data?.data ?? []) as BankAccount[];

  return {
    accounts,
    bankAccountOptions: [
      { label: "Todas las cuentas", value: "" },
      ...accounts.map((account) => ({
        label: `${account.name} (${account.currency})`,
        value: account.id,
      })),
    ],
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useBankAccountBalanceData = (bankAccountId?: string | null) => {
  const { data, error, isLoading, mutate } = useSWR(
    bankAccountId ? ["finance-bank-account-balance", bankAccountId] : null,
    () => bankAccountService.getBalance(bankAccountId as string),
    { revalidateOnFocus: false },
  );

  return {
    balance: data?.data ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
