"use client";

import { useCallback } from "react";
import useSWR from "swr";
import reportService from "@/modules/workshop/reports/services/reportService";

type ReportFilters = Parameters<typeof reportService.getAll>[0];

export const useWorkshopReportsData = (filters?: ReportFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["workshop-reports", filters],
    () => reportService.getAll(filters),
    { revalidateOnFocus: false },
  );

  return {
    reports: data?.data ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
