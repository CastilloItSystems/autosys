"use client";

import { useCallback } from "react";
import useSWR from "swr";
import itemModelService from "@/modules/inventory/itemModels/services/itemModelService";

export const useItemModelsData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "inventory-item-models",
    () => itemModelService.getAll(),
    { revalidateOnFocus: false },
  );

  return {
    itemModels: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
