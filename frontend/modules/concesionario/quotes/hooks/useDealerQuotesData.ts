"use client";
import { useCallback } from "react";
import useSWR from "swr";
import dealerQuoteService from "../services/dealerQuoteService";

type DealerQuotesParams = Parameters<typeof dealerQuoteService.getAll>[0];

export const useDealerQuotesData = (params?: DealerQuotesParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["dealer-quotes", params],
    () => dealerQuoteService.getAll(params),
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
