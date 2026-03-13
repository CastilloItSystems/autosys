import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";

// ============================================
// ENUMS & CONSTANTS
// ============================================
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

// ============================================
// ENTITY
// ============================================
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

// ============================================
// REQUEST PARAMS & DTOs
// ============================================
export interface GetAdjustmentsParams {
  page?: number;
  limit?: number;
  status?: AdjustmentStatus;
  warehouseId?: string;
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateAdjustmentRequest {
  warehouseId: string; // Requerido
  reason: string; // Requerido
  notes?: string; // Opcional
  items: Array<{
    itemId: string; // Requerido
    quantityChange: number; // Requerido
    reason?: string; // Opcional
  }>;
}

// ============================================
// SERVICE
// ============================================
const BASE_ROUTE = "/inventory/adjustments";

const adjustmentService = {
  async getAll(
    params?: GetAdjustmentsParams,
  ): Promise<PaginatedResponse<Adjustment>> {
    const res = await apiClient.get(BASE_ROUTE, { params });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<Adjustment>> {
    const res = await apiClient.get(`${BASE_ROUTE}/${id}`);
    return res.data;
  },

  async create(
    data: CreateAdjustmentRequest,
  ): Promise<ApiResponse<Adjustment>> {
    const res = await apiClient.post(BASE_ROUTE, data);
    return res.data;
  },

  async approve(id: string): Promise<ApiResponse<Adjustment>> {
    const res = await apiClient.patch(`${BASE_ROUTE}/${id}/approve`, {});
    return res.data;
  },

  async apply(id: string): Promise<ApiResponse<Adjustment>> {
    const res = await apiClient.patch(`${BASE_ROUTE}/${id}/apply`, {});
    return res.data;
  },

  async reject(id: string): Promise<ApiResponse<Adjustment>> {
    const res = await apiClient.patch(`${BASE_ROUTE}/${id}/reject`, {});
    return res.data;
  },

  async cancel(id: string): Promise<ApiResponse<Adjustment>> {
    const res = await apiClient.patch(`${BASE_ROUTE}/${id}/cancel`, {});
    return res.data;
  },
};

export default adjustmentService;
