"use client";

import { useCallback } from "react";
import useSWR from "swr";
import supplierPaymentService from "../services/supplierPaymentService";
import type { SupplierPayment } from "../interfaces/supplierPayment";

type SupplierPaymentParams = Parameters<typeof supplierPaymentService.getAll>[0];

export const useSupplierPaymentsData = (
  params?: SupplierPaymentParams | null,
) => {
  const { data, error, isLoading, mutate } = useSWR(
    params === null ? null : ["finance-supplier-payments", params],
    () => supplierPaymentService.getAll(params ?? undefined),
    { revalidateOnFocus: false },
  );

  return {
    payments: (data?.data ?? []) as SupplierPayment[],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
