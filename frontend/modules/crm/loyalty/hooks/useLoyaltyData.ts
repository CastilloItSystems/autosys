"use client";
import { useCallback } from "react";
import useSWR from "swr";
import loyaltyService from "../services/loyaltyService";

type LoyaltyParams = Parameters<typeof loyaltyService.getAll>[0];

export const useLoyaltyData = (params?: LoyaltyParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["crm-loyalty", params],
    () => loyaltyService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    data: data?.data ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
