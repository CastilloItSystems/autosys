// app/api/sales/preInvoiceService.ts

import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "../inventory/types";
import {
  PreInvoice,
  PreInvoiceStatus,
} from "@/libs/interfaces/sales/preInvoice.interface";

interface PreInvoiceParams {
  page?: number;
  limit?: number;
  status?: PreInvoiceStatus;
  customerId?: string;
  orderId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const preInvoiceService = {
  async getAll(
    params?: PreInvoiceParams,
  ): Promise<PaginatedResponse<PreInvoice>> {
    const res = await apiClient.get("/sales/pre-invoices", { params });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<PreInvoice>> {
    const res = await apiClient.get(`/sales/pre-invoices/${id}`);
    return res.data;
  },

  async startPreparation(id: string): Promise<ApiResponse<PreInvoice>> {
    const res = await apiClient.patch(
      `/sales/pre-invoices/${id}/start-preparation`,
    );
    return res.data;
  },

  async markReady(id: string): Promise<ApiResponse<PreInvoice>> {
    const res = await apiClient.patch(`/sales/pre-invoices/${id}/mark-ready`);
    return res.data;
  },

  async markPaid(id: string): Promise<ApiResponse<PreInvoice>> {
    const res = await apiClient.patch(`/sales/pre-invoices/${id}/mark-paid`);
    return res.data;
  },

  async cancel(id: string): Promise<ApiResponse<PreInvoice>> {
    const res = await apiClient.patch(`/sales/pre-invoices/${id}/cancel`);
    return res.data;
  },
};

export default preInvoiceService;
