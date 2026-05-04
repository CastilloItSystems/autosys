"use client";

import { useCallback } from "react";
import useSWR from "swr";
import appointmentService from "@/modules/workshop/appointments/services/appointmentService";

type AppointmentFilters = Parameters<typeof appointmentService.getAll>[0];

export const useAppointmentsData = (filters?: AppointmentFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["workshop-appointments", filters],
    () => appointmentService.getAll(filters),
    { revalidateOnFocus: false },
  );

  return {
    appointments: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
