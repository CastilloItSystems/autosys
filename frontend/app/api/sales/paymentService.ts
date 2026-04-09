// app/api/sales/paymentService.ts

import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "../inventory/types";
import {
  Payment,
  PaymentStatus,
  PaymentMethod,
} from "@/libs/interfaces/sales/payment.interface";

interface PaymentParams {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  method?: PaymentMethod;
  customerId?: string;
  preInvoiceId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const paymentService = {
  async getAll(params?: PaymentParams): Promise<PaginatedResponse<Payment>> {
    const res = await apiClient.get("/sales/payments", { params });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<Payment>> {
    const res = await apiClient.get(`/sales/payments/${id}`);
    return res.data;
  },

  async getByPreInvoice(
    preInvoiceId: string,
  ): Promise<PaginatedResponse<Payment>> {
    const res = await apiClient.get("/sales/payments", {
      params: { preInvoiceId, limit: 50 },
    });
    return res.data;
  },

  async create(data: any): Promise<ApiResponse<Payment>> {
    const res = await apiClient.post("/sales/payments", data);
    return res.data;
  },

  async cancel(id: string): Promise<ApiResponse<Payment>> {
    const res = await apiClient.patch(`/sales/payments/${id}/cancel`);
    return res.data;
  },
};

export default paymentService;
