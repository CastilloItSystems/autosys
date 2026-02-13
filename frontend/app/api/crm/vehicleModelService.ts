import apiClient from "../apiClient";
import { Model } from "@/libs/interfaces/inventory";
import { ModelFormData } from "@/libs/zods/inventory/vehicleZod";

interface ModelResponse {
  msg: string;
  model: Model;
}

const BASE_URL = "/vehicles/models";

export const getModel = async (id: string): Promise<Model> => {
  const response = await apiClient.get(`${BASE_URL}/${id}`);
  return response.data;
};

export const getModels = async (): Promise<{
  msg: string;
  models: Model[];
}> => {
  const response = await apiClient.get(BASE_URL);
  return response.data;
};

export const createModel = async (
  data: ModelFormData,
): Promise<ModelResponse> => {
  const response = await apiClient.post(BASE_URL, data);
  return response.data;
};

export const updateModel = async (
  id: string,
  data: ModelFormData,
): Promise<ModelResponse> => {
  const response = await apiClient.put(`${BASE_URL}/${id}`, data);
  return response.data;
};

export const deleteModel = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};
