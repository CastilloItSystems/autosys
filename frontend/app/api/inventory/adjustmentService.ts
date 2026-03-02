import apiClient from "../apiClient";

// ── Adjustment Types ───────────────────────────────────────────────────────

export type AdjustmentType = "ADJUSTMENT_IN" | "ADJUSTMENT_OUT";

export const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentType, string> = {
  ADJUSTMENT_IN: "Ajuste Entrada",
  ADJUSTMENT_OUT: "Ajuste Salida",
};

export const ADJUSTMENT_TYPE_SEVERITY: Record<
  AdjustmentType,
  "success" | "danger" | "warning" | "info"
> = {
  ADJUSTMENT_IN: "success",
  ADJUSTMENT_OUT: "warning",
};

export type AdjustmentStatus =
  | "DRAFT"
  | "APPROVED"
  | "APPLIED"
  | "REJECTED"
  | "CANCELLED";

export const ADJUSTMENT_STATUS_LABELS: Record<AdjustmentStatus, string> = {
  DRAFT: "Borrador",
  APPROVED: "Aprobado",
  APPLIED: "Aplicado",
  REJECTED: "Rechazado",
  CANCELLED: "Cancelado",
};

export const ADJUSTMENT_STATUS_SEVERITY: Record<
  AdjustmentStatus,
  "success" | "danger" | "warning" | "info" | "secondary"
> = {
  DRAFT: "info",
  APPROVED: "warning",
  APPLIED: "success",
  REJECTED: "danger",
  CANCELLED: "secondary",
};

// ── Interfaces ───────────────────────────────────────────────────────────

export interface AdjustmentItemSummary {
  id: string;
  sku: string;
  name: string;
}

export interface AdjustmentWarehouseSummary {
  id: string;
  code: string;
  name: string;
}

export interface AdjustmentItem {
  id: string;
  adjustmentId: string;
  itemId: string;
  quantityChange: number;
  currentQuantity?: number;
  newQuantity?: number;
  reason?: string;
  createdAt: string;
  item?: AdjustmentItemSummary;
}

export interface Adjustment {
  id: string;
  adjustmentNumber: string;
  status: AdjustmentStatus;
  warehouseId: string;
  reason: string;
  notes?: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  appliedBy?: string;
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
  warehouse?: AdjustmentWarehouseSummary;
  items?: AdjustmentItem[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdjustmentsResponse {
  data: Adjustment[];
  meta: Pagination;
}

export interface CreateAdjustmentRequest {
  warehouseId: string;
  reason: string;
  notes?: string;
  items: Array<{
    itemId: string;
    quantityChange: number;
    reason?: string;
  }>;
}

// ── CRUD Operations ──────────────────────────────────────────────────────

export const getAdjustments = async (
  page: number = 1,
  limit: number = 20,
  filters?: {
    status?: AdjustmentStatus;
    warehouseId?: string;
    createdBy?: string;
    dateFrom?: string;
    dateTo?: string;
  },
): Promise<AdjustmentsResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (filters?.status) params.append("status", filters.status);
  if (filters?.warehouseId) params.append("warehouseId", filters.warehouseId);
  if (filters?.createdBy) params.append("createdBy", filters.createdBy);
  if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
  if (filters?.dateTo) params.append("dateTo", filters.dateTo);

  const response = await apiClient.get(`/inventory/adjustments?${params}`);
  return response.data;
};

export const getAdjustment = async (
  id: string,
): Promise<{ data: Adjustment }> => {
  const response = await apiClient.get(`/inventory/adjustments/${id}`);
  return response.data;
};

export const createAdjustment = async (
  data: CreateAdjustmentRequest,
): Promise<{ data: Adjustment }> => {
  const response = await apiClient.post("/inventory/adjustments", data);
  return response.data;
};

export const approveAdjustment = async (
  id: string,
): Promise<{ data: Adjustment }> => {
  const response = await apiClient.patch(
    `/inventory/adjustments/${id}/approve`,
    {},
  );
  return response.data;
};

export const applyAdjustment = async (
  id: string,
): Promise<{ data: Adjustment }> => {
  const response = await apiClient.patch(
    `/inventory/adjustments/${id}/apply`,
    {},
  );
  return response.data;
};

export const rejectAdjustment = async (
  id: string,
): Promise<{ data: Adjustment }> => {
  const response = await apiClient.patch(
    `/inventory/adjustments/${id}/reject`,
    {},
  );
  return response.data;
};

export const cancelAdjustment = async (
  id: string,
): Promise<{ data: Adjustment }> => {
  const response = await apiClient.patch(
    `/inventory/adjustments/${id}/cancel`,
    {},
  );
  return response.data;
};
