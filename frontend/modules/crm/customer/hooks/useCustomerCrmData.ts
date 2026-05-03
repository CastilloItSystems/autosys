"use client";
import { useCallback } from "react";
import useSWR from "swr";
import brandsService from "@/modules/inventory/brands/services/brandService";
import modelsService from "@/modules/inventory/models/services/modelService";
import customerCrmService from "../services/customerCrmService";
import customerVehicleService from "../services/customerVehicleService";

type CustomerCrmParams = Parameters<typeof customerCrmService.getAll>[0];
type CustomerVehicleParams = Parameters<
  typeof customerVehicleService.getAllByCustomer
>[1];

export const useCustomerCrmData = (params?: CustomerCrmParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["crm-customers", params],
    () => customerCrmService.getAll(params),
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

export const useCustomerOptionsData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "crm-customer-options",
    () => customerCrmService.getActive(),
    { revalidateOnFocus: false },
  );

  const customers = data?.data ?? [];

  return {
    customers,
    customerOptions: customers.map((customer) => ({
      label: `${customer.name} (${customer.code})`,
      value: customer.id,
    })),
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useCustomerDetailData = (customerId?: string | null) => {
  const { data, error, isLoading, mutate } = useSWR(
    customerId ? ["crm-customer-detail", customerId] : null,
    () => customerCrmService.getById(String(customerId)),
    { revalidateOnFocus: false },
  );

  return {
    customer: data?.data ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useCustomerTimelineData = (customerId?: string | null) => {
  const { data, error, isLoading, mutate } = useSWR(
    customerId ? ["crm-customer-timeline", customerId] : null,
    () => customerCrmService.getTimeline(String(customerId)),
    { revalidateOnFocus: false },
  );

  return {
    timeline: data?.data ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useCustomerVehiclesData = (
  customerId?: string | null,
  params?: CustomerVehicleParams,
) => {
  const { data, error, isLoading, mutate } = useSWR(
    customerId ? ["crm-customer-vehicles", customerId, params] : null,
    () => customerVehicleService.getAllByCustomer(String(customerId), params),
    { revalidateOnFocus: false },
  );

  return {
    vehicles: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useCustomerVehicleCatalogOptionsData = (
  brandId?: string | null,
) => {
  const brandsRequest = useSWR(
    "crm-customer-vehicle-brands",
    () => brandsService.getActive("VEHICLE"),
    { revalidateOnFocus: false },
  );
  const modelsRequest = useSWR(
    "crm-customer-vehicle-models",
    () => modelsService.getActive("VEHICLE"),
    { revalidateOnFocus: false },
  );

  const brands = brandsRequest.data?.data ?? [];
  const models = modelsRequest.data?.data ?? [];

  return {
    brands,
    models: brandId ? models.filter((model) => model.brandId === brandId) : [],
    loading: brandsRequest.isLoading || modelsRequest.isLoading,
    error: brandsRequest.error || modelsRequest.error,
    mutate: useCallback(
      () => Promise.all([brandsRequest.mutate(), modelsRequest.mutate()]),
      [brandsRequest, modelsRequest],
    ),
  };
};

export const useCustomerVehicleServiceHistoryData = (
  customerId?: string | null,
  vehicleId?: string | null,
) => {
  const { data, error, isLoading, mutate } = useSWR(
    customerId && vehicleId
      ? ["crm-customer-vehicle-service-history", customerId, vehicleId]
      : null,
    () =>
      customerVehicleService.getServiceHistory(
        String(customerId),
        String(vehicleId),
      ),
    { revalidateOnFocus: false },
  );

  return {
    serviceHistory: data?.data?.serviceOrders ?? [],
    vehicle: data?.data?.vehicle ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
