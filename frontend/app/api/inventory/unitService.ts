import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";

/**
 * Unit Entity Interface
 */
export interface Unit {
  id: string;
  code: string;
  name: string;
  abbreviation?: string;
  description?: string;
  type?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Request/Parameter Interfaces
 */
export interface GetUnitsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: "true" | "false";
  type?: string;
}

export interface CreateUnitRequest {
  code: string;
  name: string;
  abbreviation?: string;
  description?: string;
  type?: string;
}

export interface UpdateUnitRequest {
  code?: string;
  name?: string;
  abbreviation?: string;
  description?: string;
  type?: string;
  isActive?: boolean;
}

/**
 * Base Route
 */
const BASE_ROUTE = "/inventory/catalogs/units";

/**
 * Units Service
 * Handles all API calls related to units catalog management
 */
const unitsService = {
  /**
   * Get all units with pagination and filters
   */
  async getAll(params?: GetUnitsParams): Promise<PaginatedResponse<Unit>> {
    const res = await apiClient.get(BASE_ROUTE, { params });
    return res.data;
  },

  /**
   * Get only active units
   */
  async getActive(): Promise<PaginatedResponse<Unit>> {
    const res = await apiClient.get(`${BASE_ROUTE}/active`);
    return res.data;
  },

  /**
   * Get units grouped by type
   */
  async getGroupedByType(): Promise<ApiResponse<any>> {
    const res = await apiClient.get(`${BASE_ROUTE}/grouped`);
    return res.data;
  },

  /**
   * Search units by term
   */
  async search(term: string): Promise<PaginatedResponse<Unit>> {
    const res = await apiClient.get(`${BASE_ROUTE}/search`, {
      params: { q: term },
    });
    return res.data;
  },

  /**
   * Get units by type (COUNTABLE, WEIGHT, VOLUME, LENGTH)
   */
  async getByType(type: string): Promise<PaginatedResponse<Unit>> {
    const res = await apiClient.get(`${BASE_ROUTE}/type/${type}`);
    return res.data;
  },

  /**
   * Get single unit by ID
   */
  async getById(id: string): Promise<ApiResponse<Unit>> {
    const res = await apiClient.get(`${BASE_ROUTE}/${id}`);
    return res.data;
  },

  /**
   * Create a new unit
   */
  async create(payload: CreateUnitRequest): Promise<ApiResponse<Unit>> {
    const res = await apiClient.post(BASE_ROUTE, payload);
    return res.data;
  },

  /**
   * Create multiple units (bulk import)
   */
  async bulkCreate(units: CreateUnitRequest[]): Promise<ApiResponse<Unit[]>> {
    const res = await apiClient.post(`${BASE_ROUTE}/bulk`, { units });
    return res.data;
  },

  /**
   * Update a unit
   */
  async update(
    id: string,
    payload: UpdateUnitRequest,
  ): Promise<ApiResponse<Unit>> {
    const res = await apiClient.put(`${BASE_ROUTE}/${id}`, payload);
    return res.data;
  },

  /**
   * Toggle unit active status
   */
  async toggleActive(id: string): Promise<ApiResponse<Unit>> {
    const res = await apiClient.patch(`${BASE_ROUTE}/${id}/toggle`);
    return res.data;
  },

  /**
   * Soft delete a unit (sets isActive to false)
   */
  async delete(id: string): Promise<ApiResponse<Unit>> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}`);
    return res.data;
  },

  /**
   * Hard delete a unit (permanent deletion)
   */
  async hardDelete(id: string): Promise<ApiResponse<Unit>> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}/hard`);
    return res.data;
  },
};

export default unitsService;
