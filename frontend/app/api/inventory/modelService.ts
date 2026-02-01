import apiClient from "../apiClient";

export const getModel = async (id: string) => {
  const response = await apiClient.get(`/inventory/models/${id}`);
  return response.data;
};

export const getModels = async () => {
  const response = await apiClient.get("/inventory/models");
  return response.data;
};

export const createModel = async (data: any) => {
  const response = await apiClient.post("/inventory/models", data);
  return response.data;
};

export const updateModel = async (id: string, data: any) => {
  const response = await apiClient.put(`/inventory/models/${id}`, data);
  return response.data;
};

export const deleteModel = async (id: string) => {
  const response = await apiClient.delete(`/inventory/models/${id}`);
  return response.data;
};

// Búsqueda de models
export const searchModels = async (query: string) => {
  const response = await apiClient.get(`/inventory/models/search?q=${query}`);
  return response.data;
};

// Obtener models por brand
export const getModelsByBrand = async (brandId: string) => {
  const response = await apiClient.get(`/inventory/models/brand/${brandId}`);
  return response.data;
};
