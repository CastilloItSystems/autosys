"use client";

import { useCallback } from "react";
import useSWR from "swr";
import invoiceService from "../services/invoiceService";

type InvoiceParams = Parameters<typeof invoiceService.getAll>[0];

export const useInvoicesData = (params?: InvoiceParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["sales-invoices", params],
    () => invoiceService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    invoices: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
