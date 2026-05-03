"use client";
import { useCallback } from "react";
import useSWR from "swr";
import dealerReservationService from "../services/dealerReservationService";

type DealerReservationsParams = Parameters<typeof dealerReservationService.getAll>[0];

export const useDealerReservationsData = (params?: DealerReservationsParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["dealer-reservations", params],
    () => dealerReservationService.getAll(params),
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
