import apiClient from "../apiClient";

// Enums
export enum TransferStatus {
  DRAFT = "DRAFT",
  IN_TRANSIT = "IN_TRANSIT",
  RECEIVED = "RECEIVED",
  CANCELLED = "CANCELLED",
}

// Interfaces
export interface TransferItem {
  id: string;
  itemId: string;
  quantity: number;
  unitCost?: number;
  notes?: string;
}

export interface Transfer {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  status: TransferStatus;
  items: TransferItem[];
  notes?: string;
  sentAt?: string;
  receivedAt?: string;
  sentBy?: string;
  receivedBy?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  fromWarehouse?: {
    id: string;
    name: string;
  };
  toWarehouse?: {
    id: string;
    name: string;
  };
}

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

// DTOs
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
  fromWarehouseId?: string;
  toWarehouseId?: string;
  items?: Array<{
    itemId: string;
    quantity: number;
    unitCost?: number;
    notes?: string;
  }>;
  notes?: string;
}

// API Methods
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

export const sendTransfer = async (id: string): Promise<TransferResponse> => {
  const response = await apiClient.patch(`/inventory/transfers/${id}/send`, {});
  return response.data;
};

export const receiveTransfer = async (
  id: string,
): Promise<TransferResponse> => {
  const response = await apiClient.patch(
    `/inventory/transfers/${id}/receive`,
    {},
  );
  return response.data;
};

export const cancelTransfer = async (id: string): Promise<TransferResponse> => {
  const response = await apiClient.patch(
    `/inventory/transfers/${id}/cancel`,
    {},
  );
  return response.data;
};

export const deleteTransfer = async (id: string): Promise<TransferResponse> => {
  const response = await apiClient.delete(`/inventory/transfers/${id}`);
  return response.data;
};
