"use client";
import { useCallback } from "react";
import useSWR from "swr";
import dealerReportService from "../services/dealerReportService";

export const useDealerReportsData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "dealer-reports",
    async () => {
      const [executiveRes, pipelineRes] = await Promise.all([
        dealerReportService.getExecutive(),
        dealerReportService.getPipeline(),
      ]);

      return {
        executive: executiveRes.data,
        pipeline: pipelineRes.data,
      };
    },
    { revalidateOnFocus: false },
  );

  return {
    executive: data?.executive ?? null,
    pipeline: data?.pipeline ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
