"use client";
import { useCallback } from "react";
import useSWR from "swr";
import dealerAfterSaleService from "../services/dealerAfterSaleService";

type DealerAfterSalesParams = Parameters<typeof dealerAfterSaleService.getAll>[0];

export const useDealerAfterSalesData = (params?: DealerAfterSalesParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["dealer-after-sales", params],
    () => dealerAfterSaleService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    items: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
