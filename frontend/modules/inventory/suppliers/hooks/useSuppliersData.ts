"use client";

import { useCallback } from "react";
import useSWR from "swr";
import supplierService from "@/modules/inventory/suppliers/services/supplierService";

type SupplierParams = Parameters<typeof supplierService.getAll>[0];

export const useSuppliersData = (params?: SupplierParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-suppliers", params],
    () => supplierService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    suppliers: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
