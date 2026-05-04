"use client";

import { useCallback } from "react";
import useSWR from "swr";
import serviceTypeService from "@/modules/workshop/serviceTypes/services/serviceTypeService";

type ServiceTypeFilters = Parameters<typeof serviceTypeService.getAll>[0];

export const useServiceTypesData = (filters?: ServiceTypeFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["workshop-service-types", filters],
    () => serviceTypeService.getAll(filters),
    { revalidateOnFocus: false },
  );

  return {
    serviceTypes: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
