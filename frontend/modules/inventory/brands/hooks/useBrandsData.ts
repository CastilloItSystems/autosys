"use client";

import { useCallback } from "react";
import useSWR from "swr";
import brandsService from "@/modules/inventory/brands/services/brandService";

type BrandParams = Parameters<typeof brandsService.getAll>[0];

export const useBrandsData = (params?: BrandParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-brands", params],
    () => brandsService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    brands: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
