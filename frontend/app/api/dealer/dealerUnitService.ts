import apiClient from "../apiClient";
import type { DealerUnit } from "@/libs/interfaces/dealer/dealerUnit.interface";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetDealerUnitsParams {
  page?: number;
  limit?: number;
  search?: string;
  brandId?: string;
  modelId?: string;
  status?: string;
  condition?: string;
  isActive?: "true" | "false";
  sortBy?: "createdAt" | "updatedAt" | "year" | "status" | "condition" | "listPrice";
  sortOrder?: "asc" | "desc";
}

export interface SaveDealerUnitRequest {
  brandId: string;
  modelId?: string | null;
  code?: string | null;
  version?: string | null;
  year?: number | null;
  vin?: string | null;
  plate?: string | null;
  condition?: string;
  status?: string;
  listPrice?: number | null;
  promoPrice?: number | null;
  location?: string | null;
  description?: string | null;
  isPublished?: boolean;
  isActive?: boolean;
}

const BASE_ROUTE = "/dealer/units";

const dealerUnitService = {
  async getAll(params?: GetDealerUnitsParams): Promise<PaginatedResponse<DealerUnit>> {
    const res = await apiClient.get(BASE_ROUTE, { params });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<DealerUnit>> {
    const res = await apiClient.get(`${BASE_ROUTE}/${id}`);
    return res.data;
  },

  async create(data: SaveDealerUnitRequest): Promise<ApiResponse<DealerUnit>> {
    const res = await apiClient.post(BASE_ROUTE, data);
    return res.data;
  },

  async update(id: string, data: Partial<SaveDealerUnitRequest>): Promise<ApiResponse<DealerUnit>> {
    const res = await apiClient.put(`${BASE_ROUTE}/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse<{ success: boolean; id: string }>> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}`);
    return res.data;
  },
};

export default dealerUnitService;

