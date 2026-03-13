import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";

// ============================================
// ENTITY
// ============================================
export type WarehouseType = "PRINCIPAL" | "SUCURSAL" | "TRANSITO";

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: WarehouseType;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// REQUEST PARAMS & DTOs
// ============================================
export interface GetWarehouseParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: WarehouseType;
  isActive?: "true" | "false";
}

export interface CreateWarehouseRequest {
  code: string; // Requerido
  name: string; // Requerido
  type?: WarehouseType; // Opcional
  address?: string; // Opcional
}

export interface UpdateWarehouseRequest {
  code?: string;
  name?: string;
  type?: WarehouseType;
  address?: string | null;
  isActive?: boolean;
}

// ============================================
// SERVICE
// ============================================
const BASE_ROUTE = "/inventory/warehouses";

const warehouseService = {
  async getAll(
    params?: GetWarehouseParams,
  ): Promise<PaginatedResponse<Warehouse>> {
    const res = await apiClient.get(BASE_ROUTE, { params });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<Warehouse>> {
    const res = await apiClient.get(`${BASE_ROUTE}/${id}`);
    return res.data;
  },

  async getActive(): Promise<PaginatedResponse<Warehouse>> {
    const res = await apiClient.get(`${BASE_ROUTE}/active`);
    return res.data;
  },

  async search(query: string): Promise<PaginatedResponse<Warehouse>> {
    const res = await apiClient.get(`${BASE_ROUTE}/search`, {
      params: { term: query },
    });
    return res.data;
  },

  async getByType(type: WarehouseType): Promise<PaginatedResponse<Warehouse>> {
    const res = await apiClient.get(BASE_ROUTE, { params: { type } });
    return res.data;
  },

  async create(data: CreateWarehouseRequest): Promise<ApiResponse<Warehouse>> {
    const res = await apiClient.post(BASE_ROUTE, data);
    return res.data;
  },

  async update(
    id: string,
    data: UpdateWarehouseRequest,
  ): Promise<ApiResponse<Warehouse>> {
    const res = await apiClient.put(`${BASE_ROUTE}/${id}`, data);
    return res.data;
  },

  async activate(id: string): Promise<ApiResponse<Warehouse>> {
    const res = await apiClient.patch(`${BASE_ROUTE}/${id}/activate`);
    return res.data;
  },

  async deactivate(id: string): Promise<ApiResponse<Warehouse>> {
    const res = await apiClient.patch(`${BASE_ROUTE}/${id}/deactivate`);
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse<Warehouse>> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}`);
    return res.data;
  },
};

export default warehouseService;
