// app/api/crm/interactionService.ts

import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "../inventory/types";
import { Interaction } from "@/libs/interfaces/crm/interaction.interface";

interface InteractionParams {
  page?: number;
  limit?: number;
  customerId?: string;
  leadId?: string;
  type?: string;
  channel?: string;
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
  sortOrder?: "asc" | "desc";
}

const interactionService = {
  async getAll(
    params?: InteractionParams
  ): Promise<PaginatedResponse<Interaction>> {
    const res = await apiClient.get("/crm/interactions", { params });
    return res.data;
  },

  async getByCustomer(
    customerId: string,
    params?: Omit<InteractionParams, "customerId">
  ): Promise<PaginatedResponse<Interaction>> {
    const res = await apiClient.get("/crm/interactions", {
      params: { ...params, customerId },
    });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<Interaction>> {
    const res = await apiClient.get(`/crm/interactions/${id}`);
    return res.data;
  },

  async create(
    data: Partial<Interaction>
  ): Promise<ApiResponse<Interaction>> {
    const res = await apiClient.post("/crm/interactions", data);
    return res.data;
  },

  async update(
    id: string,
    data: Partial<Interaction>
  ): Promise<ApiResponse<Interaction>> {
    const res = await apiClient.put(`/crm/interactions/${id}`, data);
    return res.data;
  },

  async delete(
    id: string
  ): Promise<ApiResponse<{ success: boolean; id: string }>> {
    const res = await apiClient.delete(`/crm/interactions/${id}`);
    return res.data;
  },
};

export default interactionService;
