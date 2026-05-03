"use client";
import { useCallback } from "react";
import useSWR from "swr";
import crmDashboardService from "../services/crmDashboardService";

export const useCrmDashboardData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "crm-dashboard",
    () => crmDashboardService.get(),
    { revalidateOnFocus: false },
  );

  return {
    dashboard: data?.data ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
