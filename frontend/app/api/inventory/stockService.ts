import apiClient from "../apiClient";

export const getStock = async (id: string) => {
  const response = await apiClient.get(`/inventory/stock/${id}`);
  return response.data;
};

export const getStocks = async () => {
  const response = await apiClient.get("/inventory/stock");
  return response.data;
};

export const createStock = async (data: any) => {
  const response = await apiClient.post("/inventory/stock", data);
  return response.data;
};

export const updateStock = async (id: string, data: any) => {
  const response = await apiClient.put(`/inventory/stock/${id}`, data);
  return response.data;
};

export const deleteStock = async (id: string) => {
  const response = await apiClient.delete(`/inventory/stock/${id}`);
  return response.data;
};

// Obtener stock por almacén
export const getStockByWarehouse = async (warehouseId: string) => {
  const response = await apiClient.get(
    `/inventory/stock/warehouse/${warehouseId}`
  );
  return response.data;
};

// Obtener stock por item
export const getStockByItem = async (itemId: string) => {
  const response = await apiClient.get(`/inventory/stock/item/${itemId}`);
  return response.data;
};

// Verificar disponibilidad de stock
export const checkStockAvailability = async (
  itemId: string,
  warehouseId: string,
  cantidad: number
) => {
  const response = await apiClient.post("/inventory/stock/check-availability", {
    itemId,
    warehouseId,
    cantidad,
  });
  return response.data;
};
