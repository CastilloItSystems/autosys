import apiClient from '../apiClient';

// ============================================================================
// ENUMS & TYPES
// ============================================================================

export enum ReportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
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

export interface LowStockResponse {
  success: boolean;
  data: LowStockItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

export interface DeadStockResponse {
  success: boolean;
  data: DeadStockItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

export interface StockValueResponse {
  success: boolean;
  data: StockValueItem[];
  summary: {
    totalInventoryValue: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

export interface ExitsWithoutInvoiceResponse {
  success: boolean;
  data: ExitWithoutInvoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

export interface MovementReportResponse {
  success: boolean;
  data: MovementReportItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

export interface MovementSummaryResponse {
  success: boolean;
  data: MovementSummary[];
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Get low stock report
 */
export const getLowStockReport = async (
  page: number = 1,
  limit: number = 20
): Promise<LowStockResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const response = await apiClient.get<LowStockResponse>(
    `/inventory/reports/low-stock?${params.toString()}`
  );
  return response.data;
};

/**
 * Get dead stock report
 */
export const getDeadStockReport = async (
  page: number = 1,
  limit: number = 20
): Promise<DeadStockResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const response = await apiClient.get<DeadStockResponse>(
    `/inventory/reports/dead-stock?${params.toString()}`
  );
  return response.data;
};

/**
 * Get stock value report
 */
export const getStockValueReport = async (
  page: number = 1,
  limit: number = 20
): Promise<StockValueResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const response = await apiClient.get<StockValueResponse>(
    `/inventory/reports/stock-value?${params.toString()}`
  );
  return response.data;
};

/**
 * Get exits without invoice report
 */
export const getExitsWithoutInvoice = async (
  page: number = 1,
  limit: number = 20
): Promise<ExitsWithoutInvoiceResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const response = await apiClient.get<ExitsWithoutInvoiceResponse>(
    `/inventory/reports/exits-without-invoice?${params.toString()}`
  );
  return response.data;
};

/**
 * Get movements report
 */
export const getMovementsReport = async (
  page: number = 1,
  limit: number = 20,
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    type?: string;
    warehouseId?: string;
    itemId?: string;
  }
): Promise<MovementReportResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);
  if (filters?.itemId) params.append('itemId', filters.itemId);

  const response = await apiClient.get<MovementReportResponse>(
    `/inventory/reports/movements?${params.toString()}`
  );
  return response.data;
};

/**
 * Get movements summary (grouped by date/type/warehouse)
 */
export const getMovementsSummary = async (filters?: {
  dateFrom?: string;
  dateTo?: string;
  groupBy?: 'day' | 'week' | 'month';
  warehouseId?: string;
}): Promise<MovementSummaryResponse> => {
  const params = new URLSearchParams();
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);
  if (filters?.groupBy) params.append('groupBy', filters.groupBy);
  if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);

  const response = await apiClient.get<MovementSummaryResponse>(
    `/inventory/reports/movements/summary?${params.toString()}`
  );
  return response.data;
};

/**
 * Export report to specified format
 * Returns a Blob that triggers browser download
 */
export const exportReport = async (
  reportType:
    | 'stock-value'
    | 'movements'
    | 'abc'
    | 'turnover'
    | 'low-stock'
    | 'dead-stock',
  format: ReportFormat,
  filters?: Record<string, any>
): Promise<Blob> => {
  const params = new URLSearchParams({
    format: format,
  });

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, String(value));
      }
    });
  }

  const response = await apiClient.get(
    `/inventory/reports/export/${reportType}?${params.toString()}`,
    {
      responseType: 'blob',
    }
  );

  return response.data;
};

/**
 * Download a report blob with proper filename
 */
export const downloadReport = async (
  reportType: 'stock-value' | 'movements' | 'abc' | 'turnover' | 'low-stock' | 'dead-stock',
  format: ReportFormat,
  filters?: Record<string, any>
): Promise<void> => {
  try {
    const blob = await exportReport(reportType, format, filters);

    // Determine file extension
    let extension = 'csv';
    let mimeType = 'text/csv';
    if (format === ReportFormat.EXCEL) {
      extension = 'xlsx';
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (format === ReportFormat.PDF) {
      extension = 'pdf';
      mimeType = 'application/pdf';
    }

    // Create blob with correct mime type
    const typedBlob = new Blob([blob], { type: mimeType });

    // Create download link
    const url = window.URL.createObjectURL(typedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType}_${new Date().getTime()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading report:', error);
    throw error;
  }
};

export default {
  getLowStockReport,
  getDeadStockReport,
  getStockValueReport,
  getExitsWithoutInvoice,
  getMovementsReport,
  getMovementsSummary,
  exportReport,
  downloadReport,
};
