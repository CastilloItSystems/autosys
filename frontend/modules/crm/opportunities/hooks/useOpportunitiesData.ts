"use client";
import { useCallback } from "react";
import useSWR from "swr";
import opportunityService from "../services/opportunityService";

type OpportunityParams = Parameters<typeof opportunityService.getAll>[0];

export const useOpportunitiesData = (params?: OpportunityParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["crm-opportunities", params],
    () => opportunityService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    opportunities: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useOpportunityDetailData = (id?: string | null) => {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ["crm-opportunity-detail", id] : null,
    () => opportunityService.getById(String(id)),
    { revalidateOnFocus: false },
  );

  return {
    opportunity: data?.data ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
