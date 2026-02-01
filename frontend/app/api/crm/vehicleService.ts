import apiClient from "../apiClient";
import { Vehicle } from "@/libs/interfaces/inventory";
import { VehicleFormData } from "@/libs/zods/inventory/vehicleZod";

interface VehicleResponse {
  msg: string;
  vehicle: Vehicle;
}

const BASE_URL = "/vehicles";

export const getVehicle = async (id: string): Promise<Vehicle> => {
  const response = await apiClient.get(`${BASE_URL}/${id}`);
  return response.data;
};

export const getVehicles = async (): Promise<{ vehicles: Vehicle[] }> => {
  const response = await apiClient.get(BASE_URL);
  return response.data;
};

export const getVehicleByPlaca = async (placa: string): Promise<Vehicle> => {
  const response = await apiClient.get(`${BASE_URL}/placa/${placa}`);
  return response.data;
};

export const getVehicleByVin = async (vin: string): Promise<Vehicle> => {
  const response = await apiClient.get(`${BASE_URL}/vin/${vin}`);
  return response.data;
};

export const createVehicle = async (
  data: VehicleFormData
): Promise<VehicleResponse> => {
  const response = await apiClient.post(BASE_URL, data);
  return response.data;
};

export const updateVehicle = async (
  id: string,
  data: VehicleFormData
): Promise<VehicleResponse> => {
  const response = await apiClient.put(`${BASE_URL}/${id}`, data);
  return response.data;
};

export const deleteVehicle = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};
