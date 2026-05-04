"use client";

import { useCallback } from "react";
import useSWR from "swr";
import supplierBillService from "../services/supplierBillService";

type SupplierBillParams = Parameters<typeof supplierBillService.getAll>[0];

export const useSupplierBillsData = (params?: SupplierBillParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["finance-supplier-bills", params],
    () => supplierBillService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    bills: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useAccountsPayableData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "finance-accounts-payable",
    () => supplierBillService.getAccountsPayable(),
    { revalidateOnFocus: false },
  );

  return {
    entries: data?.data ?? [],
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useAvailablePurchaseOrdersData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "finance-available-purchase-orders",
    () => supplierBillService.getAvailablePurchaseOrders(),
    { revalidateOnFocus: false },
  );

  return {
    purchaseOrders: (data?.data ?? []) as any[],
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
