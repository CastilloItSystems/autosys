"use client";

import { useCallback } from "react";
import useSWR from "swr";
import purchaseOrderService from "@/modules/inventory/purchaseOrders/services/purchaseOrderService";

type PurchaseOrderParams = Parameters<typeof purchaseOrderService.getAll>[0];

export const usePurchaseOrdersData = (params?: PurchaseOrderParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-purchase-orders", params],
    () => purchaseOrderService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    purchaseOrders: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
