import apiClient from "@/app/api/apiClient";
import type { DealerTradeIn } from "../interfaces/dealerTradeIn.interface";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface SaveDealerTradeInRequest {
  customerId: string;
  customerName: string;
  vehicleBrand: string;
  vehicleModel?: string | null;
  requestedValue?: number | null;
  appraisedValue?: number | null;
  approvedValue?: number | null;
  status?: string;
}

const BASE_ROUTE = "/dealer/trade-ins";

const dealerTradeInService = {
  async getAll(params?: Record<string, unknown>): Promise<PaginatedResponse<DealerTradeIn>> {
    const res = await apiClient.get(BASE_ROUTE, { params });
    return res.data;
  },
  async create(data: SaveDealerTradeInRequest): Promise<ApiResponse<DealerTradeIn>> {
    const res = await apiClient.post(BASE_ROUTE, data);
    return res.data;
  },
  async update(id: string, data: Partial<SaveDealerTradeInRequest>): Promise<ApiResponse<DealerTradeIn>> {
    const res = await apiClient.put(`${BASE_ROUTE}/${id}`, data);
    return res.data;
  },
  async delete(id: string): Promise<ApiResponse<{ success: boolean; id: string }>> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}`);
    return res.data;
  },
};

export default dealerTradeInService;
