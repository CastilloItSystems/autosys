"use client";
import { useCallback } from "react";
import useSWR from "swr";
import dealerPolicyService from "../services/dealerPolicyService";

export const useDealerPolicyData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    ["dealer-policy"],
    () => dealerPolicyService.get(),
    { revalidateOnFocus: false },
  );

  return {
    policy: data?.data ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
