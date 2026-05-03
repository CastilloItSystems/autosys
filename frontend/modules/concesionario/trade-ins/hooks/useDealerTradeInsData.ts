"use client";
import { useCallback } from "react";
import useSWR from "swr";
import dealerTradeInService from "../services/dealerTradeInService";

type DealerTradeInsParams = Parameters<typeof dealerTradeInService.getAll>[0];

export const useDealerTradeInsData = (params?: DealerTradeInsParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["dealer-trade-ins", params],
    () => dealerTradeInService.getAll(params),
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
