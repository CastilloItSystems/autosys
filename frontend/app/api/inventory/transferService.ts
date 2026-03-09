import apiClient from "../apiClient";
import type {
  Transfer,
  TransferItem,
  TransferNoteInfo,
} from "@/libs/interfaces/inventory/transfer.interface";

// Re-export for backwards compatibility
export { TransferStatus } from "@/libs/interfaces/inventory/transfer.interface";
export type { Transfer, TransferItem, TransferNoteInfo };

// ─── Response types ─────────────────────────────────────────────────

export interface TransfersResponse {
  data: Transfer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface TransferResponse {
  data: Transfer;
}

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

// ─── API Methods ────────────────────────────────────────────────────

export const getTransfers = async (
  page = 1,
  limit = 20,
  filters?: {
    status?: string;
    fromWarehouseId?: string;
    toWarehouseId?: string;
    search?: string;
  },
): Promise<TransfersResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (filters) {
    if (filters.status) params.append("status", filters.status);
    if (filters.fromWarehouseId)
      params.append("fromWarehouseId", filters.fromWarehouseId);
    if (filters.toWarehouseId)
      params.append("toWarehouseId", filters.toWarehouseId);
    if (filters.search) params.append("search", filters.search);
  }

  const response = await apiClient.get(`/inventory/transfers?${params}`);
  return response.data;
};

export const getTransfer = async (id: string): Promise<TransferResponse> => {
  const response = await apiClient.get(`/inventory/transfers/${id}`);
  return response.data;
};

export const createTransfer = async (
  data: CreateTransferRequest,
): Promise<TransferResponse> => {
  const response = await apiClient.post("/inventory/transfers", data);
  return response.data;
};

export const updateTransfer = async (
  id: string,
  data: UpdateTransferRequest,
): Promise<TransferResponse> => {
  const response = await apiClient.put(`/inventory/transfers/${id}`, data);
  return response.data;
};

// ─── Approval flow ──────────────────────────────────────────────────

export const submitTransfer = async (id: string): Promise<TransferResponse> => {
  const response = await apiClient.patch(`/inventory/transfers/${id}/submit`);
  return response.data;
};

export const approveTransfer = async (
  id: string,
): Promise<TransferResponse> => {
  const response = await apiClient.patch(`/inventory/transfers/${id}/approve`);
  return response.data;
};

export const rejectTransfer = async (
  id: string,
  data: RejectTransferRequest,
): Promise<TransferResponse> => {
  const response = await apiClient.patch(
    `/inventory/transfers/${id}/reject`,
    data,
  );
  return response.data;
};

// ─── State transitions ─────────────────────────────────────────────

export const cancelTransfer = async (id: string): Promise<TransferResponse> => {
  const response = await apiClient.patch(`/inventory/transfers/${id}/cancel`);
  return response.data;
};

export const deleteTransfer = async (id: string): Promise<void> => {
  await apiClient.delete(`/inventory/transfers/${id}`);
};
