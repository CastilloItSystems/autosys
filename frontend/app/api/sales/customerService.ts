// app/api/sales/customerService.ts

import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "../inventory/types";

// ===== Types =====

export interface Customer {
  id: string;
  code: string;
  taxId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  website?: string | null;
  contactPerson?: string | null;
  address?: string | null;
  shippingAddress?: string | null;
  billingAddress?: string | null;
  type: "INDIVIDUAL" | "COMPANY";
  isSpecialTaxpayer: boolean;
  priceList: number;
  creditLimit: number;
  creditDays: number;
  defaultDiscount: number;
  isActive: boolean;
  empresaId: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomerParams {
  page?: number;
  limit?: number;
  type?: string;
  isActive?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ===== Service =====

const customerService = {
  async getAll(params?: CustomerParams): Promise<PaginatedResponse<Customer>> {
    const res = await apiClient.get("/crm/customers", { params });
    return res.data;
  },

  async getActive(): Promise<PaginatedResponse<Customer>> {
    const res = await apiClient.get("/crm/customers", {
      params: { isActive: true, limit: 500 },
    });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<Customer>> {
    const res = await apiClient.get(`/crm/customers/${id}`);
    return res.data;
  },

  async create(data: Partial<Customer>): Promise<ApiResponse<Customer>> {
    const res = await apiClient.post("/crm/customers", data);
    return res.data;
  },

  async update(
    id: string,
    data: Partial<Customer>,
  ): Promise<ApiResponse<Customer>> {
    const res = await apiClient.put(`/crm/customers/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse<Customer>> {
    const res = await apiClient.delete(`/crm/customers/${id}`);
    return res.data;
  },
};

export default customerService;
