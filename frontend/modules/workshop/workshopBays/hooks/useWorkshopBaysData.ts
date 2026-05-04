"use client";

import { useCallback } from "react";
import useSWR from "swr";
import workshopBayService from "@/modules/workshop/workshopBays/services/workshopBayService";

type BayFilters = Parameters<typeof workshopBayService.getAll>[0];

export const useWorkshopBaysData = (filters?: BayFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["workshop-bays", filters],
    () => workshopBayService.getAll(filters),
    { revalidateOnFocus: false },
  );

  return {
    bays: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
