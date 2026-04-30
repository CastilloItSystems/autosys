import apiClient from "@/app/api/apiClient";
import { ApiResponse, PaginatedResponse } from "@/modules/inventory/types";
import type { PurchaseOrderStatus } from "@/modules/inventory/purchaseOrders/interfaces/purchaseOrder.interface";

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
  currency?: "USD" | "VES" | "EUR";
  exchangeRate?: number | null;
  paymentTerms?: string | null;
  creditDays?: number | null;
  deliveryTerms?: string | null;
  discountAmount?: number;
  igtfApplies?: boolean;
  notes?: string;
  expectedDate?: string;
  items?: {
    itemId: string;
    itemName?: string;
    quantityOrdered: number;
    unitCost: number;
    discountPercent?: number;
    taxType?: "IVA" | "EXEMPT" | "REDUCED";
  }[];
}

export interface UpdatePurchaseOrderData {
  currency?: "USD" | "VES" | "EUR";
  exchangeRate?: number | null;
  paymentTerms?: string | null;
  creditDays?: number | null;
  deliveryTerms?: string | null;
  discountAmount?: number;
  igtfApplies?: boolean;
  notes?: string | null;
  expectedDate?: string | null;
  items?: CreatePurchaseOrderData["items"];
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
    location?: string | null;
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

  async submit(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.patch(
      `/inventory/purchase-orders/${id}/submit`,
    );
    return response.data;
  },

  async approve(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.patch(
      `/inventory/purchase-orders/${id}/approve`,
      {},
    );
    return response.data;
  },

  async reject(
    id: string,
    rejectionReason: string,
  ): Promise<ApiResponse<any>> {
    const response = await apiClient.patch(
      `/inventory/purchase-orders/${id}/reject`,
      { rejectionReason },
    );
    return response.data;
  },

  async send(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.patch(
      `/inventory/purchase-orders/${id}/send`,
      {},
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

  /**
   * @deprecated La recepción de OC se gestiona desde Notas de Entrada.
   * Usar entryNoteService.createFromPurchaseOrder().
   */
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
