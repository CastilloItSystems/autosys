// app/api/crm/leadService.ts

import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "../inventory/types";
import { Lead, LeadStatus } from "@/libs/interfaces/crm/lead.interface";

interface LeadParams {
  page?: number;
  limit?: number;
  channel?: string;
  status?: LeadStatus | string;
  assignedTo?: string;
  customerId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface UpdateLeadStatusPayload {
  status: string;
  lostReason?: string;
  closedAt?: string;
}

const leadService = {
  async getAll(params?: LeadParams): Promise<PaginatedResponse<Lead>> {
    const res = await apiClient.get("/crm/leads", { params });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<Lead>> {
    const res = await apiClient.get(`/crm/leads/${id}`);
    return res.data;
  },

  async create(data: Partial<Lead>): Promise<ApiResponse<Lead>> {
    const res = await apiClient.post("/crm/leads", data);
    return res.data;
  },

  async update(id: string, data: Partial<Lead>): Promise<ApiResponse<Lead>> {
    const res = await apiClient.put(`/crm/leads/${id}`, data);
    return res.data;
  },

  async updateStatus(
    id: string,
    payload: UpdateLeadStatusPayload
  ): Promise<ApiResponse<Lead>> {
    const res = await apiClient.patch(`/crm/leads/${id}/status`, payload);
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse<{ success: boolean; id: string }>> {
    const res = await apiClient.delete(`/crm/leads/${id}`);
    return res.data;
  },
};

export default leadService;
