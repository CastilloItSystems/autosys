"use client";

import { useCallback } from "react";
import useSWR from "swr";
import reservationService from "@/modules/inventory/reservations/services/reservationService";
import type { ReservationStatus } from "@/modules/inventory/reservations/interfaces/reservation.interface";

export const useReservationsData = (
  page = 1,
  limit = 20,
  status?: ReservationStatus,
  itemId?: string,
  warehouseId?: string,
) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-reservations", page, limit, status, itemId, warehouseId],
    () => reservationService.getAll(page, limit, status, itemId, warehouseId),
    { revalidateOnFocus: false },
  );

  return {
    reservations: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
