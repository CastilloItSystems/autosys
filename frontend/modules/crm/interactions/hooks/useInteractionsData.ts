"use client";
import { useCallback } from "react";
import useSWR from "swr";
import interactionService from "../services/interactionService";

type InteractionParams = Parameters<typeof interactionService.getAll>[0];

export const useInteractionsData = (params?: InteractionParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["crm-interactions", params],
    () => interactionService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    interactions: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
