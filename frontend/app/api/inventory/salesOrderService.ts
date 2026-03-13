import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";

// ============================================================================
// SERVICE
// ============================================================================

const salesOrderService = {
  /**
   * Get single sales order by ID
   */
  async getById(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/inventory/salesOrder/${id}`,
    );
    return response.data;
  },

  /**
   * Get all sales orders
   */
  async getAll(): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get<PaginatedResponse<any>>(
      `/inventory/salesOrder`,
    );
    return response.data;
  },

  /**
   * Create new sales order
   */
  async create(data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>(
      `/inventory/salesOrder`,
      data,
    );
    return response.data;
  },

  /**
   * Update sales order
   */
  async update(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put<ApiResponse<any>>(
      `/inventory/salesOrder/${id}`,
      data,
    );
    return response.data;
  },

  /**
   * Delete sales order
   */
  async delete(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete<ApiResponse<any>>(
      `/inventory/salesOrder/${id}`,
    );
    return response.data;
  },

  /**
   * Confirm sales order (creates reservations)
   */
  async confirm(
    id: string,
    warehouse: string,
    idempotencyKey?: string,
  ): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>(
      `/inventory/salesOrder/${id}/confirm`,
      { warehouse, idempotencyKey },
    );
    return response.data;
  },

  /**
   * Ship sales order (complete or partial)
   */
  async ship(
    id: string,
    items?: { item: string; cantidad: number }[],
    idempotencyKey?: string,
  ): Promise<ApiResponse<any>> {
    const payload: any = { idempotencyKey };
    if (items && items.length > 0) {
      payload.items = items;
    }
    const response = await apiClient.post<ApiResponse<any>>(
      `/inventory/salesOrder/${id}/ship`,
      payload,
    );
    return response.data;
  },

  /**
   * Cancel sales order
   */
  async cancel(id: string, idempotencyKey?: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>(
      `/inventory/salesOrder/${id}/cancel`,
      { idempotencyKey },
    );
    return response.data;
  },
};

export default salesOrderService;
