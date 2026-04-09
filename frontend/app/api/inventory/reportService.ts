import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";

// ============================================================================
// ENUMS & TYPES
// ============================================================================

export enum ReportFormat {
  CSV = "csv",
  EXCEL = "excel",
  PDF = "pdf",
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface LowStockItem {
  itemId: string;
  itemName: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  currentQuantity: number;
  minStock: number;
  daysUntilStockout: number;
  reorderPoint: number;
  lastMovementAt?: string;
}

export interface DeadStockItem {
  itemId: string;
  itemName: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  currentQuantity: number;
  lastMovementAt: string;
  daysInactive: number;
  stockValue: number;
  costPerUnit: number;
}

export interface StockValueItem {
  itemId: string;
  itemName: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  percentageOfTotal: number;
}

export interface ExitWithoutInvoice {
  exitNoteId: string;
  exitNoteNumber: string;
  createdAt: string;
  recipientName?: string;
  recipientId?: string;
  itemCount: number;
  totalQuantity: number;
  notes?: string;
}

export interface MovementReportItem {
  movementId: string;
  movementNumber: string;
  date: string;
  type: string; // PURCHASE, SALE, ADJUSTMENT_IN, ADJUSTMENT_OUT, TRANSFER, etc.
  itemId: string;
  itemName: string;
  quantity: number;
  warehouseFrom?: string;
  warehouseTo?: string;
  reference?: string;
  userName: string;
}

export interface MovementSummary {
  date: string;
  totalMovements: number;
  byType: {
    PURCHASE: number;
    SALE: number;
    ADJUSTMENT_IN: number;
    ADJUSTMENT_OUT: number;
    TRANSFER: number;
    [key: string]: number;
  };
  byWarehouse: {
    [warehouseId: string]: number;
  };
}

export interface StockValueFilters {
  warehouseId?: string;
  search?: string;
  zeroCostOnly?: boolean;
  sortBy?: "value_desc" | "value_asc" | "quantity_desc" | "name_asc";
}

export interface StockValueReportResponse
  extends PaginatedResponse<StockValueItem> {
  summary: {
    totalInventoryValue: number;
    filteredValue: number;
    isFiltered: boolean;
    byWarehouse: { warehouseId: string; warehouseName: string; totalValue: number; itemCount: number }[];
    top5Items: { itemName: string; itemSKU: string; warehouseName: string; totalValue: number; percentage: number }[];
    zeroCostCount: number;
    distinctItems: number;
    totalStockEntries: number;
  };
}

export interface KardexEntry {
  id: string;
  movementNumber: string;
  date: string;
  type: string;
  reference: string;
  quantityIn: number;
  quantityOut: number;
  balance: number;
  unitCost: number;
  totalCost: number;
  warehouseName: string;
  notes: string;
}

export interface KardexReportResponse {
  success: boolean;
  message: string;
  data: KardexEntry[];
  meta: {
    itemId: string;
    itemName: string;
    itemSKU: string;
    warehouseId?: string;
    warehouseName?: string;
    dateFrom?: string;
    dateTo?: string;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    openingBalance: number;
    closingBalance: number;
  };
}

// ============================================================================
// SERVICE
// ============================================================================

const reportService = {
  /**
   * Get low stock report
   */
  async getLowStock(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<LowStockItem>> {
    const response = await apiClient.get<PaginatedResponse<LowStockItem>>(
      `/inventory/reports/low-stock`,
      { params: { page, limit } },
    );
    return response.data;
  },

  /**
   * Get dead stock report
   */
  async getDeadStock(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<DeadStockItem>> {
    const response = await apiClient.get<PaginatedResponse<DeadStockItem>>(
      `/inventory/reports/dead-stock`,
      { params: { page, limit } },
    );
    return response.data;
  },

  /**
   * Get stock value report
   */
  async getStockValue(
    page: number = 1,
    limit: number = 20,
    filters: StockValueFilters = {},
  ): Promise<StockValueReportResponse> {
    const response = await apiClient.get<StockValueReportResponse>(
      `/inventory/reports/stock-value`,
      { params: { page, limit, ...filters } },
    );
    return response.data;
  },

  /**
   * Get exits without invoice report
   */
  async getExitsWithoutInvoice(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<ExitWithoutInvoice>> {
    const response = await apiClient.get<PaginatedResponse<ExitWithoutInvoice>>(
      `/inventory/reports/exits-without-invoice`,
      { params: { page, limit } },
    );
    return response.data;
  },

  /**
   * Get movements report
   */
  async getMovements(
    page: number = 1,
    limit: number = 20,
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      type?: string;
      warehouseId?: string;
      itemId?: string;
    },
  ): Promise<PaginatedResponse<MovementReportItem>> {
    const params: Record<string, any> = { page, limit };
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters?.dateTo) params.dateTo = filters.dateTo;
    if (filters?.type) params.type = filters.type;
    if (filters?.warehouseId) params.warehouseId = filters.warehouseId;
    if (filters?.itemId) params.itemId = filters.itemId;

    const response = await apiClient.get<PaginatedResponse<MovementReportItem>>(
      `/inventory/reports/movements`,
      { params },
    );
    return response.data;
  },

  /**
   * Get movements summary (grouped by date/type/warehouse)
   */
  async getMovementsSummary(filters?: {
    dateFrom?: string;
    dateTo?: string;
    groupBy?: "day" | "week" | "month";
    warehouseId?: string;
  }): Promise<ApiResponse<MovementSummary[]>> {
    const params: Record<string, any> = {};
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters?.dateTo) params.dateTo = filters.dateTo;
    if (filters?.groupBy) params.groupBy = filters.groupBy;
    if (filters?.warehouseId) params.warehouseId = filters.warehouseId;

    const response = await apiClient.get<ApiResponse<MovementSummary[]>>(
      `/inventory/reports/movements/summary`,
      { params },
    );
    return response.data;
  },

  /**
   * Export report to specified format
   * Returns a Blob that triggers browser download
   */
  async export(
    reportType:
      | "stock-value"
      | "movements"
      | "abc"
      | "turnover"
      | "low-stock"
      | "dead-stock",
    format: ReportFormat,
    filters?: Record<string, any>,
  ): Promise<Blob> {
    const params: Record<string, any> = { format };

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params[key] = value;
        }
      });
    }

    const response = await apiClient.get(
      `/inventory/reports/export/${reportType}`,
      {
        params,
        responseType: "blob",
      },
    );

    return response.data;
  },

  /**
   * Get Kardex report for a specific item
   */
  async getKardex(params: {
    itemId: string;
    warehouseId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<KardexReportResponse> {
    const response = await apiClient.get<KardexReportResponse>(
      `/inventory/reports/kardex`,
      { params },
    );
    return response.data;
  },

  /**
   * Download a report blob with proper filename
   */
  async download(
    reportType:
      | "stock-value"
      | "movements"
      | "abc"
      | "turnover"
      | "low-stock"
      | "dead-stock",
    format: ReportFormat,
    filters?: Record<string, any>,
  ): Promise<void> {
    try {
      const blob = await this.export(reportType, format, filters);

      // Determine file extension
      let extension = "csv";
      let mimeType = "text/csv";
      if (format === ReportFormat.EXCEL) {
        extension = "xlsx";
        mimeType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      } else if (format === ReportFormat.PDF) {
        extension = "pdf";
        mimeType = "application/pdf";
      }

      // Create blob with correct mime type
      const typedBlob = new Blob([blob], { type: mimeType });

      // Create download link
      const url = window.URL.createObjectURL(typedBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportType}_${new Date().getTime()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading report:", error);
      throw error;
    }
  },
};

export default reportService;
