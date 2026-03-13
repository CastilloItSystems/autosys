import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";

/**
 * Brand Type Definition
 */
export type BrandType = "VEHICLE" | "PART" | "BOTH";

export const BRAND_TYPE_LABELS: Record<BrandType, string> = {
  VEHICLE: "Vehículo",
  PART: "Producto/Repuesto",
  BOTH: "Ambos",
};

/**
 * Brand Entity Interface
 */
export interface Brand {
  id: string;
  code: string;
  name: string;
  type: BrandType;
  typeLabel: string;
  isActive: boolean;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  stats?: {
    itemsCount: number;
    modelsCount: number;
  };
}

/**
 * Request/Parameter Interfaces
 */
export interface GetBrandsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: BrandType;
  isActive?: "true" | "false";
}

export interface CreateBrandRequest {
  code: string;
  name: string;
  type: BrandType;
  description?: string;
}

export interface UpdateBrandRequest {
  code?: string;
  name?: string;
  type?: BrandType;
  isActive?: boolean;
  description?: string;
}

export interface BrandStatsResponse {
  data: {
    totalItems: number;
    activeItems: number;
    inactiveItems: number;
  };
}

/**
 * Base Route
 */
const BASE_ROUTE = "/inventory/catalogs/brands";

/**
 * Brands Service
 * Handles all API calls related to brands catalog management
 */
const brandsService = {
  /**
   * Get all brands with pagination and filters
   */
  async getAll(params?: GetBrandsParams): Promise<PaginatedResponse<Brand>> {
    const res = await apiClient.get(BASE_ROUTE, { params });
    return res.data;
  },

  /**
   * Get only active brands
   */
  async getActive(type?: BrandType): Promise<ApiResponse<Brand[]>> {
    const res = await apiClient.get(`${BASE_ROUTE}/active`, {
      params: type ? { type } : undefined,
    });
    return res.data;
  },

  /**
   * Get brands grouped
   */
  async getGrouped(params?: {
    search?: string;
    isActive?: "true" | "false";
  }): Promise<ApiResponse<any>> {
    const res = await apiClient.get(`${BASE_ROUTE}/grouped`, { params });
    return res.data;
  },

  /**
   * Search brands by query
   */
  async search(query: string): Promise<ApiResponse<Brand[]>> {
    const res = await apiClient.get(`${BASE_ROUTE}/search`, {
      params: { q: query },
    });
    return res.data;
  },

  /**
   * Get single brand by ID
   */
  async getById(id: string): Promise<ApiResponse<Brand>> {
    const res = await apiClient.get(`${BASE_ROUTE}/${id}`);
    return res.data;
  },

  /**
   * Get brand statistics
   */
  async getStats(id: string): Promise<BrandStatsResponse> {
    const res = await apiClient.get(`${BASE_ROUTE}/${id}/stats`);
    return res.data;
  },

  /**
   * Create a new brand
   */
  async create(data: CreateBrandRequest): Promise<ApiResponse<Brand>> {
    const res = await apiClient.post(BASE_ROUTE, data);
    return res.data;
  },

  /**
   * Update a brand
   */
  async update(
    id: string,
    data: UpdateBrandRequest,
  ): Promise<ApiResponse<Brand>> {
    const res = await apiClient.put(`${BASE_ROUTE}/${id}`, data);
    return res.data;
  },

  /**
   * Toggle brand active status
   */
  async toggleActive(id: string): Promise<ApiResponse<Brand>> {
    const res = await apiClient.patch(`${BASE_ROUTE}/${id}/toggle`);
    return res.data;
  },

  /**
   * Reactivate a brand
   */
  async reactivate(id: string): Promise<ApiResponse<Brand>> {
    const res = await apiClient.patch(`${BASE_ROUTE}/${id}/reactivate`);
    return res.data;
  },

  /**
   * Soft delete a brand
   */
  async delete(id: string): Promise<ApiResponse<Brand>> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}`);
    return res.data;
  },

  /**
   * Hard delete a brand (permanent deletion)
   */
  async hardDelete(id: string): Promise<ApiResponse<Brand>> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}/hard`);
    return res.data;
  },
};

export default brandsService;
