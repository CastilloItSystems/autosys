"use client";

import { useCallback } from "react";
import useSWR from "swr";
import itemService from "@/modules/inventory/items/services/itemService";
import supplierService from "@/modules/inventory/suppliers/services/supplierService";
import warehouseService from "@/modules/inventory/warehouses/services/warehouseService";
import customerService from "@/modules/sales/customer/services/customerService";
import orderService from "../services/orderService";

type OrderParams = Parameters<typeof orderService.getAll>[0];

export const useOrdersData = (params?: OrderParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["sales-orders", params],
    () => orderService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    orders: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useSalesOrderOptionsData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "sales-order-options",
    async () => {
      const [warehousesRes, itemsRes, customersRes, suppliersRes] =
        await Promise.all([
          warehouseService.getActive(),
          itemService.getActive(),
          customerService.getActive(),
          supplierService.getActive(),
        ]);

      return {
        warehouses: warehousesRes.data ?? [],
        items: itemsRes.data ?? [],
        customers: customersRes.data ?? [],
        suppliers: suppliersRes.data ?? [],
      };
    },
    { revalidateOnFocus: false },
  );

  return {
    warehouses: data?.warehouses ?? [],
    items: data?.items ?? [],
    customers: data?.customers ?? [],
    suppliers: data?.suppliers ?? [],
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
