"use client";

import { useCallback } from "react";
import useSWR from "swr";
import paymentService from "../services/paymentService";

type PaymentParams = Parameters<typeof paymentService.getAll>[0];

export const usePaymentsData = (params?: PaymentParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["sales-payments", params],
    () => paymentService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    payments: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const usePreInvoicePaymentsData = (preInvoiceId?: string | null) => {
  const { data, error, isLoading, mutate } = useSWR(
    preInvoiceId ? ["sales-pre-invoice-payments", preInvoiceId] : null,
    () => paymentService.getByPreInvoice(preInvoiceId as string),
    { revalidateOnFocus: false },
  );

  return {
    payments: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
