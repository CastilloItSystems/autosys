import apiClient from "../apiClient";
import type { DealerDelivery } from "@/libs/interfaces/dealer/dealerDelivery.interface";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const BASE_ROUTE = "/dealer/deliveries";

const dealerDeliveryService = {
  async getAll(params?: Record<string, unknown>): Promise<PaginatedResponse<DealerDelivery>> {
    const res = await apiClient.get(BASE_ROUTE, { params });
    return res.data;
  },
  async create(data: Record<string, unknown>): Promise<ApiResponse<DealerDelivery>> {
    const res = await apiClient.post(BASE_ROUTE, data);
    return res.data;
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiResponse<DealerDelivery>> {
    const res = await apiClient.put(`${BASE_ROUTE}/${id}`, data);
    return res.data;
  },
  async delete(id: string): Promise<ApiResponse<{ success: boolean; id: string }>> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}`);
    return res.data;
  },
};

export default dealerDeliveryService;
