"use client";
import { useCallback } from "react";
import useSWR from "swr";
import campaignService from "../services/campaignService";

type CampaignParams = Parameters<typeof campaignService.getAll>[0];

export const useCampaignsData = (params?: CampaignParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["crm-campaigns", params],
    () => campaignService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    campaigns: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
