import apiClient from "../apiClient";
import { ApiResponse } from "./types";
import { Customer } from "@/libs/interfaces/inventory";
import { CustomerFormData } from "@/libs/zods/inventory/customerZod";

// ============================================================================
// ENTITY
// ============================================================================

export type CustomerType = "persona" | "empresa";

// ============================================================================
// REQUEST PARAMS & DTOs
// ============================================================================

export interface GetCustomersParams {
  type?: CustomerType;
  search?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

const customerService = {
  async getAll(
    params?: GetCustomersParams,
  ): Promise<ApiResponse<Customer[]>> {
    const res = await apiClient.get("/customers", { params });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<Customer>> {
    const res = await apiClient.get(`/customers/${id}`);
    return res.data;
  },

  async create(data: CustomerFormData): Promise<ApiResponse<Customer>> {
    const res = await apiClient.post("/customers", data);
    return res.data;
  },

  async update(id: string, data: CustomerFormData): Promise<ApiResponse<Customer>> {
    const res = await apiClient.put(`/customers/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/customers/${id}`);
  },

  async search(query: string): Promise<ApiResponse<Customer[]>> {
    const res = await apiClient.get("/customers/search", {
      params: { q: query },
    });
    return res.data;
  },

  async getByType(type: CustomerType): Promise<ApiResponse<Customer[]>> {
    const res = await apiClient.get(`/customers/type/${type}`);
    return res.data;
  },
};

export default customerService;
