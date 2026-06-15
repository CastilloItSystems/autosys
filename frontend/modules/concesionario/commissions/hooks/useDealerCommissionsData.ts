"use client";
import { useCallback } from "react";
import useSWR from "swr";
import dealerCommissionService from "../services/dealerCommissionService";

type DealerCommissionsParams = Parameters<
  typeof dealerCommissionService.getAll
>[0];

export const useDealerCommissionsData = (params?: DealerCommissionsParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["dealer-commissions", params],
    () => dealerCommissionService.getAll(params),
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
