"use client";

import { useCallback } from "react";
import useSWR from "swr";
import expenseService from "../services/expenseService";

type ExpenseParams = Parameters<typeof expenseService.getAll>[0];
type RecurringRuleParams = Parameters<typeof expenseService.getAllRules>[0];

export const useExpensesData = (params?: ExpenseParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["finance-expenses", params],
    () => expenseService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    expenses: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useRecurringRulesData = (params?: RecurringRuleParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["finance-recurring-rules", params],
    () => expenseService.getAllRules(params),
    { revalidateOnFocus: false },
  );

  return {
    rules: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
