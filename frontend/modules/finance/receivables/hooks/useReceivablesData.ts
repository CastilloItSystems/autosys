"use client";

import { useCallback } from "react";
import useSWR from "swr";
import receivablesService from "../services/receivablesService";

export const useReceivablesData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "finance-receivables",
    () => receivablesService.getReceivables(),
    { revalidateOnFocus: false },
  );

  return {
    data: data ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
