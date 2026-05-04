"use client";

import { useCallback } from "react";
import useSWR from "swr";
import modelService from "@/modules/inventory/models/services/modelService";

type ModelParams = Parameters<typeof modelService.getAll>[0];

export const useModelsData = (params?: ModelParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-models", params],
    () => modelService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    models: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
