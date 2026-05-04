"use client";

import { useCallback } from "react";
import useSWR from "swr";
import ingressMotiveService from "@/modules/workshop/ingressMotives/services/ingressMotiveService";

type IngressMotiveFilters = Parameters<typeof ingressMotiveService.getAll>[0];

export const useIngressMotivesData = (filters?: IngressMotiveFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["workshop-ingress-motives", filters],
    () => ingressMotiveService.getAll(filters),
    { revalidateOnFocus: false },
  );

  return {
    ingressMotives: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
