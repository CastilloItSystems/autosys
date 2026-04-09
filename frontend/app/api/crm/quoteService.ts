// app/api/crm/quoteService.ts

import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "../inventory/types";
import { Quote } from "@/libs/interfaces/crm/quote.interface";

interface QuoteParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  customerId?: string;
  leadId?: string;
  assignedTo?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface UpdateQuoteStatusPayload {
  status: string;
  notes?: string;
}

const quoteService = {
  async getAll(params?: QuoteParams): Promise<PaginatedResponse<Quote>> {
    const res = await apiClient.get("/crm/quotes", { params });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<Quote>> {
    const res = await apiClient.get(`/crm/quotes/${id}`);
    return res.data;
  },

  async create(data: Partial<Quote>): Promise<ApiResponse<Quote>> {
    const res = await apiClient.post("/crm/quotes", data);
    return res.data;
  },

  async update(id: string, data: Partial<Quote>): Promise<ApiResponse<Quote>> {
    const res = await apiClient.put(`/crm/quotes/${id}`, data);
    return res.data;
  },

  async updateStatus(
    id: string,
    data: UpdateQuoteStatusPayload
  ): Promise<ApiResponse<Quote>> {
    const res = await apiClient.patch(`/crm/quotes/${id}/status`, data);
    return res.data;
  },

  async revise(id: string, data?: Partial<Quote>): Promise<ApiResponse<Quote>> {
    const res = await apiClient.post(`/crm/quotes/${id}/revise`, data ?? {});
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse<{ success: boolean; id: string }>> {
    const res = await apiClient.delete(`/crm/quotes/${id}`);
    return res.data;
  },
};

export default quoteService;
