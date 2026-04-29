import apiClient from "@/app/api/apiClient";
import type { DealerFinancing } from "../interfaces/dealerFinancing.interface";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface SaveDealerFinancingRequest {
  dealerUnitId: string;
  customerId: string;
  customerName: string;
  bankName?: string | null;
  currency?: "USD" | "VES" | "EUR" | null;
  exchangeRate?: number | null;
  exchangeRateSource?: "BCV_AUTO" | "MANUAL" | null;
  requestedAmount?: number | null;
  approvedAmount?: number | null;
  termMonths?: number | null;
  status?: string;
}

const BASE_ROUTE = "/dealer/financing";

const dealerFinancingService = {
  async getAll(params?: Record<string, unknown>): Promise<PaginatedResponse<DealerFinancing>> {
    const res = await apiClient.get(BASE_ROUTE, { params });
    return res.data;
  },
  async create(data: SaveDealerFinancingRequest): Promise<ApiResponse<DealerFinancing>> {
    const res = await apiClient.post(BASE_ROUTE, data);
    return res.data;
  },
  async update(id: string, data: Partial<SaveDealerFinancingRequest>): Promise<ApiResponse<DealerFinancing>> {
    const res = await apiClient.put(`${BASE_ROUTE}/${id}`, data);
    return res.data;
  },
  async delete(id: string): Promise<ApiResponse<{ success: boolean; id: string }>> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}`);
    return res.data;
  },
};

export default dealerFinancingService;
