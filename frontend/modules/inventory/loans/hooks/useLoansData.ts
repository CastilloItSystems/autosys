"use client";

import { useCallback } from "react";
import useSWR from "swr";
import loanService, {
  LoanStatus,
} from "@/modules/inventory/loans/services/loanService";

interface LoanFilters {
  status?: LoanStatus;
  borrowerName?: string;
  warehouseId?: string;
}

export const useLoansData = (
  page = 1,
  limit = 20,
  filters?: LoanFilters,
) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-loans", page, limit, filters],
    () => loanService.getAll(page, limit, filters),
    { revalidateOnFocus: false },
  );

  return {
    loans: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
