/**
 * Shared API Response Types
 * Generic response interfaces used across all inventory services
 */

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

/**
 * Pagination metadata
 */
export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * API response with pagination metadata
 * Used for list endpoints that return paginated data
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginatedMeta;
}
