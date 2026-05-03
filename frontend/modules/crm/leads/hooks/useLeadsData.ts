"use client";
import { useCallback } from "react";
import useSWR from "swr";
import leadService from "../services/leadService";
import type { Lead } from "../interfaces/lead.interface";

type LeadParams = Parameters<typeof leadService.getAll>[0];

export const useLeadsData = (params?: LeadParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["crm-leads", params],
    () => leadService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    leads: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useLeadKanbanData = (params?: LeadParams) => {
  const data = useLeadsData(params);

  return {
    ...data,
    leads: data.leads.filter(
      (lead: Lead) => !["WON", "LOST"].includes(lead.status as string),
    ),
  };
};
