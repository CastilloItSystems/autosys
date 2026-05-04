"use client";

import { useCallback } from "react";
import useSWR from "swr";
import totService from "@/modules/workshop/tot/services/totService";

type TOTFilters = Parameters<typeof totService.getAll>[0];

export const useTOTData = (filters?: TOTFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["workshop-tot", filters],
    () => totService.getAll(filters),
    { revalidateOnFocus: false },
  );

  return {
    tots: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
