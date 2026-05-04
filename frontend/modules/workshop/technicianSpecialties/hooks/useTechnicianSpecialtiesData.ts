"use client";

import { useCallback } from "react";
import useSWR from "swr";
import technicianSpecialtyService from "@/modules/workshop/technicianSpecialties/services/technicianSpecialtyService";

type SpecialtyFilters = Parameters<typeof technicianSpecialtyService.getAll>[0];

export const useTechnicianSpecialtiesData = (filters?: SpecialtyFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["workshop-technician-specialties", filters],
    () => technicianSpecialtyService.getAll(filters),
    { revalidateOnFocus: false },
  );

  return {
    specialties: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
