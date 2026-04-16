import apiClient from "../apiClient";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface DealerAfterSale {
  id: string;
  caseNumber: string;
  type: string;
  status: string;
  customerName: string;
  title: string;
  dueAt?: string | null;
  satisfactionScore?: number | null;
  createdAt: string;
}

const BASE_ROUTE = "/dealer/after-sales";

const dealerAfterSaleService = {
  async getAll(params?: Record<string, unknown>): Promise<PaginatedResponse<DealerAfterSale>> {
    const res = await apiClient.get(BASE_ROUTE, { params });
    return res.data;
  },
  async create(data: Record<string, unknown>): Promise<ApiResponse<DealerAfterSale>> {
    const res = await apiClient.post(BASE_ROUTE, data);
    return res.data;
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiResponse<DealerAfterSale>> {
    const res = await apiClient.put(`${BASE_ROUTE}/${id}`, data);
    return res.data;
  },
  async delete(id: string): Promise<ApiResponse<{ success: boolean; id: string }>> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}`);
    return res.data;
  },
};

export default dealerAfterSaleService;
