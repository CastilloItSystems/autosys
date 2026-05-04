"use client";

import { useCallback } from "react";
import useSWR from "swr";
import diagnosisService from "@/modules/workshop/diagnoses/services/diagnosisService";

type DiagnosisFilters = Parameters<typeof diagnosisService.getAll>[0];

export const useDiagnosesData = (filters?: DiagnosisFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["workshop-diagnoses", filters],
    () => diagnosisService.getAll(filters),
    { revalidateOnFocus: false },
  );

  return {
    diagnoses: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
