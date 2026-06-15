import apiClient from "@/app/api/apiClient";
import type { DealerCommission } from "../interfaces/dealerCommission.interface";

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

export interface GetDealerCommissionsParams {
  page?: number;
  limit?: number;
  search?: string;
  dealerQuoteId?: string;
  sellerId?: string;
  status?: string;
  isActive?: "true" | "false";
  sortBy?: "createdAt" | "updatedAt" | "status" | "commissionAmount";
  sortOrder?: "asc" | "desc";
}

export interface UpdateDealerCommissionRequest {
  status?: string;
  commissionPct?: number;
  sellerId?: string | null;
  sellerName?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

const BASE_ROUTE = "/dealer/commissions";

const dealerCommissionService = {
  async getAll(
    params?: GetDealerCommissionsParams,
  ): Promise<PaginatedResponse<DealerCommission>> {
    const res = await apiClient.get(BASE_ROUTE, { params });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<DealerCommission>> {
    const res = await apiClient.get(`${BASE_ROUTE}/${id}`);
    return res.data;
  },

  async update(
    id: string,
    data: UpdateDealerCommissionRequest,
  ): Promise<ApiResponse<DealerCommission>> {
    const res = await apiClient.put(`${BASE_ROUTE}/${id}`, data);
    return res.data;
  },
};

export default dealerCommissionService;
