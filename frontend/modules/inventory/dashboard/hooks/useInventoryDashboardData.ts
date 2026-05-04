"use client";

import { useCallback } from "react";
import useSWR from "swr";
import analyticsService from "@/modules/inventory/dashboard/services/analyticsService";
import stockService from "@/modules/inventory/stocks/services/stockService";

export const useInventoryDashboardData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "inventory-dashboard",
    async () => {
      const [metrics, summary] = await Promise.all([
        stockService.getDashboardMetrics(),
        stockService.getDashboardSummary(),
      ]);
      return { metrics: metrics.data, summary: summary.data };
    },
    { revalidateOnFocus: false },
  );

  return {
    metrics: data?.metrics ?? null,
    summary: data?.summary ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useABCAnalysisData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "inventory-abc-analysis",
    () => analyticsService.getABCAnalysis(),
    { revalidateOnFocus: false },
  );

  return {
    abcData: data?.data ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
