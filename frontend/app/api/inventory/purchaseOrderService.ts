import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";
import type { PurchaseOrderStatus } from "@/libs/interfaces/inventory";

// ===== Types & Interfaces =====

export interface PurchaseOrderParams {
  page?: number;
  limit?: number;
  status?: PurchaseOrderStatus;
  supplierId?: string;
  warehouseId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export interface CreatePurchaseOrderData {
  supplierId: string;
  warehouseId: string;
  notes?: string;
  expectedDate?: string;
  items?: { itemId: string; quantityOrdered: number; unitCost: number }[];
}

export interface UpdatePurchaseOrderData {
  status?: PurchaseOrderStatus;
  notes?: string | null;
  expectedDate?: string | null;
}

export interface AddPurchaseOrderItemData {
  itemId: string;
  quantityOrdered: number;
  unitCost: number;
}

export interface ReceivePurchaseOrderData {
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
}

// ===== Service =====

const purchaseOrderService = {
  async getAll(params?: PurchaseOrderParams): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get("/inventory/purchase-orders", {
      params,
    });
    return response.data;
  },

  async getById(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/inventory/purchase-orders/${id}`);
    return response.data;
  },

  async create(data: CreatePurchaseOrderData): Promise<ApiResponse<any>> {
    const response = await apiClient.post("/inventory/purchase-orders", data);
    return response.data;
  },

  async update(
    id: string,
    data: UpdatePurchaseOrderData,
  ): Promise<ApiResponse<any>> {
    const response = await apiClient.put(
      `/inventory/purchase-orders/${id}`,
      data,
    );
    return response.data;
  },

  async delete(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/inventory/purchase-orders/${id}`);
    return response.data;
  },

  async approve(id: string, approvedBy?: string): Promise<ApiResponse<any>> {
    const response = await apiClient.patch(
      `/inventory/purchase-orders/${id}/approve`,
      { approvedBy },
    );
    return response.data;
  },

  async cancel(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.patch(
      `/inventory/purchase-orders/${id}/cancel`,
    );
    return response.data;
  },

  async addItem(
    poId: string,
    data: AddPurchaseOrderItemData,
  ): Promise<ApiResponse<any>> {
    const response = await apiClient.post(
      `/inventory/purchase-orders/${poId}/items`,
      data,
    );
    return response.data;
  },

  async getItems(poId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(
      `/inventory/purchase-orders/${poId}/items`,
    );
    return response.data;
  },

  async receive(
    poId: string,
    data: ReceivePurchaseOrderData,
  ): Promise<ApiResponse<any>> {
    const response = await apiClient.post(
      `/inventory/purchase-orders/${poId}/receive`,
      data,
    );
    return response.data;
  },
};

export default purchaseOrderService;
