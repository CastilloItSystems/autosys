// app/api/crm/caseService.ts

import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "../inventory/types";
import { Case, CaseComment } from "@/libs/interfaces/crm/case.interface";

interface CaseParams {
  page?: number;
  limit?: number;
  type?: string;
  priority?: string;
  status?: string;
  customerId?: string;
  assignedTo?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface UpdateCaseStatusPayload {
  status: string;
  resolution?: string;
  rootCause?: string;
}

interface AddCommentPayload {
  comment: string;
  isInternal?: boolean;
}

const caseService = {
  async getAll(params?: CaseParams): Promise<PaginatedResponse<Case>> {
    const res = await apiClient.get("/crm/cases", { params });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<Case>> {
    const res = await apiClient.get(`/crm/cases/${id}`);
    return res.data;
  },

  async create(data: Partial<Case>): Promise<ApiResponse<Case>> {
    const res = await apiClient.post("/crm/cases", data);
    return res.data;
  },

  async update(id: string, data: Partial<Case>): Promise<ApiResponse<Case>> {
    const res = await apiClient.put(`/crm/cases/${id}`, data);
    return res.data;
  },

  async updateStatus(
    id: string,
    data: UpdateCaseStatusPayload
  ): Promise<ApiResponse<Case>> {
    const res = await apiClient.patch(`/crm/cases/${id}/status`, data);
    return res.data;
  },

  async addComment(
    id: string,
    data: AddCommentPayload
  ): Promise<ApiResponse<CaseComment>> {
    const res = await apiClient.post(`/crm/cases/${id}/comments`, data);
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse<{ success: boolean; id: string }>> {
    const res = await apiClient.delete(`/crm/cases/${id}`);
    return res.data;
  },
};

export default caseService;
