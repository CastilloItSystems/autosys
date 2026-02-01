import apiClient from "../apiClient";

export const getSalesOrder = async (id: string) => {
  const response = await apiClient.get(`/inventory/salesOrder/${id}`);
  return response.data;
};

export const getSalesOrders = async () => {
  const response = await apiClient.get("/inventory/salesOrder");
  return response.data;
};

export const createSalesOrder = async (data: any) => {
  const response = await apiClient.post("/inventory/salesOrder", data);
  return response.data;
};

export const updateSalesOrder = async (id: string, data: any) => {
  const response = await apiClient.put(`/inventory/salesOrder/${id}`, data);
  return response.data;
};

export const deleteSalesOrder = async (id: string) => {
  const response = await apiClient.delete(`/inventory/salesOrder/${id}`);
  return response.data;
};

// Confirmar orden (crea reservas)
export const confirmSalesOrder = async (
  id: string,
  warehouse: string,
  idempotencyKey?: string
) => {
  const response = await apiClient.post(`/inventory/salesOrder/${id}/confirm`, {
    warehouse,
    idempotencyKey,
  });
  return response.data;
};

// Despachar orden (completa o parcial)
export const shipSalesOrder = async (
  id: string,
  items?: { item: string; cantidad: number }[],
  idempotencyKey?: string
) => {
  const payload: any = { idempotencyKey };
  if (items && items.length > 0) {
    payload.items = items;
  }
  const response = await apiClient.post(
    `/inventory/salesOrder/${id}/ship`,
    payload
  );
  return response.data;
};

// Cancelar orden
export const cancelSalesOrder = async (id: string, idempotencyKey?: string) => {
  const response = await apiClient.post(`/inventory/salesOrder/${id}/cancel`, {
    idempotencyKey,
  });
  return response.data;
};
