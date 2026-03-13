/**
 * Model Compatibility Service
 * Manages part × vehicle model compatibility matrix
 */

import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";

/**
 * Model Compatibility Entity Interface
 */
export interface ModelCompatibility {
  id: string;
  partModelId: string;
  vehicleModelId: string;
  isVerified: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  partModel?: {
    id: string;
    code: string;
    name: string;
    type: string;
    brand: {
      id: string;
      name: string;
    };
  };
  vehicleModel?: {
    id: string;
    code: string;
    name: string;
    year: number | null;
    type: string;
    brand: {
      id: string;
      name: string;
    };
  };
}

/**
 * Request/Parameter Interfaces
 */
export interface GetModelCompatibilityParams {
  partModelId?: string;
  vehicleModelId?: string;
  isVerified?: "true" | "false";
  partBrandId?: string;
  vehicleBrandId?: string;
  page?: number;
  limit?: number;
}

export interface CreateCompatibilityRequest {
  partModelId: string;
  vehicleModelId: string;
  notes?: string;
}

export interface UpdateCompatibilityRequest {
  notes?: string;
  isVerified?: boolean;
}

/**
 * Base Route
 */
const BASE_ROUTE = "/inventory/catalogs/model-compatibility";

/**
 * Model Compatibility Service
 * Handles all API calls related to part-vehicle compatibility management
 */
const modelCompatibilityService = {
  /**
   * Get all compatibility entries with optional filters
   */
  async getAll(
    params?: GetModelCompatibilityParams,
  ): Promise<PaginatedResponse<ModelCompatibility>> {
    const res = await apiClient.get(BASE_ROUTE, { params });
    return res.data;
  },

  /**
   * Get compatibility entries for a specific part model
   */
  async getByPartModel(
    partModelId: string,
  ): Promise<PaginatedResponse<ModelCompatibility>> {
    const res = await apiClient.get(`${BASE_ROUTE}/part/${partModelId}`);
    return res.data;
  },

  /**
   * Get compatibility entries for a specific vehicle model
   */
  async getByVehicleModel(
    vehicleModelId: string,
  ): Promise<PaginatedResponse<ModelCompatibility>> {
    const res = await apiClient.get(`${BASE_ROUTE}/vehicle/${vehicleModelId}`);
    return res.data;
  },

  /**
   * Get single compatibility entry by ID
   */
  async getById(id: string): Promise<ApiResponse<ModelCompatibility>> {
    const res = await apiClient.get(`${BASE_ROUTE}/${id}`);
    return res.data;
  },

  /**
   * Create new compatibility entry
   */
  async create(
    data: CreateCompatibilityRequest,
  ): Promise<ApiResponse<ModelCompatibility>> {
    const res = await apiClient.post(BASE_ROUTE, data);
    return res.data;
  },

  /**
   * Update compatibility entry
   */
  async update(
    id: string,
    data: UpdateCompatibilityRequest,
  ): Promise<ApiResponse<ModelCompatibility>> {
    const res = await apiClient.put(`${BASE_ROUTE}/${id}`, data);
    return res.data;
  },

  /**
   * Mark compatibility as verified
   */
  async verify(id: string): Promise<ApiResponse<ModelCompatibility>> {
    const res = await apiClient.patch(`${BASE_ROUTE}/${id}/verify`, {});
    return res.data;
  },

  /**
   * Delete compatibility entry
   */
  async delete(id: string): Promise<ApiResponse<{ success: boolean }>> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}`);
    return res.data;
  },
};

export default modelCompatibilityService;
