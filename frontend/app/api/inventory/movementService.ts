import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";

// ── Movement Types ───────────────────────────────────────────────────────

export type MovementType =
  | "PURCHASE"
  | "SALE"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "TRANSFER"
  | "SUPPLIER_RETURN"
  | "WORKSHOP_RETURN"
  | "RESERVATION_RELEASE"
  | "LOAN_OUT"
  | "LOAN_RETURN";

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  PURCHASE: "Compra",
  SALE: "Venta",
  ADJUSTMENT_IN: "Ajuste Entrada",
  ADJUSTMENT_OUT: "Ajuste Salida",
  TRANSFER: "Transferencia",
  SUPPLIER_RETURN: "Retorno a Proveedor",
  WORKSHOP_RETURN: "Retorno de Taller",
  RESERVATION_RELEASE: "Liberación de Reserva",
  LOAN_OUT: "Préstamo Salida",
  LOAN_RETURN: "Préstamo Devolución",
};

export const MOVEMENT_TYPE_SEVERITY: Record<
  MovementType,
  "success" | "danger" | "warning" | "info"
> = {
  PURCHASE: "success",
  SALE: "danger",
  ADJUSTMENT_IN: "info",
  ADJUSTMENT_OUT: "warning",
  TRANSFER: "info",
  SUPPLIER_RETURN: "warning",
  WORKSHOP_RETURN: "warning",
  RESERVATION_RELEASE: "info",
  LOAN_OUT: "danger",
  LOAN_RETURN: "success",
};

// ── Interfaces ───────────────────────────────────────────────────────────

export interface MovementItemSummary {
  id: string;
  sku: string;
  name: string;
  costPrice?: number;
}

export interface MovementWarehouseSummary {
  id: string;
  code: string;
  name: string;
  type?: "PRINCIPAL" | "SUCURSAL" | "TRANSITO";
}

export interface Movement {
  id: string;
  movementNumber: string;
  type: MovementType;
  itemId: string;
  quantity: number;
  unitCost?: number | null;
  totalCost?: number | null;
  reference?: string | null;
  notes?: string | null;
  warehouseFromId?: string | null;
  warehouseToId?: string | null;
  batchId?: string | null;
  purchaseOrderId?: string | null;
  workOrderId?: string | null;
  reservationId?: string | null;
  exitNoteId?: string | null;
  invoiceId?: string | null;
  exitType?: "MANUAL" | "SYSTEM" | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  movementDate: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  variance?: number | null;
  snapshotQuantity?: number | null;
  item?: MovementItemSummary;
  warehouseFrom?: MovementWarehouseSummary;
  warehouseTo?: MovementWarehouseSummary;
}

export interface CreateMovementRequest {
  type: MovementType;
  itemId: string;
  quantity: number;
  unitCost?: number;
  warehouseFromId?: string;
  warehouseToId?: string;
  reference?: string;
  notes?: string;
}

export interface MovementDashboardMetrics {
  totalMovements: number;
  totalEntries: number;
  totalExits: number;
  netValue: number;
  byType: { type: string; _count: number }[];
}

// ============================================
// SERVICE
// ============================================
const BASE_ROUTE = "/inventory/movements";

const movementService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    type?: MovementType;
    itemId?: string;
    warehouseFromId?: string;
    warehouseToId?: string;
    createdBy?: string;
    reference?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PaginatedResponse<Movement>> {
    const res = await apiClient.get(BASE_ROUTE, { params });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<Movement>> {
    const res = await apiClient.get(`${BASE_ROUTE}/${id}`);
    return res.data;
  },

  async getByType(
    type: MovementType,
    limit: number = 100,
  ): Promise<PaginatedResponse<Movement>> {
    const res = await apiClient.get(`${BASE_ROUTE}/type/${type}`, {
      params: { limit },
    });
    return res.data;
  },

  async getByItem(
    itemId: string,
    limit: number = 100,
  ): Promise<PaginatedResponse<Movement>> {
    const res = await apiClient.get(`${BASE_ROUTE}/item/${itemId}`, {
      params: { limit },
    });
    return res.data;
  },

  async getByWarehouse(
    warehouseId: string,
    limit: number = 100,
  ): Promise<PaginatedResponse<Movement>> {
    const res = await apiClient.get(`${BASE_ROUTE}/warehouse/${warehouseId}`, {
      params: { limit },
    });
    return res.data;
  },

  async create(payload: CreateMovementRequest): Promise<ApiResponse<Movement>> {
    const res = await apiClient.post(BASE_ROUTE, payload);
    return res.data;
  },

  async cancel(id: string): Promise<ApiResponse<Movement>> {
    const res = await apiClient.patch(`${BASE_ROUTE}/${id}/cancel`);
    return res.data;
  },

  async getDashboard(): Promise<ApiResponse<MovementDashboardMetrics>> {
    const res = await apiClient.get(`${BASE_ROUTE}/dashboard`);
    return res.data;
  },
};

export default movementService;
