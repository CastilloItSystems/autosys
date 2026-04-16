import apiClient from "../apiClient";
import type { DealerQuote } from "@/libs/interfaces/dealer/dealerQuote.interface";

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

export interface GetDealerQuotesParams {
  page?: number;
  limit?: number;
  search?: string;
  dealerUnitId?: string;
  status?: string;
  isActive?: "true" | "false";
  fromDate?: string;
  toDate?: string;
  sortBy?: "createdAt" | "updatedAt" | "status" | "totalAmount" | "validUntil";
  sortOrder?: "asc" | "desc";
}

export interface SaveDealerQuoteRequest {
  dealerUnitId: string;
  customerName: string;
  customerDocument?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  listPrice?: number | null;
  discountPct?: number | null;
  offeredPrice?: number | null;
  taxPct?: number | null;
  currency?: string | null;
  validUntil?: string | null;
  paymentTerms?: string | null;
  financingRequired?: boolean;
  notes?: string | null;
  status?: string;
  isActive?: boolean;
}

const BASE_ROUTE = "/dealer/quotes";

const dealerQuoteService = {
  async getAll(params?: GetDealerQuotesParams): Promise<PaginatedResponse<DealerQuote>> {
    const res = await apiClient.get(BASE_ROUTE, { params });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<DealerQuote>> {
    const res = await apiClient.get(`${BASE_ROUTE}/${id}`);
    return res.data;
  },

  async create(data: SaveDealerQuoteRequest): Promise<ApiResponse<DealerQuote>> {
    const res = await apiClient.post(BASE_ROUTE, data);
    return res.data;
  },

  async update(id: string, data: Partial<SaveDealerQuoteRequest>): Promise<ApiResponse<DealerQuote>> {
    const res = await apiClient.put(`${BASE_ROUTE}/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse<{ success: boolean; id: string }>> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}`);
    return res.data;
  },
};

export default dealerQuoteService;
