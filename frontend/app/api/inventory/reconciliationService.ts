import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";

// Enums
export enum ReconciliationStatus {
  DRAFT = "DRAFT",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  APPROVED = "APPROVED",
  APPLIED = "APPLIED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum ReconciliationSource {
  CYCLE_COUNT = "CYCLE_COUNT",
  PHYSICAL_INVENTORY = "PHYSICAL_INVENTORY",
  SYSTEM_ERROR = "SYSTEM_ERROR",
  ADJUSTMENT = "ADJUSTMENT",
  OTHER = "OTHER",
}

// Interfaces
export interface ReconciliationItem {
  id: string;
  itemId: string;
  systemQuantity: number;
  expectedQuantity: number;
  difference?: number;
  notes?: string;
}

export interface Reconciliation {
  id: string;
  reconciliationNumber: string;
  warehouseId: string;
  status: ReconciliationStatus;
  source?: ReconciliationSource;
  items: ReconciliationItem[];
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
interface CreateReconciliationRequest {
  warehouseId: string;
  source?: ReconciliationSource;
  items: Array<{
    itemId: string;
    systemQuantity: number;
    expectedQuantity: number;
    notes?: string;
  }>;
  notes?: string;
}

interface UpdateReconciliationRequest {
  warehouseId?: string;
  source?: ReconciliationSource;
  items?: Array<{
    itemId: string;
    systemQuantity: number;
    expectedQuantity: number;
    notes?: string;
  }>;
  notes?: string;
}

interface StartReconciliationRequest {
  startedBy: string;
}

interface CompleteReconciliationRequest {
  completedBy: string;
}

interface ApproveReconciliationRequest {
  approvedBy: string;
}

interface ApplyReconciliationRequest {
  appliedBy: string;
}

// ===== Service =====

const reconciliationService = {
  async getAll(
    page = 1,
    limit = 20,
    filters?: {
      status?: string;
      warehouseId?: string;
      source?: string;
      search?: string;
    },
  ): Promise<PaginatedResponse<Reconciliation>> {
    const response = await apiClient.get("/inventory/reconciliations", {
      params: {
        page,
        limit,
        ...filters,
      },
    });
    return response.data;
  },

  async getById(id: string): Promise<ApiResponse<Reconciliation>> {
    const response = await apiClient.get(`/inventory/reconciliations/${id}`);
    return response.data;
  },

  async create(
    data: CreateReconciliationRequest,
  ): Promise<ApiResponse<Reconciliation>> {
    const response = await apiClient.post("/inventory/reconciliations", data);
    return response.data;
  },

  async update(
    id: string,
    data: UpdateReconciliationRequest,
  ): Promise<ApiResponse<Reconciliation>> {
    const response = await apiClient.put(
      `/inventory/reconciliations/${id}`,
      data,
    );
    return response.data;
  },

  async start(
    id: string,
    startedBy: string,
  ): Promise<ApiResponse<Reconciliation>> {
    const response = await apiClient.patch(
      `/inventory/reconciliations/${id}/start`,
      {
        startedBy,
      },
    );
    return response.data;
  },

  async complete(
    id: string,
    completedBy: string,
  ): Promise<ApiResponse<Reconciliation>> {
    const response = await apiClient.patch(
      `/inventory/reconciliations/${id}/complete`,
      {
        completedBy,
      },
    );
    return response.data;
  },

  async approve(
    id: string,
    approvedBy: string,
  ): Promise<ApiResponse<Reconciliation>> {
    const response = await apiClient.patch(
      `/inventory/reconciliations/${id}/approve`,
      {
        approvedBy,
      },
    );
    return response.data;
  },

  async apply(
    id: string,
    appliedBy: string,
  ): Promise<ApiResponse<Reconciliation>> {
    const response = await apiClient.patch(
      `/inventory/reconciliations/${id}/apply`,
      {
        appliedBy,
      },
    );
    return response.data;
  },

  async reject(
    id: string,
    reason: string,
  ): Promise<ApiResponse<Reconciliation>> {
    const response = await apiClient.patch(
      `/inventory/reconciliations/${id}/reject`,
      {
        reason,
      },
    );
    return response.data;
  },

  async cancel(id: string): Promise<ApiResponse<Reconciliation>> {
    const response = await apiClient.patch(
      `/inventory/reconciliations/${id}/cancel`,
      {},
    );
    return response.data;
  },

  async addItem(
    id: string,
    item: {
      itemId: string;
      systemQuantity: number;
      expectedQuantity: number;
      notes?: string;
    },
  ): Promise<ApiResponse<ReconciliationItem>> {
    const response = await apiClient.post(
      `/inventory/reconciliations/${id}/items`,
      item,
    );
    return response.data;
  },

  async getItems(id: string): Promise<ApiResponse<ReconciliationItem[]>> {
    const response = await apiClient.get(
      `/inventory/reconciliations/${id}/items`,
    );
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/inventory/reconciliations/${id}`);
  },
};

export default reconciliationService;
