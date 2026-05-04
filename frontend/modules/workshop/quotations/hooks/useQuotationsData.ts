"use client";

import { useCallback } from "react";
import useSWR from "swr";
import quotationService from "@/modules/workshop/quotations/services/quotationService";

type QuotationFilters = Parameters<typeof quotationService.getAll>[0];

export const useQuotationsData = (filters?: QuotationFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["workshop-quotations", filters],
    () => quotationService.getAll(filters),
    { revalidateOnFocus: false },
  );

  return {
    quotations: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
