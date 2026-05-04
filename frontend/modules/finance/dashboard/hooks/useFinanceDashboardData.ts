"use client";

import { useCallback } from "react";
import useSWR from "swr";
import financeDashboardService from "../services/financeDashboardService";

export const useFinanceDashboardData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "finance-dashboard",
    () => financeDashboardService.getDashboard(),
    { revalidateOnFocus: false },
  );

  return {
    data: data ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
