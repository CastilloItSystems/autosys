"use client";

import { useCallback } from "react";
import useSWR from "swr";
import warrantyService from "@/modules/workshop/warranties/services/warrantyService";

type WarrantyFilters = Parameters<typeof warrantyService.getAll>[0];

export const useWarrantiesData = (filters?: WarrantyFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["workshop-warranties", filters],
    () => warrantyService.getAll(filters),
    { revalidateOnFocus: false },
  );

  return {
    warranties: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
