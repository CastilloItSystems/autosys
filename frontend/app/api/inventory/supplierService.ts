import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";

// ============================================
// ENTITY
// ============================================
export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  website?: string | null;
  address?: string | null;
  taxId?: string | null;
  type: "INDIVIDUAL" | "COMPANY";
  isSpecialTaxpayer: boolean;
  creditDays: number;
  currency?: string | null;
  specialty?: string | null;
  notes?: string | null;
  metadata?: any | null;
  isActive: boolean;
  empresaId: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// REQUEST PARAMS & DTOs
// ============================================
export interface GetSuppliersParams {
  page?: number;
  limit?: number;
  name?: string; // search by name
  isActive?: "true" | "false";
}

export interface CreateSupplierRequest {
  code: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  address?: string;
  taxId?: string;
  type?: "INDIVIDUAL" | "COMPANY";
  isSpecialTaxpayer?: boolean;
  creditDays?: number;
  currency?: string;
  notes?: string;
  metadata?: any;
}

export interface UpdateSupplierRequest {
  code?: string;
  name?: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  website?: string | null;
  address?: string | null;
  taxId?: string | null;
  type?: "INDIVIDUAL" | "COMPANY";
  isSpecialTaxpayer?: boolean;
  creditDays?: number;
  currency?: string | null;
  notes?: string | null;
  metadata?: any | null;
  isActive?: boolean;
}

// ============================================
// SERVICE
// ============================================
const BASE_ROUTE = "/inventory/suppliers";

const supplierService = {
  async getAll(
    params?: GetSuppliersParams,
  ): Promise<PaginatedResponse<Supplier>> {
    const res = await apiClient.get(BASE_ROUTE, { params });
    return res.data;
  },

  async getActive(): Promise<ApiResponse<Supplier[]>> {
    const res = await apiClient.get(`${BASE_ROUTE}/active`);
    return res.data;
  },

  async search(query: string): Promise<PaginatedResponse<Supplier>> {
    const res = await apiClient.get(BASE_ROUTE, { params: { name: query } });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<Supplier>> {
    const res = await apiClient.get(`${BASE_ROUTE}/${id}`);
    return res.data;
  },

  async getByCode(code: string): Promise<ApiResponse<Supplier>> {
    const res = await apiClient.get(`${BASE_ROUTE}/code/${code}`);
    return res.data;
  },

  async create(payload: CreateSupplierRequest): Promise<ApiResponse<Supplier>> {
    const res = await apiClient.post(BASE_ROUTE, payload);
    return res.data;
  },

  async update(
    id: string,
    payload: UpdateSupplierRequest,
  ): Promise<ApiResponse<Supplier>> {
    const res = await apiClient.put(`${BASE_ROUTE}/${id}`, payload);
    return res.data;
  },

  async toggle(id: string): Promise<ApiResponse<Supplier>> {
    const res = await apiClient.patch(`${BASE_ROUTE}/${id}/toggle`);
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}`);
    return res.data;
  },
};

export default supplierService;
