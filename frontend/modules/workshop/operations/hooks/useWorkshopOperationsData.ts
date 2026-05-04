"use client";

import { useCallback } from "react";
import useSWR from "swr";
import workshopOperationService from "@/modules/workshop/operations/services/workshopOperationService";

type OperationFilters = Parameters<typeof workshopOperationService.getAll>[0];

export const useWorkshopOperationsData = (filters?: OperationFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["workshop-operations", filters],
    () => workshopOperationService.getAll(filters),
    { revalidateOnFocus: false },
  );

  return {
    operations: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
