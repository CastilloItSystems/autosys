import apiClient from "@/app/api/apiClient";
import { VehicleBrand } from "@/modules/inventory/vehicles/interfaces/vehicle.interface";
import { VehicleBrandFormData } from "@/modules/inventory/vehicles/schemas/vehicleZod";

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
  data: VehicleBrandFormData,
): Promise<VehicleBrandResponse> => {
  const response = await apiClient.post(BASE_URL, data);
  return response.data;
};

export const updateVehicleBrand = async (
  id: string,
  data: VehicleBrandFormData,
): Promise<VehicleBrandResponse> => {
  const response = await apiClient.put(`${BASE_URL}/${id}`, data);
  return response.data;
};

export const deleteVehicleBrand = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};
