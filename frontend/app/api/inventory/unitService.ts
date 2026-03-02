import apiClient from "../apiClient";

/**
 * Unit API Response Interfaces
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

export interface UnitsResponse {
  success: boolean;
  message: string;
  data: Unit[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UnitResponse {
  data: Unit;
}

/**
 * Units Service
 * Handles all API calls related to units catalog management
 */

const BASE_ROUTE = "/inventory/catalogs/units";

class UnitsService {
  /**
   * Get all units with pagination and filters
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: string;
    type?: string;
  }): Promise<UnitsResponse> {
    const res = await apiClient.get(`${BASE_ROUTE}`, { params });
    return res.data;
  }

  /**
   * Get only active units
   */
  async getActive(): Promise<UnitsResponse> {
    const res = await apiClient.get(`${BASE_ROUTE}/active`);
    return res.data;
  }

  /**
   * Get units grouped by type
   */
  async getGroupedByType(): Promise<any> {
    const res = await apiClient.get(`${BASE_ROUTE}/grouped`);
    return res.data;
  }

  /**
   * Search units by term
   */
  async search(term: string): Promise<UnitsResponse> {
    const res = await apiClient.get(`${BASE_ROUTE}/search`, {
      params: { q: term },
    });
    return res.data;
  }

  /**
   * Get units by type (COUNTABLE, WEIGHT, VOLUME, LENGTH)
   */
  async getByType(type: string): Promise<UnitsResponse> {
    const res = await apiClient.get(`${BASE_ROUTE}/type/${type}`);
    return res.data;
  }

  /**
   * Get single unit by ID
   */
  async getById(id: string): Promise<UnitResponse> {
    const res = await apiClient.get(`${BASE_ROUTE}/${id}`);
    return res.data;
  }

  /**
   * Create a new unit
   */
  async create(payload: Partial<Unit>): Promise<UnitResponse> {
    const res = await apiClient.post(`${BASE_ROUTE}`, payload);
    return res.data;
  }

  /**
   * Create multiple units (bulk import)
   */
  async bulkCreate(units: Partial<Unit>[]): Promise<any> {
    const res = await apiClient.post(`${BASE_ROUTE}/bulk`, { units });
    return res.data;
  }

  /**
   * Update a unit
   */
  async update(id: string, payload: Partial<Unit>): Promise<UnitResponse> {
    const res = await apiClient.put(`${BASE_ROUTE}/${id}`, payload);
    return res.data;
  }

  /**
   * Toggle unit active status
   */
  async toggleActive(id: string): Promise<UnitResponse> {
    const res = await apiClient.patch(`${BASE_ROUTE}/${id}/toggle`);
    return res.data;
  }

  /**
   * Soft delete a unit (sets isActive to false)
   */
  async delete(id: string): Promise<any> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}`);
    return res.data;
  }

  /**
   * Hard delete a unit (permanent deletion)
   */
  async hardDelete(id: string): Promise<any> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}/hard`);
    return res.data;
  }
}

export default new UnitsService();

/**
 * Legacy function exports for backward compatibility
 */
export async function getUnits(params?: any) {
  return UnitsService.prototype.getAll(params);
}

export async function getUnit(id: string) {
  const res = await UnitsService.prototype.getById(id);
  return res.data;
}

export async function createUnit(payload: Partial<Unit>) {
  const res = await UnitsService.prototype.create(payload);
  return res.data;
}

export async function updateUnit(id: string, payload: Partial<Unit>) {
  const res = await UnitsService.prototype.update(id, payload);
  return res.data;
}

export async function deleteUnit(id: string) {
  return UnitsService.prototype.delete(id);
}
