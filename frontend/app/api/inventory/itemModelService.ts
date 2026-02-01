import apiClient from "../apiClient";

export const getItemModel = async (id: string) => {
  const response = await apiClient.get(`/inventory/models/${id}`);
  return response.data;
};

export const getItemModels = async () => {
  const response = await apiClient.get("/inventory/models");
  return response.data;
};

export const createItemModel = async (data: any) => {
  const response = await apiClient.post("/inventory/models", data);
  return response.data;
};

export const updateItemModel = async (id: string, data: any) => {
  const response = await apiClient.put(`/inventory/models/${id}`, data);
  return response.data;
};

export const deleteItemModel = async (id: string) => {
  const response = await apiClient.delete(`/inventory/models/${id}`);
  return response.data;
};
