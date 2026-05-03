"use client";
import { useCallback } from "react";
import useSWR from "swr";
import reportService, {
  SupplierPerformanceFilters,
} from "../services/reportService";

export const useSupplierPerformanceData = (
  filters: SupplierPerformanceFilters,
) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-supplier-performance", filters],
    () => reportService.getSupplierPerformance(filters),
    { revalidateOnFocus: false },
  );

  return {
    items: data?.data ?? [],
    summary: data?.summary ?? null,
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
