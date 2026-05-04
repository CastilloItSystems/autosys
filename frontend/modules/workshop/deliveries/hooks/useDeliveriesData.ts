"use client";

import { useCallback } from "react";
import useSWR from "swr";
import deliveryService from "@/modules/workshop/deliveries/services/deliveryService";

type DeliveryFilters = Parameters<typeof deliveryService.getAll>[0];

export const useDeliveriesData = (filters?: DeliveryFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["workshop-deliveries", filters],
    () => deliveryService.getAll(filters),
    { revalidateOnFocus: false },
  );

  return {
    deliveries: data?.data ?? [],
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
