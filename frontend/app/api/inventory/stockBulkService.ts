/**
 * Stock Bulk Operations Service
 * Handles CSV import, adjustment, transfer, and export for stock
 */

import apiClient from "../apiClient";
import { PaginatedResponse } from "./types";

// ============================================================================
// ENTITY
// ============================================================================

export type StockBulkOperationType =
  | "STOCK_IMPORT"
  | "STOCK_ADJUSTMENT"
  | "STOCK_TRANSFER"
  | "STOCK_EXPORT";

export type BulkOperationStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "COMPLETED_WITH_ERRORS"
  | "FAILED"
  | "CANCELLED";

export interface IStockBulkError {
  rowNumber: number;
  sku?: string;
  warehouseCode?: string;
  error: string;
}

export interface IStockBulkResult {
  operationId: string;
  processed: number;
  failed: number;
  errors: IStockBulkError[];
}

export interface IStockBulkOperation {
  id: string;
  operationType: StockBulkOperationType;
  status: BulkOperationStatus;
  fileName?: string;
  totalRecords: number;
  processedRecords: number;
  errorRecords: number;
  errorDetails?: string | IStockBulkError[];
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// ============================================================================
// REQUEST PARAMS
// ============================================================================

export interface IStockImportOptions {
  updateExisting?: boolean;
}

export interface IStockExportRequest {
  format?: "csv" | "json" | "xlsx";
  filters?: {
    warehouseId?: string;
    itemId?: string;
    categoryId?: string;
    minQuantity?: number;
    maxQuantity?: number;
    lowStock?: boolean;
    outOfStock?: boolean;
  };
  columns?: string[];
}

interface StockBulkOperationsResponse extends PaginatedResponse<IStockBulkOperation> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// SERVICE
// ============================================================================

/** Let axios handle multipart boundaries by deleting the Content-Type header */
const multipartTransform = (data: any, headers: any) => {
  if (data instanceof FormData) {
    if (headers) {
      delete headers["Content-Type"];
      if (headers.common) delete headers.common["Content-Type"];
      if (headers.post) delete headers.post["Content-Type"];
    }
    return data;
  }
  return JSON.stringify(data);
};

const stockBulkService = {
  /**
   * POST /stock/bulk/import  (multipart — direct file upload)
   * CSV columns: sku, warehouseCode, quantity, unitCost, location, notes
   */
  async importStock(
    file: File,
    options?: IStockImportOptions
  ): Promise<IStockBulkResult> {
    const form = new FormData();
    form.append("file", file, file.name);
    form.append("options", JSON.stringify(options ?? {}));
    const res = await apiClient.post<{ data: IStockBulkResult }>(
      `/inventory/stock/bulk/import`,
      form,
      { transformRequest: [multipartTransform] }
    );
    return res.data.data;
  },

  /**
   * POST /stock/bulk/import  (JSON body — used after Excel→CSV mapping)
   */
  async importStockFromContent(
    fileContent: string,
    fileName: string,
    options?: IStockImportOptions
  ): Promise<IStockBulkResult> {
    const res = await apiClient.post<{ data: IStockBulkResult }>(
      `/inventory/stock/bulk/import`,
      { fileContent, fileName, options: options ?? {} }
    );
    return res.data.data;
  },

  /**
   * POST /stock/bulk/adjust  (multipart — direct file upload)
   */
  async adjustStock(file: File): Promise<IStockBulkResult> {
    const form = new FormData();
    form.append("file", file, file.name);
    const res = await apiClient.post<{ data: IStockBulkResult }>(
      `/inventory/stock/bulk/adjust`,
      form,
      { transformRequest: [multipartTransform] }
    );
    return res.data.data;
  },

  /**
   * POST /stock/bulk/adjust  (JSON body — used after Excel→CSV mapping)
   */
  async adjustStockFromContent(
    fileContent: string,
    fileName: string
  ): Promise<IStockBulkResult> {
    const res = await apiClient.post<{ data: IStockBulkResult }>(
      `/inventory/stock/bulk/adjust`,
      { fileContent, fileName }
    );
    return res.data.data;
  },

  /**
   * POST /stock/bulk/transfer  (multipart — direct file upload)
   */
  async transferStock(file: File): Promise<IStockBulkResult> {
    const form = new FormData();
    form.append("file", file, file.name);
    const res = await apiClient.post<{ data: IStockBulkResult }>(
      `/inventory/stock/bulk/transfer`,
      form,
      { transformRequest: [multipartTransform] }
    );
    return res.data.data;
  },

  /**
   * POST /stock/bulk/transfer  (JSON body — used after Excel→CSV mapping)
   */
  async transferStockFromContent(
    fileContent: string,
    fileName: string
  ): Promise<IStockBulkResult> {
    const res = await apiClient.post<{ data: IStockBulkResult }>(
      `/inventory/stock/bulk/transfer`,
      { fileContent, fileName }
    );
    return res.data.data;
  },

  /** POST /stock/bulk/export */
  async exportStock(request: IStockExportRequest): Promise<Blob> {
    const res = await apiClient.post<Blob>(
      `/inventory/stock/bulk/export`,
      request,
      { responseType: "blob" }
    );
    return res.data;
  },

  /** GET /stock/bulk/operations */
  async getOperations(
    params?: { page?: number; limit?: number }
  ): Promise<StockBulkOperationsResponse> {
    const res = await apiClient.get<StockBulkOperationsResponse>(
      `/inventory/stock/bulk/operations`,
      { params }
    );
    return res.data;
  },

  /** GET /stock/bulk/operations/:operationId */
  async getOperation(operationId: string): Promise<{ data: IStockBulkOperation }> {
    const res = await apiClient.get<{ data: IStockBulkOperation }>(
      `/inventory/stock/bulk/operations/${operationId}`
    );
    return res.data;
  },

  /** Helper to trigger browser download from a Blob */
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /** Generate a CSV template string for a given operation type */
  getTemplateCSV(type: "import" | "adjust" | "transfer"): string {
    if (type === "import") {
      return [
        "sku,warehouseCode,quantity,unitCost,location,notes",
        "SKU001,WH01,100,25.50,A1-R01-D01,Carga inicial",
        "SKU002,WH01,50,15.00,,",
      ].join("\n");
    }
    if (type === "adjust") {
      return [
        "sku,warehouseCode,quantity,movementType,reference,notes",
        "SKU001,WH01,10,ADJUSTMENT_IN,CONT-2026-01,Conteo físico",
        "SKU002,WH01,-5,ADJUSTMENT_OUT,CONT-2026-01,Artículos dañados",
        "SKU003,WH01,20,PURCHASE,OC-2026-042,Recepción compra",
      ].join("\n");
    }
    return [
      "sku,fromWarehouseCode,toWarehouseCode,quantity,notes",
      "SKU001,WH01,WH02,20,Traslado sucursal norte",
      "SKU002,WH01,WH02,10,",
    ].join("\n");
  },
};

export default stockBulkService;
