"use client";

import { useCallback } from "react";
import useSWR from "swr";
import salesReportService from "../services/reportService";

export const useSalesDashboardData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "sales-dashboard",
    () => salesReportService.getDashboard(),
    { revalidateOnFocus: false },
  );

  return {
    data: data ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
