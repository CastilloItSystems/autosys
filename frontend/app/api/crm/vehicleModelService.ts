import apiClient from "../apiClient";
import { VehicleModel } from "@/libs/interfaces/inventory";
import { VehicleModelFormData } from "@/libs/zods/inventory/vehicleZod";

interface VehicleModelResponse {
  msg: string;
  vehicleModel: VehicleModel;
}

const BASE_URL = "/vehicles/models";

export const getVehicleModel = async (id: string): Promise<VehicleModel> => {
  const response = await apiClient.get(`${BASE_URL}/${id}`);
  return response.data;
};

export const getVehicleModels = async (): Promise<{
  vehicleModels: VehicleModel[];
}> => {
  const response = await apiClient.get(BASE_URL);
  return response.data;
};

export const createVehicleModel = async (
  data: VehicleModelFormData
): Promise<VehicleModelResponse> => {
  const response = await apiClient.post(BASE_URL, data);
  return response.data;
};

export const updateVehicleModel = async (
  id: string,
  data: VehicleModelFormData
): Promise<VehicleModelResponse> => {
  const response = await apiClient.put(`${BASE_URL}/${id}`, data);
  return response.data;
};

export const deleteVehicleModel = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};
