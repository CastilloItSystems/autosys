"use client";

import { useCallback } from "react";
import useSWR from "swr";
import salesOrderService from "@/modules/inventory/salesOrders/services/salesOrderService";

export const useInventorySalesOrdersData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "inventory-sales-orders",
    () => salesOrderService.getAll(),
    { revalidateOnFocus: false },
  );

  return {
    salesOrders: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
