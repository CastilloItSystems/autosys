import apiClient from "../apiClient";
import { VehicleBrand } from "@/libs/interfaces/inventory";
import { VehicleBrandFormData } from "@/libs/zods/inventory/vehicleZod";

interface VehicleBrandResponse {
  msg: string;
  vehicleBrand: VehicleBrand;
}
const BASE_URL = "/vehicles/brands";

export const getVehicleBrand = async (id: string): Promise<VehicleBrand> => {
  const response = await apiClient.get(`${BASE_URL}/${id}`);
  return response.data;
};

export const getVehicleBrands = async (): Promise<{
  vehicleBrands: VehicleBrand[];
}> => {
  const response = await apiClient.get(BASE_URL);
  return response.data;
};

export const createVehicleBrand = async (
  data: VehicleBrandFormData
): Promise<VehicleBrandResponse> => {
  const response = await apiClient.post(BASE_URL, data);
  return response.data;
};

export const updateVehicleBrand = async (
  id: string,
  data: VehicleBrandFormData
): Promise<VehicleBrandResponse> => {
  const response = await apiClient.put(`${BASE_URL}/${id}`, data);
  return response.data;
};

export const deleteVehicleBrand = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};
