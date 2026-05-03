"use client";
import { useCallback } from "react";
import useSWR from "swr";
import dealerDashboardService from "@/modules/concesionario/dashboard/services/dealerDashboardService";

type DealerHistoryParams = Parameters<typeof dealerDashboardService.getHistory>[0];

export const useDealerHistoryData = (params?: DealerHistoryParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["dealer-history", params],
    () => dealerDashboardService.getHistory(params),
    { revalidateOnFocus: false },
  );

  return {
    rows: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
