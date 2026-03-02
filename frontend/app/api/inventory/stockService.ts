import apiClient from "../apiClient";

// ── Tipos ────────────────────────────────────────────────────────────────

/** Resumen ligero de Item cuando viene incluido en Stock */
export interface StockItemSummary {
  id: string;
  sku: string;
  name: string;
  barcode?: string | null;
  costPrice: number;
  salePrice: number;
  minStock: number;
  maxStock?: number | null;
  reorderPoint: number;
  isActive: boolean;
}

/** Resumen ligero de Warehouse cuando viene incluido en Stock */
export interface StockWarehouseSummary {
  id: string;
  code: string;
  name: string;
  type: "PRINCIPAL" | "SUCURSAL" | "TRANSITO";
  isActive: boolean;
}

/** Stock – modelo principal */
export interface Stock {
  id: string;
  itemId: string;
  warehouseId: string;
  quantityReal: number;
  quantityReserved: number;
  quantityAvailable: number;
  averageCost: number;
  lastMovementAt: string | null;
  createdAt: string;
  updatedAt: string;
  item?: StockItemSummary;
  warehouse?: StockWarehouseSummary;
}

/** Paginación estándar del backend */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Respuesta paginada de stock */
export interface StocksResponse {
  data: Stock[];
  meta: Pagination;
}

/** Respuesta de un solo stock */
interface StockResponse {
  data: Stock;
}

/** Respuesta del transfer (from + to) */
interface TransferResponse {
  data: { from: Stock; to: Stock };
}

// ── Alert types ──────────────────────────────────────────────────────────

export type AlertType =
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "OVERSTOCK";
export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface StockAlert {
  id: string;
  itemId: string;
  warehouseId: string;
  type: AlertType;
  message: string;
  severity: AlertSeverity;
  isRead: boolean;
  readBy: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface StockAlertsResponse {
  data: StockAlert[];
  meta: Pagination;
}

// ── Dashboard types ──────────────────────────────────────────────────────

export interface DashboardMetrics {
  totalItems: number;
  totalWarehouses: number;
  totalStockValue: number;
  stockHealth: { inStock: number; lowStock: number; outOfStock: number };
  movements: { today: number; thisWeek: number; thisMonth: number };
  alerts: { critical: number; warning: number; info: number };
  topMovingItems: Array<{
    itemId: string;
    itemName: string;
    movementCount: number;
    lastMovement: string;
  }>;
  topWarehouses: Array<{
    warehouseId: string;
    warehouseName: string;
    itemCount: number;
    totalValue: number;
  }>;
  recentActivities: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface DashboardSummary {
  stockHealth: { inStock: number; lowStock: number; outOfStock: number };
  movements: { today: number; thisWeek: number; thisMonth: number };
  alerts: { critical: number; warning: number; info: number };
  totalStockValue: number;
  topMovingItems: Array<{
    itemId: string;
    itemName: string;
    movementCount: number;
    lastMovement: string;
  }>;
}

// ── Request DTOs ─────────────────────────────────────────────────────────

export interface CreateStockRequest {
  itemId: string;
  warehouseId: string;
  quantityReal?: number;
  quantityReserved?: number;
  averageCost?: number;
}

export interface UpdateStockRequest {
  quantityReal?: number;
  quantityReserved?: number;
  averageCost?: number;
}

export interface AdjustStockRequest {
  itemId: string;
  warehouseId: string;
  quantityChange: number;
  reason: string;
  movementId?: string;
}

export interface ReserveStockRequest {
  itemId: string;
  warehouseId: string;
  quantity: number;
  reservationId?: string;
}

export interface ReleaseStockRequest {
  itemId: string;
  warehouseId: string;
  quantity: number;
  reservationId?: string;
}

export interface TransferStockRequest {
  itemId: string;
  warehouseFromId: string;
  warehouseToId: string;
  quantity: number;
  movementId?: string;
}

// ── Stock CRUD ───────────────────────────────────────────────────────────

export const getStocks = async (
  page = 1,
  limit = 20,
  filters?: {
    itemId?: string;
    warehouseId?: string;
    lowStock?: boolean;
    outOfStock?: boolean;
    search?: string;
  },
): Promise<StocksResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (filters?.itemId) params.append("itemId", filters.itemId);
  if (filters?.warehouseId) params.append("warehouseId", filters.warehouseId);
  if (filters?.lowStock) params.append("lowStock", "true");
  if (filters?.outOfStock) params.append("outOfStock", "true");

  const response = await apiClient.get(`/inventory/stock?${params}`);
  return response.data;
};

export const getStock = async (id: string): Promise<StockResponse> => {
  const response = await apiClient.get(`/inventory/stock/${id}`);
  return response.data;
};

export const getStockByItem = async (
  itemId: string,
  page = 1,
  limit = 20,
): Promise<StocksResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const response = await apiClient.get(
    `/inventory/stock/item/${itemId}?${params}`,
  );
  return response.data;
};

export const getStockByWarehouse = async (
  warehouseId: string,
  page = 1,
  limit = 20,
): Promise<StocksResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const response = await apiClient.get(
    `/inventory/stock/warehouse/${warehouseId}?${params}`,
  );
  return response.data;
};

export const getLowStock = async (
  warehouseId?: string,
  page = 1,
  limit = 20,
): Promise<StocksResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (warehouseId) params.append("warehouseId", warehouseId);
  const response = await apiClient.get(`/inventory/stock/low-stock?${params}`);
  return response.data;
};

export const getOutOfStock = async (
  warehouseId?: string,
  page = 1,
  limit = 20,
): Promise<StocksResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (warehouseId) params.append("warehouseId", warehouseId);
  const response = await apiClient.get(
    `/inventory/stock/out-of-stock?${params}`,
  );
  return response.data;
};

export const createStock = async (
  data: CreateStockRequest,
): Promise<StockResponse> => {
  const response = await apiClient.post("/inventory/stock", data);
  return response.data;
};

export const updateStock = async (
  id: string,
  data: UpdateStockRequest,
): Promise<StockResponse> => {
  const response = await apiClient.put(`/inventory/stock/${id}`, data);
  return response.data;
};

// ── Operaciones especiales ───────────────────────────────────────────────

export const adjustStock = async (
  data: AdjustStockRequest,
): Promise<StockResponse> => {
  const response = await apiClient.post("/inventory/stock/adjust", data);
  return response.data;
};

export const reserveStock = async (
  data: ReserveStockRequest,
): Promise<StockResponse> => {
  const response = await apiClient.post("/inventory/stock/reserve", data);
  return response.data;
};

export const releaseStock = async (
  data: ReleaseStockRequest,
): Promise<StockResponse> => {
  const response = await apiClient.post("/inventory/stock/release", data);
  return response.data;
};

export const transferStock = async (
  data: TransferStockRequest,
): Promise<TransferResponse> => {
  const response = await apiClient.post("/inventory/stock/transfer", data);
  return response.data;
};

// ── Alerts ───────────────────────────────────────────────────────────────

export const getStockAlerts = async (
  page = 1,
  limit = 20,
  filters?: {
    type?: AlertType;
    itemId?: string;
    warehouseId?: string;
    isRead?: boolean;
    severity?: AlertSeverity;
  },
): Promise<StockAlertsResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (filters?.type) params.append("type", filters.type);
  if (filters?.itemId) params.append("itemId", filters.itemId);
  if (filters?.warehouseId) params.append("warehouseId", filters.warehouseId);
  if (filters?.isRead !== undefined)
    params.append("isRead", String(filters.isRead));
  if (filters?.severity) params.append("severity", filters.severity);

  const response = await apiClient.get(`/inventory/stock/alerts?${params}`);
  return response.data;
};

export const markAlertAsRead = async (
  id: string,
): Promise<{ data: StockAlert }> => {
  const response = await apiClient.patch(
    `/inventory/stock/alerts/${id}/read`,
    {},
  );
  return response.data;
};

export const markAllAlertsAsRead = async (): Promise<{ success: boolean }> => {
  const response = await apiClient.patch(
    `/inventory/stock/alerts/mark-all-read`,
    {},
  );
  return response.data;
};

export const deleteAlert = async (
  id: string,
): Promise<{ success: boolean }> => {
  const response = await apiClient.delete(`/inventory/stock/alerts/${id}`);
  return response.data;
};

// ── Dashboard / Reports ──────────────────────────────────────────────────

export const getDashboardMetrics = async (): Promise<{
  data: DashboardMetrics;
}> => {
  const response = await apiClient.get("/inventory/reports/dashboard");
  return response.data;
};

export const getDashboardSummary = async (): Promise<{
  data: DashboardSummary;
}> => {
  const response = await apiClient.get("/inventory/reports/dashboard/summary");
  return response.data;
};
