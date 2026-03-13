import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";
import type {
  Transfer,
  TransferItem,
  TransferNoteInfo,
} from "@/libs/interfaces/inventory/transfer.interface";

// Re-export for backwards compatibility
export { TransferStatus } from "@/libs/interfaces/inventory/transfer.interface";
export type { Transfer, TransferItem, TransferNoteInfo };

// ─── Request DTOs ───────────────────────────────────────────────────

interface CreateTransferRequest {
  fromWarehouseId: string;
  toWarehouseId: string;
  items: Array<{
    itemId: string;
    quantity: number;
    unitCost?: number;
    notes?: string;
  }>;
  notes?: string;
}

interface UpdateTransferRequest {
  notes?: string;
}

interface RejectTransferRequest {
  reason: string;
}

// ─── API Service ────────────────────────────────────────────────────

const transferService = {
  async getAll(
    page = 1,
    limit = 20,
    filters?: {
      status?: string;
      fromWarehouseId?: string;
      toWarehouseId?: string;
      search?: string;
    },
  ): Promise<PaginatedResponse<Transfer>> {
    const params: Record<string, any> = { page, limit };

    if (filters) {
      if (filters.status) params.status = filters.status;
      if (filters.fromWarehouseId)
        params.fromWarehouseId = filters.fromWarehouseId;
      if (filters.toWarehouseId) params.toWarehouseId = filters.toWarehouseId;
      if (filters.search) params.search = filters.search;
    }

    const response = await apiClient.get<PaginatedResponse<Transfer>>(
      `/inventory/transfers`,
      { params },
    );
    return response.data;
  },

  async getById(id: string): Promise<ApiResponse<Transfer>> {
    const response = await apiClient.get<ApiResponse<Transfer>>(
      `/inventory/transfers/${id}`,
    );
    return response.data;
  },

  async create(data: CreateTransferRequest): Promise<ApiResponse<Transfer>> {
    const response = await apiClient.post<ApiResponse<Transfer>>(
      "/inventory/transfers",
      data,
    );
    return response.data;
  },

  async update(
    id: string,
    data: UpdateTransferRequest,
  ): Promise<ApiResponse<Transfer>> {
    const response = await apiClient.put<ApiResponse<Transfer>>(
      `/inventory/transfers/${id}`,
      data,
    );
    return response.data;
  },

  // ─── Approval flow ──────────────────────────────────────────────────

  async submit(id: string): Promise<ApiResponse<Transfer>> {
    const response = await apiClient.patch<ApiResponse<Transfer>>(
      `/inventory/transfers/${id}/submit`,
    );
    return response.data;
  },

  async approve(id: string): Promise<ApiResponse<Transfer>> {
    const response = await apiClient.patch<ApiResponse<Transfer>>(
      `/inventory/transfers/${id}/approve`,
    );
    return response.data;
  },

  async reject(
    id: string,
    data: RejectTransferRequest,
  ): Promise<ApiResponse<Transfer>> {
    const response = await apiClient.patch<ApiResponse<Transfer>>(
      `/inventory/transfers/${id}/reject`,
      data,
    );
    return response.data;
  },

  // ─── State transitions ───────────────────────────────────────────────

  async cancel(id: string): Promise<ApiResponse<Transfer>> {
    const response = await apiClient.patch<ApiResponse<Transfer>>(
      `/inventory/transfers/${id}/cancel`,
    );
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/inventory/transfers/${id}`);
  },
};

export default transferService;
