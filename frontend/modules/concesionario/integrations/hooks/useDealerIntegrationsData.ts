"use client";
import { useCallback } from "react";
import useSWR from "swr";
import dealerDashboardService from "@/modules/concesionario/dashboard/services/dealerDashboardService";

export const useDealerIntegrationsData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "dealer-integrations",
    () => dealerDashboardService.getIntegrations(),
    { revalidateOnFocus: false },
  );

  return {
    data: data?.data ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
