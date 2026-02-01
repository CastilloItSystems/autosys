import apiClient from "../apiClient";

export const getBrand = async (id: string) => {
  const response = await apiClient.get(`/inventory/brands/${id}`);
  return response.data;
};

export const getBrands = async () => {
  const response = await apiClient.get("/inventory/brands");
  return response.data;
};

export const createBrand = async (data: any) => {
  const response = await apiClient.post("/inventory/brands", data);
  return response.data;
};

export const updateBrand = async (id: string, data: any) => {
  const response = await apiClient.put(`/inventory/brands/${id}`, data);
  return response.data;
};

export const deleteBrand = async (id: string) => {
  const response = await apiClient.delete(`/inventory/brands/${id}`);
  return response.data;
};

// Búsqueda de brands
export const searchBrands = async (query: string) => {
  const response = await apiClient.get(`/inventory/brands/search?q=${query}`);
  return response.data;
};
