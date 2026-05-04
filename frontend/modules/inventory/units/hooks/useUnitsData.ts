"use client";

import { useCallback } from "react";
import useSWR from "swr";
import unitsService from "@/modules/inventory/units/services/unitService";

type UnitParams = Parameters<typeof unitsService.getAll>[0];

export const useUnitsData = (params?: UnitParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-units", params],
    () => unitsService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    units: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
