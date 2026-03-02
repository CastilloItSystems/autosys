import apiClient from "../apiClient";
import type { PurchaseOrderStatus } from "@/libs/interfaces/inventory";

// ===== CRUD =====

export const getPurchaseOrders = async (params?: {
  page?: number;
  limit?: number;
  status?: PurchaseOrderStatus;
  supplierId?: string;
  warehouseId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) => {
  const response = await apiClient.get("/inventory/purchase-orders", {
    params,
  });
  return response.data;
};

export const getPurchaseOrder = async (id: string) => {
  const response = await apiClient.get(`/inventory/purchase-orders/${id}`);
  return response.data;
};

export const createPurchaseOrder = async (data: {
  supplierId: string;
  warehouseId: string;
  notes?: string;
  expectedDate?: string;
  items?: { itemId: string; quantityOrdered: number; unitCost: number }[];
}) => {
  const response = await apiClient.post("/inventory/purchase-orders", data);
  return response.data;
};

export const updatePurchaseOrder = async (
  id: string,
  data: {
    status?: PurchaseOrderStatus;
    notes?: string | null;
    expectedDate?: string | null;
  },
) => {
  const response = await apiClient.put(
    `/inventory/purchase-orders/${id}`,
    data,
  );
  return response.data;
};

export const deletePurchaseOrder = async (id: string) => {
  const response = await apiClient.delete(`/inventory/purchase-orders/${id}`);
  return response.data;
};

// ===== Acciones de flujo =====

export const approvePurchaseOrder = async (id: string, approvedBy?: string) => {
  const response = await apiClient.patch(
    `/inventory/purchase-orders/${id}/approve`,
    { approvedBy },
  );
  return response.data;
};

export const cancelPurchaseOrder = async (id: string) => {
  const response = await apiClient.patch(
    `/inventory/purchase-orders/${id}/cancel`,
  );
  return response.data;
};

// ===== Items =====

export const addPurchaseOrderItem = async (
  poId: string,
  data: { itemId: string; quantityOrdered: number; unitCost: number },
) => {
  const response = await apiClient.post(
    `/inventory/purchase-orders/${poId}/items`,
    data,
  );
  return response.data;
};

export const getPurchaseOrderItems = async (poId: string) => {
  const response = await apiClient.get(
    `/inventory/purchase-orders/${poId}/items`,
  );
  return response.data;
};

// ===== Recepción =====

export const receivePurchaseOrder = async (
  poId: string,
  data: {
    warehouseId?: string;
    notes?: string;
    receivedBy?: string;
    items: {
      itemId: string;
      quantityReceived: number;
      unitCost: number;
      batchNumber?: string | null;
      expiryDate?: string | null;
    }[];
  },
) => {
  const response = await apiClient.post(
    `/inventory/purchase-orders/${poId}/receive`,
    data,
  );
  return response.data;
};
