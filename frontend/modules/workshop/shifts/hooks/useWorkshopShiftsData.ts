"use client";

import { useCallback } from "react";
import useSWR from "swr";
import workshopShiftService from "@/modules/workshop/shifts/services/workshopShiftService";

type ShiftFilters = Parameters<typeof workshopShiftService.getAll>[0];

export const useWorkshopShiftsData = (filters?: ShiftFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["workshop-shifts", filters],
    () => workshopShiftService.getAll(filters),
    { revalidateOnFocus: false },
  );

  return {
    shifts: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
