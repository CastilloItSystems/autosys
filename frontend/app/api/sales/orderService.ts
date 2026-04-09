// app/api/sales/orderService.ts

import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "../inventory/types";
import { Order, OrderStatus } from "@/libs/interfaces/sales/order.interface";

// ===== Types =====

interface OrderParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  customerId?: string;
  warehouseId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ===== Service =====

const orderService = {
  async getAll(params?: OrderParams): Promise<PaginatedResponse<Order>> {
    const res = await apiClient.get("/sales/orders", { params });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<Order>> {
    const res = await apiClient.get(`/sales/orders/${id}`);
    return res.data;
  },

  async create(data: any): Promise<ApiResponse<Order>> {
    const res = await apiClient.post("/sales/orders", data);
    return res.data;
  },

  async update(id: string, data: any): Promise<ApiResponse<Order>> {
    const res = await apiClient.put(`/sales/orders/${id}`, data);
    return res.data;
  },

  async approve(id: string): Promise<ApiResponse<Order>> {
    const res = await apiClient.patch(`/sales/orders/${id}/approve`);
    return res.data;
  },

  async cancel(id: string): Promise<ApiResponse<Order>> {
    const res = await apiClient.patch(`/sales/orders/${id}/cancel`);
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse<Order>> {
    const res = await apiClient.delete(`/sales/orders/${id}`);
    return res.data;
  },
};

export default orderService;
