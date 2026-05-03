"use client";
import { useCallback } from "react";
import useSWR from "swr";
import dealerDeliveryService from "../services/dealerDeliveryService";

type DealerDeliveriesParams = Parameters<typeof dealerDeliveryService.getAll>[0];

export const useDealerDeliveriesData = (params?: DealerDeliveriesParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["dealer-deliveries", params],
    () => dealerDeliveryService.getAll(params),
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
