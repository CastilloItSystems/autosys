"use client";

import { useCallback } from "react";
import useSWR from "swr";
import cycleCountService from "@/modules/inventory/cycleCounts/services/cycleCountService";

type CycleCountParams = Parameters<typeof cycleCountService.getAll>[0];

export const useCycleCountsData = (params?: CycleCountParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-cycle-counts", params],
    () => cycleCountService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    cycleCounts: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
