"use client";

import { useCallback } from "react";
import useSWR from "swr";
import cashFlowService from "../services/cashFlowService";

type CashTransactionsParams = Parameters<typeof cashFlowService.getAll>[0];
type CashFlowSummaryParams = Parameters<typeof cashFlowService.getSummary>[0];

export const useCashTransactionsData = (params?: CashTransactionsParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["finance-cash-transactions", params],
    () => cashFlowService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    transactions: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useCashFlowSummaryData = (params?: CashFlowSummaryParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["finance-cash-flow-summary", params],
    () => cashFlowService.getSummary(params),
    { revalidateOnFocus: false },
  );

  return {
    summary: data?.data ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useCashFlowData = (
  transactionsParams?: CashTransactionsParams,
  summaryParams?: CashFlowSummaryParams,
) => {
  const transactionsRequest = useSWR(
    ["finance-cash-flow-transactions", transactionsParams],
    () => cashFlowService.getAll(transactionsParams),
    { revalidateOnFocus: false },
  );
  const summaryRequest = useSWR(
    ["finance-cash-flow-summary-combined", summaryParams],
    () => cashFlowService.getSummary(summaryParams),
    { revalidateOnFocus: false },
  );

  return {
    transactions: transactionsRequest.data?.data ?? [],
    total: transactionsRequest.data?.meta?.total ?? 0,
    summary: summaryRequest.data?.data ?? null,
    loading: transactionsRequest.isLoading || summaryRequest.isLoading,
    error: transactionsRequest.error || summaryRequest.error,
    mutate: useCallback(
      () => Promise.all([transactionsRequest.mutate(), summaryRequest.mutate()]),
      [transactionsRequest, summaryRequest],
    ),
  };
};
