import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";

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
  category?: { id: string; name: string } | null;
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
  location?: string | null;
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

// ── Stock Service ───────────────────────────────────────────────────────

const stockService = {
  // ── Stock CRUD ───────────────────────────────────────────────────────────

  async getAll(
    page = 1,
    limit = 20,
    filters?: {
      itemId?: string;
      warehouseId?: string;
      lowStock?: boolean;
      outOfStock?: boolean;
      search?: string;
    },
  ): Promise<StocksResponse> {
    const params: Record<string, any> = { page, limit };
    if (filters?.itemId) params.itemId = filters.itemId;
    if (filters?.warehouseId) params.warehouseId = filters.warehouseId;
    if (filters?.lowStock) params.lowStock = "true";
    if (filters?.outOfStock) params.outOfStock = "true";

    const response = await apiClient.get<StocksResponse>(`/inventory/stock`, {
      params,
    });
    return response.data;
  },

  async getById(id: string): Promise<ApiResponse<Stock>> {
    const response = await apiClient.get<ApiResponse<Stock>>(
      `/inventory/stock/${id}`,
    );
    return response.data;
  },

  async getByItem(
    itemId: string,
    page = 1,
    limit = 20,
  ): Promise<StocksResponse> {
    const response = await apiClient.get<StocksResponse>(
      `/inventory/stock/item/${itemId}`,
      { params: { page, limit } },
    );
    return response.data;
  },

  async getByWarehouse(
    warehouseId: string,
    page = 1,
    limit = 20,
  ): Promise<StocksResponse> {
    const response = await apiClient.get<StocksResponse>(
      `/inventory/stock/warehouse/${warehouseId}`,
      { params: { page, limit } },
    );
    return response.data;
  },

  async getLowStock(
    warehouseId?: string,
    page = 1,
    limit = 20,
  ): Promise<StocksResponse> {
    const params: Record<string, any> = { page, limit };
    if (warehouseId) params.warehouseId = warehouseId;

    const response = await apiClient.get<StocksResponse>(
      `/inventory/stock/low-stock`,
      { params },
    );
    return response.data;
  },

  async getOutOfStock(
    warehouseId?: string,
    page = 1,
    limit = 20,
  ): Promise<StocksResponse> {
    const params: Record<string, any> = { page, limit };
    if (warehouseId) params.warehouseId = warehouseId;

    const response = await apiClient.get<StocksResponse>(
      `/inventory/stock/out-of-stock`,
      { params },
    );
    return response.data;
  },

  async create(data: CreateStockRequest): Promise<ApiResponse<Stock>> {
    const response = await apiClient.post<ApiResponse<Stock>>(
      "/inventory/stock",
      data,
    );
    return response.data;
  },

  async update(
    id: string,
    data: UpdateStockRequest,
  ): Promise<ApiResponse<Stock>> {
    const response = await apiClient.put<ApiResponse<Stock>>(
      `/inventory/stock/${id}`,
      data,
    );
    return response.data;
  },

  // ── Operaciones especiales ───────────────────────────────────────────────

  async adjust(data: AdjustStockRequest): Promise<ApiResponse<Stock>> {
    const response = await apiClient.post<ApiResponse<Stock>>(
      "/inventory/stock/adjust",
      data,
    );
    return response.data;
  },

  async reserve(data: ReserveStockRequest): Promise<ApiResponse<Stock>> {
    const response = await apiClient.post<ApiResponse<Stock>>(
      "/inventory/stock/reserve",
      data,
    );
    return response.data;
  },

  async release(data: ReleaseStockRequest): Promise<ApiResponse<Stock>> {
    const response = await apiClient.post<ApiResponse<Stock>>(
      "/inventory/stock/release",
      data,
    );
    return response.data;
  },

  async transfer(
    data: TransferStockRequest,
  ): Promise<ApiResponse<{ from: Stock; to: Stock }>> {
    const response = await apiClient.post<
      ApiResponse<{ from: Stock; to: Stock }>
    >("/inventory/stock/transfer", data);
    return response.data;
  },

  // ── Alerts ───────────────────────────────────────────────────────────────

  async getAlerts(
    page = 1,
    limit = 20,
    filters?: {
      type?: AlertType;
      itemId?: string;
      warehouseId?: string;
      isRead?: boolean;
      severity?: AlertSeverity;
    },
  ): Promise<StockAlertsResponse> {
    const params: Record<string, any> = { page, limit };
    if (filters?.type) params.type = filters.type;
    if (filters?.itemId) params.itemId = filters.itemId;
    if (filters?.warehouseId) params.warehouseId = filters.warehouseId;
    if (filters?.isRead !== undefined) params.isRead = String(filters.isRead);
    if (filters?.severity) params.severity = filters.severity;

    const response = await apiClient.get<StockAlertsResponse>(
      `/inventory/stock/alerts`,
      { params },
    );
    return response.data;
  },

  async markAlertAsRead(id: string): Promise<ApiResponse<StockAlert>> {
    const response = await apiClient.patch<ApiResponse<StockAlert>>(
      `/inventory/stock/alerts/${id}/read`,
      {},
    );
    return response.data;
  },

  async markAllAlertsAsRead(): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.patch<ApiResponse<{ success: boolean }>>(
      `/inventory/stock/alerts/mark-all-read`,
      {},
    );
    return response.data;
  },

  async deleteAlert(id: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.delete<ApiResponse<{ success: boolean }>>(
      `/inventory/stock/alerts/${id}`,
    );
    return response.data;
  },

  // ── Dashboard / Reports ──────────────────────────────────────────────────

  async getDashboardMetrics(): Promise<ApiResponse<DashboardMetrics>> {
    const response = await apiClient.get<ApiResponse<DashboardMetrics>>(
      "/inventory/reports/dashboard",
    );
    return response.data;
  },

  async getDashboardSummary(): Promise<ApiResponse<DashboardSummary>> {
    const response = await apiClient.get<ApiResponse<DashboardSummary>>(
      "/inventory/reports/dashboard/summary",
    );
    return response.data;
  },
};

export default stockService;
