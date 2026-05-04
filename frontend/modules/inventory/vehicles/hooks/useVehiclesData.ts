"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { getVehicles } from "@/modules/inventory/vehicles/services/vehicleService";

export const useVehiclesData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "inventory-vehicles",
    () => getVehicles(),
    { revalidateOnFocus: false },
  );

  return {
    vehicles: Array.isArray(data) ? data : (data?.data ?? []),
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
