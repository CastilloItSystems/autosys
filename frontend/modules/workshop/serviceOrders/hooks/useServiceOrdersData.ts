"use client";

import { useCallback } from "react";
import useSWR from "swr";
import serviceOrderService from "@/modules/workshop/serviceOrders/services/serviceOrderService";

type ServiceOrderFilters = Parameters<typeof serviceOrderService.getAll>[0];

export const useServiceOrdersData = (filters?: ServiceOrderFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["workshop-service-orders", filters],
    () => serviceOrderService.getAll(filters),
    { revalidateOnFocus: false },
  );

  return {
    serviceOrders: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
