"use client";
import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import dealerDashboardService from "../services/dealerDashboardService";

export const useDealerDashboardData = (historySearch?: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["dealer-dashboard", historySearch],
    async () => {
      const [overviewRes, kpisRes, historyRes, integrationsRes] = await Promise.all([
        dealerDashboardService.getOverview(),
        dealerDashboardService.getKpis(),
        dealerDashboardService.getHistory({
          page: 1,
          limit: 20,
          search: historySearch || undefined,
        }),
        dealerDashboardService.getIntegrations(),
      ]);

      return {
        overview: overviewRes.data,
        kpis: kpisRes.data,
        history: historyRes.data ?? [],
        integrations: integrationsRes.data,
      };
    },
    { revalidateOnFocus: false },
  );

  // `lastUpdated` no se persiste en el cache SWR (localStorage serializa Date
  // como string y rompe `.toLocaleTimeString`). Se trackea local al hook.
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  useEffect(() => {
    if (data) setLastUpdated(new Date());
  }, [data]);

  return {
    overview: data?.overview ?? null,
    kpis: data?.kpis ?? null,
    history: data?.history ?? [],
    integrations: data?.integrations ?? null,
    lastUpdated,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
