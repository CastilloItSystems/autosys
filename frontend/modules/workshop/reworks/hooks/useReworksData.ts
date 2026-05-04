"use client";

import { useCallback } from "react";
import useSWR from "swr";
import reworkService from "@/modules/workshop/reworks/services/reworkService";

type ReworkFilters = Parameters<typeof reworkService.getAll>[0];

export const useReworksData = (filters?: ReworkFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["workshop-reworks", filters],
    () => reworkService.getAll(filters),
    { revalidateOnFocus: false },
  );

  return {
    reworks: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
