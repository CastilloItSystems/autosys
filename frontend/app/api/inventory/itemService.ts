import apiClient from "../apiClient";

export const getItem = async (id: string) => {
  const response = await apiClient.get(`/inventory/items/${id}`);
  return response.data;
};

export const getItems = async () => {
  const response = await apiClient.get("/inventory/items");
  return response.data;
};

export const createItem = async (data: any) => {
  const response = await apiClient.post("/inventory/items", data);
  return response.data;
};

export const updateItem = async (id: string, data: any) => {
  const response = await apiClient.put(`/inventory/items/${id}`, data);
  return response.data;
};

export const deleteItem = async (id: string) => {
  const response = await apiClient.delete(`/inventory/items/${id}`);
  return response.data;
};

// Búsqueda de items
export const searchItems = async (query: string) => {
  const response = await apiClient.get(`/inventory/items/search?q=${query}`);
  return response.data;
};

// Obtener items por categoría
export const getItemsByCategory = async (categoria: string) => {
  const response = await apiClient.get(
    `/inventory/items/category/${categoria}`
  );
  return response.data;
};

// Obtener items con stock bajo
export const getLowStockItems = async () => {
  const response = await apiClient.get("/inventory/items/low-stock");
  return response.data;
};
