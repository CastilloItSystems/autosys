/**
 * Bulk Operations Service
 * Handles CSV import/export and bulk operations for items
 */

import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";

// ============================================================================
// ENTITY
// ============================================================================

export type BulkOperationType = "IMPORT" | "EXPORT" | "UPDATE" | "DELETE";
export type BulkOperationStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "COMPLETED_WITH_ERRORS"
  | "FAILED"
  | "CANCELLED";

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
  operationType: BulkOperationType;
  status: BulkOperationStatus;
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

// ============================================================================
// REQUEST PARAMS & DTOs
// ============================================================================

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

export interface GetOperationsParams {
  page?: number;
  limit?: number;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

interface BulkOperationsResponse extends PaginatedResponse<IBulkOperation> {
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

const bulkService = {
  // Import items — sends as multipart/form-data to avoid JSON string-length limits
  async importItems(
    request: IBulkImportRequest,
  ): Promise<IBulkOperationResult> {
    const form = new FormData();
    // CSV content as a Blob (binary transport, no JSON overhead)
    const blob = new Blob([request.fileContent], { type: "text/csv" });
    form.append("file", blob, request.fileName || "import.csv");
    form.append("options", JSON.stringify(request.options ?? {}));

    // apiClient defaults Content-Type to application/json which breaks FormData.
    // transformRequest deletes that header so the browser sets the correct
    // "multipart/form-data; boundary=…" value automatically.
    const res = await apiClient.post<{ data: IBulkOperationResult }>(
      `/inventory/items/bulk/import`,
      form,
      {
        transformRequest: [(data: any, headers: any) => {
          if (data instanceof FormData) {
            if (headers) {
              delete headers["Content-Type"];
              if (headers.common) delete headers.common["Content-Type"];
              if (headers.post)   delete headers.post["Content-Type"];
            }
            return data;
          }
          return JSON.stringify(data);
        }],
      },
    );
    return res.data.data;
  },

  // Export items to CSV/JSON/Excel
  async exportItems(request: IBulkExportRequest): Promise<Blob> {
    try {
      const res = await apiClient.post<Blob>(
        `/inventory/items/bulk/export`,
        request,
        {
          responseType: "blob",
        },
      );
      return res.data;
    } catch (error: any) {
      // If backend returns 404 (e.g., no items match export filters), return an empty file
      // so the UI can still download a valid (but empty) export.
      if (error?.response?.status === 404) {
        const mimeTypeMap: Record<string, string> = {
          json: "application/json",
          xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          csv: "text/csv",
        };
        const mimeType = mimeTypeMap[request.format ?? "csv"] ?? "text/csv";
        return new Blob([""], { type: mimeType });
      }
      throw error;
    }
  },

  // Bulk update items
  async bulkUpdate(request: IBulkUpdateRequest): Promise<IBulkOperationResult> {
    const res = await apiClient.patch<{ data: IBulkOperationResult }>(
      `/inventory/items/bulk/update`,
      request,
    );
    return res.data.data;
  },

  // Bulk delete items
  async bulkDelete(request: IBulkDeleteRequest): Promise<IBulkOperationResult> {
    const res = await apiClient.delete<{ data: IBulkOperationResult }>(
      `/inventory/items/bulk/delete`,
      {
        data: request,
      },
    );
    return res.data.data;
  },

  // Get bulk operations history
  async getOperations(
    params?: GetOperationsParams,
  ): Promise<BulkOperationsResponse> {
    const res = await apiClient.get<BulkOperationsResponse>(
      `/inventory/items/bulk/operations`,
      { params },
    );
    return res.data;
  },

  // Get single operation details
  async getOperation(operationId: string): Promise<{ data: IBulkOperation }> {
    const res = await apiClient.get<{ data: IBulkOperation }>(
      `/inventory/items/bulk/operations/${operationId}`,
    );
    return res.data;
  },

  // Download CSV template
  async downloadTemplate(): Promise<Blob> {
    // The template file is served from the frontend `public/templates` folder.
    // In Next.js files placed in `public/` are available at the site root: `/templates/...`.
    const resp = await fetch("/templates/items-import-template.csv");
    if (!resp.ok) {
      throw new Error(`Plantilla no encontrada (${resp.status})`);
    }
    return await resp.blob();
  },

  // Helper: Convert Blob to download link
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
};

export default bulkService;
