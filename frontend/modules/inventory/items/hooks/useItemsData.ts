"use client";

import { useCallback } from "react";
import useSWR from "swr";
import itemService from "@/modules/inventory/items/services/itemService";

type ItemParams = Parameters<typeof itemService.getAll>[0];

export const useItemsData = (params?: ItemParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-items", params],
    () => itemService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    items: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
