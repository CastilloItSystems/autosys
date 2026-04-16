import apiClient from "../apiClient";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface DealerApproval {
  id: string;
  approvalNumber: string;
  type: string;
  status: string;
  title: string;
  reason?: string | null;
  requestedAmount?: string | number | null;
  requestedPct?: string | number | null;
  createdAt: string;
}

const BASE_ROUTE = "/dealer/approvals";

const dealerApprovalService = {
  async getAll(params?: Record<string, unknown>): Promise<PaginatedResponse<DealerApproval>> {
    const res = await apiClient.get(BASE_ROUTE, { params });
    return res.data;
  },
  async create(data: Record<string, unknown>): Promise<ApiResponse<DealerApproval>> {
    const res = await apiClient.post(BASE_ROUTE, data);
    return res.data;
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiResponse<DealerApproval>> {
    const res = await apiClient.put(`${BASE_ROUTE}/${id}`, data);
    return res.data;
  },
  async delete(id: string): Promise<ApiResponse<{ success: boolean; id: string }>> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}`);
    return res.data;
  },
};

export default dealerApprovalService;
