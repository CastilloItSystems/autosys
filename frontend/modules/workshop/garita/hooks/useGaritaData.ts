"use client";

import { useCallback } from "react";
import useSWR from "swr";
import garitaService from "@/modules/workshop/garita/services/garitaService";

type GaritaFilters = Parameters<typeof garitaService.getAll>[0];

export const useGaritaData = (filters?: GaritaFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["workshop-garita", filters],
    () => garitaService.getAll(filters),
    { revalidateOnFocus: false },
  );

  return {
    events: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
