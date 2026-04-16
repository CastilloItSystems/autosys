import apiClient from "../apiClient";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface DealerDocument {
  id: string;
  referenceType: string;
  referenceId?: string | null;
  documentType: string;
  documentNumber?: string | null;
  name: string;
  fileUrl: string;
  status: string;
  issuedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  dealerUnit?: {
    id: string;
    code?: string | null;
    vin?: string | null;
    brand?: { name: string };
    model?: { name: string };
  } | null;
}

const BASE_ROUTE = "/dealer/documents";

const dealerDocumentService = {
  async getAll(params?: Record<string, unknown>): Promise<PaginatedResponse<DealerDocument>> {
    const res = await apiClient.get(BASE_ROUTE, { params });
    return res.data;
  },
  async create(data: Record<string, unknown>): Promise<ApiResponse<DealerDocument>> {
    const res = await apiClient.post(BASE_ROUTE, data);
    return res.data;
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiResponse<DealerDocument>> {
    const res = await apiClient.put(`${BASE_ROUTE}/${id}`, data);
    return res.data;
  },
  async delete(id: string): Promise<ApiResponse<{ success: boolean; id: string }>> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}`);
    return res.data;
  },
};

export default dealerDocumentService;
