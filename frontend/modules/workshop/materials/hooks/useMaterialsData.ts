"use client";

import { useCallback } from "react";
import useSWR from "swr";
import materialService from "@/modules/workshop/materials/services/materialService";

type MaterialFilters = Parameters<typeof materialService.getAll>[0];

export const useMaterialsData = (filters?: MaterialFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["workshop-materials", filters],
    () => materialService.getAll(filters),
    { revalidateOnFocus: false },
  );

  return {
    materials: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
