import apiClient from "../apiClient";

// Enums
export enum CycleCountStatus {
  DRAFT = "DRAFT",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  APPROVED = "APPROVED",
  APPLIED = "APPLIED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

// Interfaces
export interface CycleCountItem {
  id: string;
  itemId: string;
  expectedQuantity: number;
  countedQuantity?: number;
  variance?: number;
  location?: string;
  notes?: string;
}

export interface CycleCount {
  id: string;
  cycleCountNumber: string;
  warehouseId: string;
  status: CycleCountStatus;
  items: CycleCountItem[];
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  approvedAt?: string;
  appliedAt?: string;
  startedBy?: string;
  completedBy?: string;
  approvedBy?: string;
  appliedBy?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  warehouse?: {
    id: string;
    name: string;
  };
}

export interface CycleCountsResponse {
  data: CycleCount[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface CycleCountResponse {
  data: CycleCount;
}

// DTOs
interface CreateCycleCountRequest {
  warehouseId: string;
  items: Array<{
    itemId: string;
    expectedQuantity: number;
    location?: string;
    notes?: string;
  }>;
  notes?: string;
}

interface UpdateCycleCountRequest {
  warehouseId?: string;
  items?: Array<{
    itemId: string;
    expectedQuantity: number;
    location?: string;
    notes?: string;
  }>;
  notes?: string;
}

interface StartCycleCountRequest {
  startedBy: string;
}

interface CompleteCycleCountRequest {
  completedBy: string;
}

interface ApproveCycleCountRequest {
  approvedBy: string;
}

interface ApplyCycleCountRequest {
  appliedBy: string;
}

// API Methods
export const getCycleCounts = async (
  page = 1,
  limit = 20,
  filters?: {
    status?: string;
    warehouseId?: string;
    search?: string;
  },
): Promise<CycleCountsResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (filters) {
    if (filters.status) params.append("status", filters.status);
    if (filters.warehouseId) params.append("warehouseId", filters.warehouseId);
    if (filters.search) params.append("search", filters.search);
  }

  const response = await apiClient.get(`/inventory/cycle-counts?${params}`);
  return response.data;
};

export const getCycleCount = async (
  id: string,
): Promise<CycleCountResponse> => {
  const response = await apiClient.get(`/inventory/cycle-counts/${id}`);
  return response.data;
};

export const createCycleCount = async (
  data: CreateCycleCountRequest,
): Promise<CycleCountResponse> => {
  const response = await apiClient.post("/inventory/cycle-counts", data);
  return response.data;
};

export const updateCycleCount = async (
  id: string,
  data: UpdateCycleCountRequest,
): Promise<CycleCountResponse> => {
  const response = await apiClient.put(`/inventory/cycle-counts/${id}`, data);
  return response.data;
};

export const startCycleCount = async (
  id: string,
  startedBy: string,
): Promise<CycleCountResponse> => {
  const response = await apiClient.patch(
    `/inventory/cycle-counts/${id}/start`,
    {
      startedBy,
    },
  );
  return response.data;
};

export const completeCycleCount = async (
  id: string,
  completedBy: string,
): Promise<CycleCountResponse> => {
  const response = await apiClient.patch(
    `/inventory/cycle-counts/${id}/complete`,
    {
      completedBy,
    },
  );
  return response.data;
};

export const approveCycleCount = async (
  id: string,
  approvedBy: string,
): Promise<CycleCountResponse> => {
  const response = await apiClient.patch(
    `/inventory/cycle-counts/${id}/approve`,
    {
      approvedBy,
    },
  );
  return response.data;
};

export const applyCycleCount = async (
  id: string,
  appliedBy: string,
): Promise<CycleCountResponse> => {
  const response = await apiClient.patch(
    `/inventory/cycle-counts/${id}/apply`,
    {
      appliedBy,
    },
  );
  return response.data;
};

export const rejectCycleCount = async (
  id: string,
  reason: string,
): Promise<CycleCountResponse> => {
  const response = await apiClient.patch(
    `/inventory/cycle-counts/${id}/reject`,
    {
      reason,
    },
  );
  return response.data;
};

export const cancelCycleCount = async (
  id: string,
): Promise<CycleCountResponse> => {
  const response = await apiClient.patch(
    `/inventory/cycle-counts/${id}/cancel`,
    {},
  );
  return response.data;
};

export const addItemToCycleCount = async (
  id: string,
  item: {
    itemId: string;
    expectedQuantity: number;
    location?: string;
    notes?: string;
  },
): Promise<CycleCountItem> => {
  const response = await apiClient.post(
    `/inventory/cycle-counts/${id}/items`,
    item,
  );
  return response.data;
};

export const getCycleCountItems = async (
  id: string,
): Promise<CycleCountItem[]> => {
  const response = await apiClient.get(`/inventory/cycle-counts/${id}/items`);
  return response.data;
};

export const updateItemCountedQuantity = async (
  id: string,
  itemId: string,
  countedQuantity: number,
): Promise<CycleCountItem> => {
  const response = await apiClient.patch(
    `/inventory/cycle-counts/${id}/items/${itemId}/counted`,
    { countedQuantity },
  );
  return response.data;
};

export const deleteCycleCount = async (id: string): Promise<void> => {
  await apiClient.delete(`/inventory/cycle-counts/${id}`);
};
