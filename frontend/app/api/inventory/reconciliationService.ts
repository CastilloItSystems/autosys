import apiClient from "../apiClient";

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

export interface ReconciliationsResponse {
  data: Reconciliation[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ReconciliationResponse {
  data: Reconciliation;
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

// API Methods
export const getReconciliations = async (
  page = 1,
  limit = 20,
  filters?: {
    status?: string;
    warehouseId?: string;
    source?: string;
    search?: string;
  },
): Promise<ReconciliationsResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (filters) {
    if (filters.status) params.append("status", filters.status);
    if (filters.warehouseId) params.append("warehouseId", filters.warehouseId);
    if (filters.source) params.append("source", filters.source);
    if (filters.search) params.append("search", filters.search);
  }

  const response = await apiClient.get(`/inventory/reconciliations?${params}`);
  return response.data;
};

export const getReconciliation = async (
  id: string,
): Promise<ReconciliationResponse> => {
  const response = await apiClient.get(`/inventory/reconciliations/${id}`);
  return response.data;
};

export const createReconciliation = async (
  data: CreateReconciliationRequest,
): Promise<ReconciliationResponse> => {
  const response = await apiClient.post("/inventory/reconciliations", data);
  return response.data;
};

export const updateReconciliation = async (
  id: string,
  data: UpdateReconciliationRequest,
): Promise<ReconciliationResponse> => {
  const response = await apiClient.put(
    `/inventory/reconciliations/${id}`,
    data,
  );
  return response.data;
};

export const startReconciliation = async (
  id: string,
  startedBy: string,
): Promise<ReconciliationResponse> => {
  const response = await apiClient.patch(
    `/inventory/reconciliations/${id}/start`,
    {
      startedBy,
    },
  );
  return response.data;
};

export const completeReconciliation = async (
  id: string,
  completedBy: string,
): Promise<ReconciliationResponse> => {
  const response = await apiClient.patch(
    `/inventory/reconciliations/${id}/complete`,
    {
      completedBy,
    },
  );
  return response.data;
};

export const approveReconciliation = async (
  id: string,
  approvedBy: string,
): Promise<ReconciliationResponse> => {
  const response = await apiClient.patch(
    `/inventory/reconciliations/${id}/approve`,
    {
      approvedBy,
    },
  );
  return response.data;
};

export const applyReconciliation = async (
  id: string,
  appliedBy: string,
): Promise<ReconciliationResponse> => {
  const response = await apiClient.patch(
    `/inventory/reconciliations/${id}/apply`,
    {
      appliedBy,
    },
  );
  return response.data;
};

export const rejectReconciliation = async (
  id: string,
  reason: string,
): Promise<ReconciliationResponse> => {
  const response = await apiClient.patch(
    `/inventory/reconciliations/${id}/reject`,
    {
      reason,
    },
  );
  return response.data;
};

export const cancelReconciliation = async (
  id: string,
): Promise<ReconciliationResponse> => {
  const response = await apiClient.patch(
    `/inventory/reconciliations/${id}/cancel`,
    {},
  );
  return response.data;
};

export const addItemToReconciliation = async (
  id: string,
  item: {
    itemId: string;
    systemQuantity: number;
    expectedQuantity: number;
    notes?: string;
  },
): Promise<ReconciliationItem> => {
  const response = await apiClient.post(
    `/inventory/reconciliations/${id}/items`,
    item,
  );
  return response.data;
};

export const getReconciliationItems = async (
  id: string,
): Promise<ReconciliationItem[]> => {
  const response = await apiClient.get(
    `/inventory/reconciliations/${id}/items`,
  );
  return response.data;
};

export const deleteReconciliation = async (id: string): Promise<void> => {
  await apiClient.delete(`/inventory/reconciliations/${id}`);
};
