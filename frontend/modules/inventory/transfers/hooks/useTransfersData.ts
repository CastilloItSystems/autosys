"use client";

import { useCallback } from "react";
import useSWR from "swr";
import transferService from "@/modules/inventory/transfers/services/transferService";

interface TransferFilters {
  status?: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  preInvoiceId?: string;
  search?: string;
}

export const useTransfersData = (
  page = 1,
  limit = 20,
  filters?: TransferFilters,
) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-transfers", page, limit, filters],
    () => transferService.getAll(page, limit, filters),
    { revalidateOnFocus: false },
  );

  return {
    transfers: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
