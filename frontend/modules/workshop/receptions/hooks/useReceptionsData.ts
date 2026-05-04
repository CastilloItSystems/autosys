"use client";

import { useCallback } from "react";
import useSWR from "swr";
import receptionService from "@/modules/workshop/receptions/services/receptionService";

type ReceptionFilters = Parameters<typeof receptionService.getAll>[0];

export const useReceptionsData = (filters?: ReceptionFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["workshop-receptions", filters],
    () => receptionService.getAll(filters),
    { revalidateOnFocus: false },
  );

  return {
    receptions: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
