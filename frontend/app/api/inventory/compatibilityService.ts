/**
 * Model Compatibility Service
 * Manages part × vehicle model compatibility matrix
 */

import apiClient from "../apiClient";

export interface IModelCompatibility {
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

export interface ICompatibilityFilters {
  partModelId?: string;
  vehicleModelId?: string;
  isVerified?: boolean;
  partBrandId?: string;
  vehicleBrandId?: string;
  page?: number;
  limit?: number;
}

export interface ICompatibilityResponse {
  data: IModelCompatibility[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ICreateCompatibilityRequest {
  partModelId: string;
  vehicleModelId: string;
  notes?: string;
}

/**
 * Get all compatibility entries with optional filters
 */
export const getAll = async (
  filters?: ICompatibilityFilters,
): Promise<ICompatibilityResponse> => {
  const params = new URLSearchParams();
  if (filters?.partModelId) params.append("partModelId", filters.partModelId);
  if (filters?.vehicleModelId)
    params.append("vehicleModelId", filters.vehicleModelId);
  if (filters?.isVerified !== undefined)
    params.append("isVerified", String(filters.isVerified));
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));

  const response = await apiClient.get<ICompatibilityResponse>(
    `/inventory/catalogs/model-compatibility?${params.toString()}`,
  );
  return response.data;
};

/**
 * Get compatibility entries for a specific part model
 */
export const getByPartModel = async (
  partModelId: string,
): Promise<ICompatibilityResponse> => {
  const response = await apiClient.get<ICompatibilityResponse>(
    `/inventory/catalogs/model-compatibility/part/${partModelId}`,
  );
  return response.data;
};

/**
 * Get compatibility entries for a specific vehicle model
 */
export const getByVehicleModel = async (
  vehicleModelId: string,
): Promise<ICompatibilityResponse> => {
  const response = await apiClient.get<ICompatibilityResponse>(
    `/inventory/catalogs/model-compatibility/vehicle/${vehicleModelId}`,
  );
  return response.data;
};

/**
 * Get single compatibility entry by ID
 */
export const getById = async (
  id: string,
): Promise<{ data: IModelCompatibility }> => {
  const response = await apiClient.get<{ data: IModelCompatibility }>(
    `/inventory/catalogs/model-compatibility/${id}`,
  );
  return response.data;
};

/**
 * Create new compatibility entry
 */
export const create = async (
  data: ICreateCompatibilityRequest,
): Promise<{ data: IModelCompatibility }> => {
  const response = await apiClient.post<{ data: IModelCompatibility }>(
    `/inventory/catalogs/model-compatibility`,
    data,
  );
  return response.data;
};

/**
 * Update compatibility entry
 */
export const update = async (
  id: string,
  data: Partial<ICreateCompatibilityRequest>,
): Promise<{ data: IModelCompatibility }> => {
  const response = await apiClient.put<{ data: IModelCompatibility }>(
    `/inventory/catalogs/model-compatibility/${id}`,
    data,
  );
  return response.data;
};

/**
 * Mark compatibility as verified
 */
export const verify = async (
  id: string,
): Promise<{ data: IModelCompatibility }> => {
  const response = await apiClient.patch<{ data: IModelCompatibility }>(
    `/inventory/catalogs/model-compatibility/${id}/verify`,
    {},
  );
  return response.data;
};

/**
 * Delete compatibility entry
 */
export const remove = async (id: string): Promise<{ success: boolean }> => {
  const response = await apiClient.delete<{ success: boolean }>(
    `/inventory/catalogs/model-compatibility/${id}`,
  );
  return response.data;
};

export default {
  getAll,
  getByPartModel,
  getByVehicleModel,
  getById,
  create,
  update,
  verify,
  remove,
};
