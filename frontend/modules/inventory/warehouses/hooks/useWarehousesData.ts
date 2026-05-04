"use client";

import { useCallback } from "react";
import useSWR from "swr";
import warehouseService from "@/modules/inventory/warehouses/services/warehouseService";

type WarehouseParams = Parameters<typeof warehouseService.getAll>[0];

export const useWarehousesData = (params?: WarehouseParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-warehouses", params],
    () => warehouseService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    warehouses: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
