"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { getSerialNumbers } from "@/modules/inventory/serialNumbers/services/serialNumberService";
import type { SerialNumberFilters } from "@/types/serialNumber.interface";

export const useSerialNumbersData = (
  page = 1,
  limit = 20,
  filters?: SerialNumberFilters,
) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-serial-numbers", page, limit, filters],
    () => getSerialNumbers(page, limit, filters),
    { revalidateOnFocus: false },
  );

  return {
    serialNumbers: data?.data ?? [],
    total: data?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
