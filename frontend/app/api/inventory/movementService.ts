import apiClient from "../apiClient";

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

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MovementsResponse {
  data: Movement[];
  meta: Pagination;
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

// ── CRUD Operations ──────────────────────────────────────────────────────

export const getMovements = async (
  page: number = 1,
  limit: number = 20,
  filters?: {
    type?: MovementType;
    itemId?: string;
    warehouseFromId?: string;
    warehouseToId?: string;
    createdBy?: string;
    reference?: string;
    dateFrom?: string;
    dateTo?: string;
  },
): Promise<MovementsResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (filters?.type) params.append("type", filters.type);
  if (filters?.itemId) params.append("itemId", filters.itemId);
  if (filters?.warehouseFromId)
    params.append("warehouseFromId", filters.warehouseFromId);
  if (filters?.warehouseToId)
    params.append("warehouseToId", filters.warehouseToId);
  if (filters?.createdBy) params.append("createdBy", filters.createdBy);
  if (filters?.reference) params.append("reference", filters.reference);
  if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
  if (filters?.dateTo) params.append("dateTo", filters.dateTo);

  const response = await apiClient.get(`/inventory/movements?${params}`);
  const payload = response.data as {
    data?: Movement[];
    meta?: Pagination;
    pagination?: Pagination;
  };

  const resolvedMeta = payload.meta ||
    payload.pagination || {
      page,
      limit,
      total: payload.data?.length || 0,
      totalPages: Math.ceil((payload.data?.length || 0) / limit) || 1,
    };

  return {
    data: payload.data || [],
    meta: resolvedMeta,
  };
};

export const getMovement = async (id: string): Promise<{ data: Movement }> => {
  const response = await apiClient.get(`/inventory/movements/${id}`);
  return response.data;
};

export const getMovementsByType = async (
  type: MovementType,
  limit: number = 100,
): Promise<MovementsResponse> => {
  const response = await apiClient.get(
    `/inventory/movements/type/${type}?limit=${limit}`,
  );
  return response.data;
};

export const getMovementsByItem = async (
  itemId: string,
  limit: number = 100,
): Promise<MovementsResponse> => {
  const response = await apiClient.get(
    `/inventory/movements/item/${itemId}?limit=${limit}`,
  );
  return response.data;
};

export const getMovementsByWarehouse = async (
  warehouseId: string,
  limit: number = 100,
): Promise<MovementsResponse> => {
  const response = await apiClient.get(
    `/inventory/movements/warehouse/${warehouseId}?limit=${limit}`,
  );
  return response.data;
};

export const createMovement = async (
  data: CreateMovementRequest,
): Promise<{ data: Movement }> => {
  const response = await apiClient.post("/inventory/movements", data);
  return response.data;
};

export const cancelMovement = async (
  id: string,
): Promise<{ data: Movement }> => {
  const response = await apiClient.patch(
    `/inventory/movements/${id}/cancel`,
    {},
  );
  return response.data;
};

// ── Dashboard Metrics ────────────────────────────────────────────────────

export interface MovementDashboardMetrics {
  totalMovements: number;
  totalEntries: number;
  totalExits: number;
  netValue: number;
  byType: { type: string; _count: number }[];
}

export const getMovementDashboard = async (): Promise<{
  data: MovementDashboardMetrics;
}> => {
  const response = await apiClient.get("/inventory/movements/dashboard");
  return response.data;
};
