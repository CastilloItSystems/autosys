// app/api/crm/activityService.ts

import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "../inventory/types";
import { Activity, ActivityStatus } from "@/libs/interfaces/crm/activity.interface";

interface ActivityParams {
  page?: number;
  limit?: number;
  customerId?: string;
  leadId?: string;
  assignedTo?: string;
  status?: ActivityStatus | string;
  type?: string;
  dueBefore?: string;
  dueAfter?: string;
  sortOrder?: "asc" | "desc";
}

interface CompleteActivityPayload {
  outcome?: string;
  completedAt?: string;
}

const activityService = {
  async getAll(params?: ActivityParams): Promise<PaginatedResponse<Activity>> {
    const res = await apiClient.get("/crm/activities", { params });
    return res.data;
  },

  async getByCustomer(
    customerId: string,
    params?: Omit<ActivityParams, "customerId">
  ): Promise<PaginatedResponse<Activity>> {
    const res = await apiClient.get("/crm/activities", {
      params: { ...params, customerId },
    });
    return res.data;
  },

  async getPending(assignedTo?: string): Promise<PaginatedResponse<Activity>> {
    const res = await apiClient.get("/crm/activities", {
      params: { status: "PENDING", assignedTo, limit: 50, sortOrder: "asc" },
    });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<Activity>> {
    const res = await apiClient.get(`/crm/activities/${id}`);
    return res.data;
  },

  async create(data: Partial<Activity>): Promise<ApiResponse<Activity>> {
    const res = await apiClient.post("/crm/activities", data);
    return res.data;
  },

  async update(
    id: string,
    data: Partial<Activity>
  ): Promise<ApiResponse<Activity>> {
    const res = await apiClient.put(`/crm/activities/${id}`, data);
    return res.data;
  },

  async complete(
    id: string,
    payload: CompleteActivityPayload
  ): Promise<ApiResponse<Activity>> {
    const res = await apiClient.patch(`/crm/activities/${id}/complete`, payload);
    return res.data;
  },

  async delete(
    id: string
  ): Promise<ApiResponse<{ success: boolean; id: string }>> {
    const res = await apiClient.delete(`/crm/activities/${id}`);
    return res.data;
  },
};

export default activityService;
