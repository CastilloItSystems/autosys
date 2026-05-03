"use client";
import { useCallback } from "react";
import useSWR from "swr";
import activityService from "../services/activityService";

type ActivityParams = Parameters<typeof activityService.getAll>[0];

export const useActivitiesData = (params?: ActivityParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["crm-activities", params],
    () => activityService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    activities: data?.data ?? [],
    total: data?.meta?.total ?? data?.data?.length ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
