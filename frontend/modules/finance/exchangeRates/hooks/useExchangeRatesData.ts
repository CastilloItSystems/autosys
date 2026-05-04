"use client";

import { useCallback } from "react";
import useSWR from "swr";
import exchangeRateService from "../services/exchangeRateService";

type ExchangeRateParams = Parameters<typeof exchangeRateService.getAll>[0];

export const useExchangeRatesData = (params?: ExchangeRateParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["finance-exchange-rates", params],
    () => exchangeRateService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    rates: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useActiveExchangeRatesData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "finance-active-exchange-rates",
    () => exchangeRateService.getActive(),
    { revalidateOnFocus: false },
  );

  return {
    rates: data?.data ?? [],
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useLatestExchangeRateData = (
  fromCurrency?: string | null,
  toCurrency?: string | null,
) => {
  const { data, error, isLoading, mutate } = useSWR(
    fromCurrency && toCurrency
      ? ["finance-latest-exchange-rate", fromCurrency, toCurrency]
      : null,
    () =>
      exchangeRateService.getLatest(
        fromCurrency as string,
        toCurrency as string,
      ),
    { revalidateOnFocus: false },
  );

  return {
    rate: data?.data ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
