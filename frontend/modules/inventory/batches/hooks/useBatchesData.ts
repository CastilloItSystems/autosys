"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { getBatches } from "../services/batchService";
import type { BatchFilters } from "@/types/batch.interface";

export const useBatchesData = (
  page = 1,
  limit = 20,
  filters?: BatchFilters,
) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-batches", page, limit, filters],
    () => getBatches(page, limit, filters),
    { revalidateOnFocus: false },
  );

  return {
    batches: data?.data ?? [],
    total: data?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
