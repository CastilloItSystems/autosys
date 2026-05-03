"use client";
import { useCallback } from "react";
import useSWR from "swr";
import brandsService from "@/modules/inventory/brands/services/brandService";
import modelsService from "@/modules/inventory/models/services/modelService";
import warehouseService from "@/modules/inventory/warehouses/services/warehouseService";
import dealerUnitService, {
  GetDealerUnitsParams,
} from "../services/dealerUnitService";
import type { DealerUnit } from "../interfaces/dealerUnit.interface";

const DEFAULT_UNIT_OPTIONS_PARAMS: GetDealerUnitsParams = {
  page: 1,
  limit: 300,
  isActive: "true",
};

export const useDealerUnitsData = (params?: GetDealerUnitsParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["dealer-units", params],
    () => dealerUnitService.getAll(params),
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

export const useDealerUnitOptionsData = (
  params: GetDealerUnitsParams = DEFAULT_UNIT_OPTIONS_PARAMS,
) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["dealer-unit-options", params],
    () => dealerUnitService.getAll(params),
    { revalidateOnFocus: false },
  );

  const units = (data?.data ?? []) as DealerUnit[];

  return {
    units,
    unitOptions: units.map((unit) => ({
      label: `${unit.code || unit.vin || unit.id} - ${
        unit.brand?.name || "Unidad"
      }`,
      value: unit.id,
    })),
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useDealerUnitCatalogOptionsData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "dealer-unit-catalog-options",
    async () => {
      const [brandsRes, modelsRes, warehousesRes] = await Promise.all([
        brandsService.getActive(),
        modelsService.getActive("VEHICLE"),
        warehouseService.getAll({ page: 1, limit: 200, isActive: "true" }),
      ]);

      const brands = Array.isArray(brandsRes.data)
        ? brandsRes.data.filter(
            (brand) => brand.type === "VEHICLE" || brand.type === "BOTH",
          )
        : [];
      const models = Array.isArray(modelsRes.data) ? modelsRes.data : [];
      const warehouses = Array.isArray(warehousesRes.data)
        ? warehousesRes.data
        : [];

      return {
        brandOptions: brands.map((brand) => ({
          label: brand.code ? `${brand.code} - ${brand.name}` : brand.name,
          value: brand.id,
        })),
        modelOptions: models.map((model) => ({
          label: `${model.name}${model.year ? ` (${model.year})` : ""}`,
          value: model.id,
        })),
        warehouseOptions: warehouses.map((warehouse) => ({
          label: `${warehouse.code} - ${warehouse.name}`,
          value: warehouse.id,
        })),
      };
    },
    { revalidateOnFocus: false },
  );

  return {
    brandOptions: data?.brandOptions ?? [],
    modelOptions: data?.modelOptions ?? [],
    warehouseOptions: data?.warehouseOptions ?? [],
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
