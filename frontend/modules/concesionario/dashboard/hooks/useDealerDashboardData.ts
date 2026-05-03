"use client";
import { useCallback } from "react";
import useSWR from "swr";
import dealerDashboardService from "../services/dealerDashboardService";

export const useDealerDashboardData = (historySearch?: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["dealer-dashboard", historySearch],
    async () => {
      const [overviewRes, historyRes, integrationsRes] = await Promise.all([
        dealerDashboardService.getOverview(),
        dealerDashboardService.getHistory({
          page: 1,
          limit: 20,
          search: historySearch || undefined,
        }),
        dealerDashboardService.getIntegrations(),
      ]);

      return {
        overview: overviewRes.data,
        history: historyRes.data ?? [],
        integrations: integrationsRes.data,
        lastUpdated: new Date(),
      };
    },
    { revalidateOnFocus: false },
  );

  return {
    overview: data?.overview ?? null,
    history: data?.history ?? [],
    integrations: data?.integrations ?? null,
    lastUpdated: data?.lastUpdated ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
