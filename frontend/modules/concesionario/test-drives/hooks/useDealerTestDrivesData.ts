"use client";
import { useCallback } from "react";
import useSWR from "swr";
import dealerTestDriveService from "../services/dealerTestDriveService";

type DealerTestDrivesParams = Parameters<typeof dealerTestDriveService.getAll>[0];

export const useDealerTestDrivesData = (params?: DealerTestDrivesParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["dealer-test-drives", params],
    () => dealerTestDriveService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    items: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
