"use client";

import { useCallback } from "react";
import useSWR from "swr";
import movementService from "@/modules/inventory/movements/services/movementService";

type MovementParams = Parameters<typeof movementService.getAll>[0];

export const useMovementsData = (params?: MovementParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-movements", params],
    () => movementService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    movements: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
