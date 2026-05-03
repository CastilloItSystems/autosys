"use client";
import { useCallback } from "react";
import useSWR from "swr";
import quoteService from "../services/quoteService";

type QuoteParams = Parameters<typeof quoteService.getAll>[0];

export const useQuotesData = (params?: QuoteParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["crm-quotes", params],
    () => quoteService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    quotes: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
