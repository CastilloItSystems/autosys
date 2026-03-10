/**
 * Bulk Operations Service
 * Handles CSV import/export and bulk operations for items
 */

import apiClient from "../apiClient";

export interface IBulkImportRequest {
  fileName: string;
  fileContent: string; // CSV content as string
  mapping?: Record<string, string>; // column mapping
  options?: {
    skipHeaderRow?: boolean;
    updateExisting?: boolean;
    validateOnly?: boolean;
  };
}

export interface IBulkExportRequest {
  format?: "csv" | "json" | "xlsx";
  filters?: {
    categoryId?: string;
    brandId?: string;
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
    inStock?: boolean;
  };
  columns?: string[];
}

export interface IBulkUpdateRequest {
  filter: Record<string, any>;
  update: Record<string, any>;
  options?: {
    validateOnly?: boolean;
    skipValidation?: boolean;
  };
}

export interface IBulkDeleteRequest {
  filter: Record<string, any>;
  permanent?: boolean;
}

export interface IBulkValidationError {
  rowNumber: number;
  field: string;
  error: string;
  value: any;
}

export interface IBulkOperationResult {
  operationId: string;
  imported: number;
  updated: number;
  failed: number;
  errors?: Array<{
    rowNumber: number;
    field: string;
    value: any;
    error: string;
  }>;
}

export interface IBulkOperation {
  id: string;
  operationType: "IMPORT" | "EXPORT" | "UPDATE" | "DELETE";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  fileName?: string;
  fileUrl?: string;
  totalRecords: number;
  processedRecords: number;
  errorRecords: number;
  errorDetails?: string | IBulkValidationError[];
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface IBulkOperationsResponse {
  data: IBulkOperation[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Import items from CSV
 */
export const importItems = async (
  request: IBulkImportRequest,
): Promise<IBulkOperationResult> => {
  const response = await apiClient.post<IBulkOperationResult>(
    `/inventory/items/bulk/import`,
    request,
  );
  return response.data;
};

/**
 * Export items to CSV/JSON/Excel
 */
export const exportItems = async (
  request: IBulkExportRequest,
): Promise<Blob> => {
  const response = await apiClient.post<Blob>(
    `/inventory/items/bulk/export`,
    request,
    {
      responseType: "blob",
    },
  );
  return response.data;
};

/**
 * Bulk update items
 */
export const bulkUpdate = async (
  request: IBulkUpdateRequest,
): Promise<IBulkOperationResult> => {
  const response = await apiClient.patch<IBulkOperationResult>(
    `/inventory/items/bulk/update`,
    request,
  );
  return response.data;
};

/**
 * Bulk delete items
 */
export const bulkDelete = async (
  request: IBulkDeleteRequest,
): Promise<IBulkOperationResult> => {
  const response = await apiClient.delete<IBulkOperationResult>(
    `/inventory/items/bulk/delete`,
    {
      data: request,
    },
  );
  return response.data;
};

/**
 * Get bulk operations history
 */
export const getOperations = async (
  page: number = 1,
  limit: number = 20,
): Promise<IBulkOperationsResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const response = await apiClient.get<IBulkOperationsResponse>(
    `/inventory/items/bulk/operations?${params.toString()}`,
  );
  return response.data;
};

/**
 * Get single operation details
 */
export const getOperation = async (
  operationId: string,
): Promise<{ data: IBulkOperation }> => {
  const response = await apiClient.get<{ data: IBulkOperation }>(
    `/inventory/items/bulk/operations/${operationId}`,
  );
  return response.data;
};

/**
 * Download CSV template
 */
export const downloadTemplate = async (): Promise<Blob> => {
  // The template file is served from the frontend `public/templates` folder.
  // In Next.js files placed in `public/` are available at the site root: `/templates/...`.
  const resp = await fetch('/templates/items-import-template.csv');
  if (!resp.ok) {
    throw new Error(`Plantilla no encontrada (${resp.status})`);
  }
  const blob = await resp.blob();
  return blob;
};

/**
 * Helper: Convert Blob to download link
 */
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default {
  importItems,
  exportItems,
  bulkUpdate,
  bulkDelete,
  getOperations,
  getOperation,
  downloadTemplate,
  downloadBlob,
};
