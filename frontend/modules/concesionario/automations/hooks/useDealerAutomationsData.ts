"use client";
import { useCallback } from "react";
import useSWR from "swr";
import dealerAutomationService from "../services/dealerAutomationService";

export const useDealerAutomationsData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "dealer-automation-alerts",
    () => dealerAutomationService.getAlerts(),
    { revalidateOnFocus: false },
  );

  return {
    alerts: data?.data ?? [],
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
