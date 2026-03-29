// app/api/crm/customerCrmService.ts

import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "../inventory/types";
import {
  CustomerCrm,
  CustomerTimeline,
} from "@/libs/interfaces/crm/customer.crm.interface";

interface CustomerCrmParams {
  page?: number;
  limit?: number;
  type?: string;
  segment?: string;
  preferredChannel?: string;
  isActive?: boolean;
  assignedSellerId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const customerCrmService = {
  async getAll(
    params?: CustomerCrmParams
  ): Promise<PaginatedResponse<CustomerCrm>> {
    const res = await apiClient.get("/crm/customers", { params });
    return res.data;
  },

  async getActive(): Promise<PaginatedResponse<CustomerCrm>> {
    const res = await apiClient.get("/crm/customers", {
      params: { isActive: true, limit: 500 },
    });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<CustomerCrm>> {
    const res = await apiClient.get(`/crm/customers/${id}`);
    return res.data;
  },

  async getTimeline(id: string): Promise<ApiResponse<CustomerTimeline>> {
    const res = await apiClient.get(`/crm/customers/${id}/timeline`);
    return res.data;
  },

  async create(data: Partial<CustomerCrm>): Promise<ApiResponse<CustomerCrm>> {
    const res = await apiClient.post("/crm/customers", data);
    return res.data;
  },

  async update(
    id: string,
    data: Partial<CustomerCrm>
  ): Promise<ApiResponse<CustomerCrm>> {
    const res = await apiClient.put(`/crm/customers/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse<{ success: boolean; id: string }>> {
    const res = await apiClient.delete(`/crm/customers/${id}`);
    return res.data;
  },
};

export default customerCrmService;
