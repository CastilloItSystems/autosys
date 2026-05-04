"use client";

import { useCallback } from "react";
import useSWR from "swr";
import adjustmentService from "@/modules/inventory/adjustments/services/adjustmentService";

type AdjustmentParams = Parameters<typeof adjustmentService.getAll>[0];

export const useAdjustmentsData = (params?: AdjustmentParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-adjustments", params],
    () => adjustmentService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    adjustments: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
