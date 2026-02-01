import apiClient from "../apiClient";

export const getPurchaseOrder = async (id: string) => {
  const response = await apiClient.get(`/inventory/purchaseOrders/${id}`);
  return response.data;
};

export const getPurchaseOrders = async () => {
  const response = await apiClient.get("/inventory/purchaseOrders");
  return response.data;
};

export const createPurchaseOrder = async (data: any) => {
  const response = await apiClient.post("/inventory/purchaseOrders", data);
  return response.data;
};

export const updatePurchaseOrder = async (id: string, data: any) => {
  const response = await apiClient.put(`/inventory/purchaseOrders/${id}`, data);
  return response.data;
};

export const deletePurchaseOrder = async (id: string) => {
  const response = await apiClient.delete(`/inventory/purchaseOrders/${id}`);
  return response.data;
};

// Obtener órdenes por estado
export const getPurchaseOrdersByStatus = async (
  estado: "pendiente" | "parcial" | "recibido" | "cancelado"
) => {
  const response = await apiClient.get(
    `/inventory/purchaseOrders/status/${estado}`
  );
  return response.data;
};

// Obtener órdenes por proveedor
export const getPurchaseOrdersBySupplier = async (supplierId: string) => {
  const response = await apiClient.get(
    `/inventory/purchaseOrders/supplier/${supplierId}`
  );
  return response.data;
};

// Recibir orden de compra (parcial o total)
export const receivePurchaseOrder = async (
  id: string,
  warehouse: string,
  items: { item: string; cantidad: number; costoUnitario?: number }[],
  idempotencyKey?: string
) => {
  const response = await apiClient.post(
    `/inventory/purchaseOrders/${id}/receive`,
    { warehouse, items, idempotencyKey }
  );
  return response.data;
};

// Cancelar orden de compra
export const cancelPurchaseOrder = async (id: string) => {
  const response = await apiClient.post(
    `/inventory/purchaseOrders/${id}/cancel`
  );
  return response.data;
};

// Obtener órdenes pendientes
export const getPendingPurchaseOrders = async () => {
  const response = await apiClient.get("/inventory/purchaseOrders/pending");
  return response.data;
};
