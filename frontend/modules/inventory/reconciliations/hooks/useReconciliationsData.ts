"use client";

import { useCallback } from "react";
import useSWR from "swr";
import reconciliationService from "@/modules/inventory/reconciliations/services/reconciliationService";
import {
  ReconciliationStatus,
  ReconciliationSource,
} from "@/modules/inventory/reconciliations/services/reconciliationService";

interface ReconciliationFilters {
  page?: number;
  limit?: number;
  status?: ReconciliationStatus | null;
  warehouseId?: string | null;
  source?: ReconciliationSource | null;
}

export const useReconciliationsData = (params?: ReconciliationFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-reconciliations", params],
    () =>
      reconciliationService.getAll(
        params?.page ?? 1,
        params?.limit ?? 20,
        {
          status: params?.status || undefined,
          warehouseId: params?.warehouseId || undefined,
          source: params?.source || undefined,
        },
      ),
    { revalidateOnFocus: false },
  );

  return {
    reconciliations: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
