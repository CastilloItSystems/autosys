"use client";

import { useCallback } from "react";
import useSWR from "swr";
import laborTimeService from "@/modules/workshop/laborTimes/services/laborTimeService";

type LaborTimeFilters = Parameters<typeof laborTimeService.getAll>[0];

export const useLaborTimesData = (filters?: LaborTimeFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["workshop-labor-times", filters],
    () => laborTimeService.getAll(filters),
    { revalidateOnFocus: false },
  );

  return {
    laborTimes: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
