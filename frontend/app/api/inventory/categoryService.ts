import apiClient from "../apiClient";

export const getCategory = async (id: string) => {
  const response = await apiClient.get(`/inventory/categories/${id}`);
  return response.data;
};

export const getCategories = async () => {
  const response = await apiClient.get("/inventory/categories");
  return response.data;
};

export const createCategory = async (data: any) => {
  const response = await apiClient.post("/inventory/categories", data);
  return response.data;
};

export const updateCategory = async (id: string, data: any) => {
  const response = await apiClient.put(`/inventory/categories/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id: string) => {
  const response = await apiClient.delete(`/inventory/categories/${id}`);
  return response.data;
};
