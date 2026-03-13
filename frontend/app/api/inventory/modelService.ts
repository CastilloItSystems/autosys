import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";

/**
 * Model Type Definition
 */
export type ModelType = "VEHICLE" | "PART";

export const MODEL_TYPE_LABELS: Record<ModelType, string> = {
  VEHICLE: "Vehículo",
  PART: "Producto/Repuesto",
};

/**
 * Model Entity Interface
 */
export interface Model {
  id: string;
  code: string;
  name: string;
  type: ModelType;
  typeLabel: string;
  brandId: string;
  brand?: {
    id: string;
    code: string;
    name: string;
  };
  year?: number;
  isActive: boolean;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  stats?: {
    itemsCount: number;
  };
}

/**
 * Request/Parameter Interfaces
 */
export interface GetModelsParams {
  page?: number;
  limit?: number;
  search?: string;
  brandId?: string;
  year?: number;
  type?: ModelType;
  isActive?: string | boolean;
}

export interface CreateModelRequest {
  code: string;
  name: string;
  type: ModelType;
  brandId: string;
  year?: number;
  description?: string;
}

export interface UpdateModelRequest {
  code?: string;
  name?: string;
  type?: ModelType;
  year?: number | null;
  isActive?: boolean;
  description?: string;
}

/**
 * Base Route
 */
const BASE_ROUTE = "/inventory/catalogs/models";

/**
 * Models Service
 * Handles all API calls related to models catalog management
 */
const modelsService = {
  /**
   * Get all models with pagination and filters
   */
  async getAll(params?: GetModelsParams): Promise<PaginatedResponse<Model>> {
    const res = await apiClient.get(BASE_ROUTE, { params });
    return res.data;
  },

  /**
   * Get only active models
   */
  async getActive(type?: ModelType): Promise<PaginatedResponse<Model>> {
    const res = await apiClient.get(`${BASE_ROUTE}/active`, {
      params: type ? { type } : {},
    });
    return res.data;
  },

  /**
   * Get models grouped by brand
   */
  async getGrouped(): Promise<ApiResponse<any>> {
    const res = await apiClient.get(`${BASE_ROUTE}/grouped`);
    return res.data;
  },

  /**
   * Get available years
   */
  async getAvailableYears(): Promise<ApiResponse<number[]>> {
    const res = await apiClient.get(`${BASE_ROUTE}/years`);
    return res.data;
  },

  /**
   * Search models by query
   */
  async search(query: string): Promise<PaginatedResponse<Model>> {
    const res = await apiClient.get(`${BASE_ROUTE}/search`, {
      params: { q: query },
    });
    return res.data;
  },

  /**
   * Get single model by ID
   */
  async getById(id: string): Promise<ApiResponse<Model>> {
    const res = await apiClient.get(`${BASE_ROUTE}/${id}`);
    return res.data;
  },

  /**
   * Get models by brand
   */
  async getByBrand(brandId: string): Promise<PaginatedResponse<Model>> {
    const res = await apiClient.get(`${BASE_ROUTE}/brand/${brandId}`);
    return res.data;
  },

  /**
   * Get models by year
   */
  async getByYear(year: number): Promise<PaginatedResponse<Model>> {
    const res = await apiClient.get(`${BASE_ROUTE}/year/${year}`);
    return res.data;
  },

  /**
   * Create a new model
   */
  async create(data: CreateModelRequest): Promise<ApiResponse<Model>> {
    const res = await apiClient.post(BASE_ROUTE, data);
    return res.data;
  },

  /**
   * Create multiple models (bulk import)
   */
  async bulkCreate(
    models: CreateModelRequest[],
  ): Promise<ApiResponse<Model[]>> {
    const res = await apiClient.post(`${BASE_ROUTE}/bulk`, { models });
    return res.data;
  },

  /**
   * Update a model
   */
  async update(
    id: string,
    data: UpdateModelRequest,
  ): Promise<ApiResponse<Model>> {
    const res = await apiClient.put(`${BASE_ROUTE}/${id}`, data);
    return res.data;
  },

  /**
   * Toggle model active status
   */
  async toggleActive(id: string): Promise<ApiResponse<Model>> {
    const res = await apiClient.patch(`${BASE_ROUTE}/${id}/toggle`);
    return res.data;
  },

  /**
   * Soft delete a model
   */
  async delete(id: string): Promise<ApiResponse<Model>> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}`);
    return res.data;
  },

  /**
   * Hard delete a model (permanent deletion)
   */
  async hardDelete(id: string): Promise<ApiResponse<Model>> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}/hard`);
    return res.data;
  },
};

export default modelsService;
