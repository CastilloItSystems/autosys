"use client";

import { useCallback } from "react";
import useSWR from "swr";
import customerService from "../services/customerService";

type SalesCustomerParams = Parameters<typeof customerService.getAll>[0];

export const useSalesCustomersData = (params?: SalesCustomerParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["sales-customers", params],
    () => customerService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    customers: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useActiveSalesCustomersData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "sales-active-customers",
    () => customerService.getActive(),
    { revalidateOnFocus: false },
  );

  const customers = data?.data ?? [];

  return {
    customers,
    customerOptions: customers.map((customer) => ({
      label: customer.code
        ? `${customer.code} - ${customer.name}`
        : customer.name,
      value: customer.id,
    })),
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
