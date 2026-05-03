"use client";
import { useCallback } from "react";
import useSWR from "swr";
import dealerFinancingService from "../services/dealerFinancingService";

type DealerFinancingParams = Parameters<typeof dealerFinancingService.getAll>[0];

export const useDealerFinancingData = (params?: DealerFinancingParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["dealer-financing", params],
    () => dealerFinancingService.getAll(params),
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
