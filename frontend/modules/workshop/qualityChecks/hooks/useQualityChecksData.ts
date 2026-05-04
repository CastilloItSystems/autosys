"use client";

import { useCallback } from "react";
import useSWR from "swr";
import qualityCheckService from "@/modules/workshop/qualityChecks/services/qualityCheckService";

type QualityCheckParams = Parameters<typeof qualityCheckService.getAll>[0];

export const useQualityChecksData = (params?: QualityCheckParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["workshop-quality-checks", params],
    () => qualityCheckService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    qualityChecks: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
