"use client";
import { useCallback } from "react";
import useSWR from "swr";
import dealerApprovalService from "../services/dealerApprovalService";

type DealerApprovalsParams = Parameters<typeof dealerApprovalService.getAll>[0];

export const useDealerApprovalsData = (params?: DealerApprovalsParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["dealer-approvals", params],
    () => dealerApprovalService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    items: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
