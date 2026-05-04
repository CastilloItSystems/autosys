"use client";

import { useCallback } from "react";
import useSWR from "swr";
import preInvoiceService from "../services/preInvoiceService";

type PreInvoiceParams = Parameters<typeof preInvoiceService.getAll>[0];

export const usePreInvoicesData = (params?: PreInvoiceParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["sales-pre-invoices", params],
    () => preInvoiceService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    preInvoices: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
