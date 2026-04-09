import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";

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
  location?: string;       // Snapshot original del stock al crear el conteo
  locationFound?: string;  // Ubicación encontrada por el contador
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

// DTOs
export interface CreateCycleCountRequest {
  warehouseId: string;
  items: Array<{
    itemId: string;
    expectedQuantity: number;
    location?: string;
    notes?: string;
  }>;
  notes?: string;
}

export interface UpdateCycleCountRequest {
  warehouseId?: string;
  items?: Array<{
    itemId: string;
    expectedQuantity: number;
    location?: string;
    notes?: string;
  }>;
  notes?: string;
}

interface CycleCountParams {
  status?: string;
  warehouseId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface CycleCountItemParams {
  itemId: string;
  expectedQuantity: number;
  location?: string;
  notes?: string;
}

// Service
const cycleCountService = {
  async getAll(
    params?: CycleCountParams,
  ): Promise<PaginatedResponse<CycleCount>> {
    const { page = 1, limit = 20, ...filters } = params || {};
    const res = await apiClient.get("/inventory/cycle-counts", {
      params: {
        page,
        limit,
        ...filters,
      },
    });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<CycleCount>> {
    const res = await apiClient.get(`/inventory/cycle-counts/${id}`);
    return res.data;
  },

  async create(
    data: CreateCycleCountRequest,
  ): Promise<ApiResponse<CycleCount>> {
    const res = await apiClient.post("/inventory/cycle-counts", data);
    return res.data;
  },

  async update(
    id: string,
    data: UpdateCycleCountRequest,
  ): Promise<ApiResponse<CycleCount>> {
    const res = await apiClient.put(`/inventory/cycle-counts/${id}`, data);
    return res.data;
  },

  async start(id: string, startedBy: string): Promise<ApiResponse<CycleCount>> {
    const res = await apiClient.patch(`/inventory/cycle-counts/${id}/start`, {
      startedBy,
    });
    return res.data;
  },

  async complete(
    id: string,
    completedBy: string,
  ): Promise<ApiResponse<CycleCount>> {
    const res = await apiClient.patch(
      `/inventory/cycle-counts/${id}/complete`,
      {
        completedBy,
      },
    );
    return res.data;
  },

  async approve(
    id: string,
    approvedBy: string,
  ): Promise<ApiResponse<CycleCount>> {
    const res = await apiClient.patch(`/inventory/cycle-counts/${id}/approve`, {
      approvedBy,
    });
    return res.data;
  },

  async apply(id: string, appliedBy: string): Promise<ApiResponse<CycleCount>> {
    const res = await apiClient.patch(`/inventory/cycle-counts/${id}/apply`, {
      appliedBy,
    });
    return res.data;
  },

  async reject(id: string, reason: string): Promise<ApiResponse<CycleCount>> {
    const res = await apiClient.patch(`/inventory/cycle-counts/${id}/reject`, {
      reason,
    });
    return res.data;
  },

  async cancel(id: string): Promise<ApiResponse<CycleCount>> {
    const res = await apiClient.patch(
      `/inventory/cycle-counts/${id}/cancel`,
      {},
    );
    return res.data;
  },

  async addItem(
    id: string,
    item: CycleCountItemParams,
  ): Promise<ApiResponse<CycleCountItem>> {
    const res = await apiClient.post(
      `/inventory/cycle-counts/${id}/items`,
      item,
    );
    return res.data;
  },

  async getItems(id: string): Promise<ApiResponse<CycleCountItem[]>> {
    const res = await apiClient.get(`/inventory/cycle-counts/${id}/items`);
    return res.data;
  },

  async updateItemQuantity(
    id: string,
    itemId: string,
    countedQuantity?: number | null,
    newLocation?: string | null,
  ): Promise<ApiResponse<CycleCountItem>> {
    const body: any = {};
    if (countedQuantity !== undefined && countedQuantity !== null)
      body.countedQuantity = countedQuantity;
    if (newLocation !== undefined) body.newLocation = newLocation;
    const res = await apiClient.patch(
      `/inventory/cycle-counts/${id}/items/${itemId}`,
      body,
    );
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/inventory/cycle-counts/${id}`);
  },

  async exportRouteSheet(
    id: string,
    format: "csv" | "excel",
  ): Promise<Blob> {
    const res = await apiClient.get(
      `/inventory/cycle-counts/${id}/export`,
      { params: { format }, responseType: "blob" },
    );
    return res.data;
  },
};

export default cycleCountService;
