"use client";

import { useCallback } from "react";
import useSWR from "swr";
import additionalService from "@/modules/workshop/additionals/services/additionalService";

type AdditionalFilters = Parameters<typeof additionalService.getAll>[0];

export const useAdditionalsData = (filters?: AdditionalFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["workshop-additionals", filters],
    () => additionalService.getAll(filters),
    { revalidateOnFocus: false },
  );

  return {
    additionals: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
