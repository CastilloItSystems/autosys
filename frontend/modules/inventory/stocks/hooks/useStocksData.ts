"use client";

import { useCallback } from "react";
import useSWR from "swr";
import stockService from "@/modules/inventory/stocks/services/stockService";

interface StockFilters {
  itemId?: string;
  warehouseId?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
  search?: string;
}

export const useStocksData = (
  page = 1,
  limit = 20,
  filters?: StockFilters,
) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-stocks", page, limit, filters],
    () => stockService.getAll(page, limit, filters),
    { revalidateOnFocus: false },
  );

  return {
    stocks: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
