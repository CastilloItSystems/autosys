"use client";

import { useCallback } from "react";
import useSWR from "swr";
import categoriesService from "@/modules/inventory/categories/services/categoryService";

type CategoryParams = Parameters<typeof categoriesService.getAll>[0];

export const useCategoriesData = (params?: CategoryParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-categories", params],
    () => categoriesService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    categories: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
