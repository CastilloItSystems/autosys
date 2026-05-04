"use client";

import { useCallback } from "react";
import useSWR from "swr";
import returnService, {
  ReturnStatus,
  ReturnType,
} from "@/modules/inventory/returns/services/returnService";

interface ReturnFilters {
  status?: ReturnStatus;
  type?: ReturnType;
  warehouseId?: string;
}

export const useReturnsData = (
  page = 1,
  limit = 20,
  filters?: ReturnFilters,
) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-returns", page, limit, filters],
    () => returnService.getAll(page, limit, filters),
    { revalidateOnFocus: false },
  );

  return {
    returns: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
