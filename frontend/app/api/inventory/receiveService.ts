import apiClient from "../apiClient";

// ===== CRUD =====

export const getReceives = async (params?: {
  page?: number;
  limit?: number;
  purchaseOrderId?: string;
  warehouseId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) => {
  const response = await apiClient.get("/inventory/receives", { params });
  return response.data;
};

export const getReceive = async (id: string) => {
  const response = await apiClient.get(`/inventory/receives/${id}`);
  return response.data;
};

export const deleteReceive = async (id: string) => {
  const response = await apiClient.delete(`/inventory/receives/${id}`);
  return response.data;
};

export const getReceiveItems = async (receiveId: string) => {
  const response = await apiClient.get(
    `/inventory/receives/${receiveId}/items`,
  );
  return response.data;
};
