"use client";

import { useCallback } from "react";
import useSWR from "swr";
import dashboardService from "@/modules/workshop/dashboard/services/dashboardService";

export const useWorkshopDashboardData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "workshop-dashboard",
    () => dashboardService.getDashboard(),
    { revalidateOnFocus: false },
  );

  return {
    dashboard: data?.data ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
