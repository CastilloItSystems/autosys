// app/api/sales/preInvoiceService.ts

import apiClient from "@/app/api/apiClient";
import { ApiResponse, PaginatedResponse } from "@/app/api/inventory/types";
import {
  PreInvoice,
  PreInvoiceStatus,
  PreInvoiceSalesStockDiagnosis,
  SuggestedTransfersResult,
} from "../interfaces/preInvoice.interface";

interface PreInvoiceParams {
  page?: number;
  limit?: number;
  status?: PreInvoiceStatus;
  customerId?: string;
  orderId?: string;
  serviceOrderId?: string;
  hasServiceOrder?: boolean;
  origin?: "ORDER" | "WORKSHOP";
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

  async getSalesStockDiagnosis(
    id: string,
  ): Promise<ApiResponse<PreInvoiceSalesStockDiagnosis>> {
    const res = await apiClient.get(
      `/sales/pre-invoices/${id}/sales-stock-diagnosis`,
    );
    return res.data;
  },

  async createSuggestedTransfers(
    id: string,
  ): Promise<ApiResponse<SuggestedTransfersResult>> {
    const res = await apiClient.post(
      `/sales/pre-invoices/${id}/suggested-transfers`,
    );
    return res.data;
  },
};

export default preInvoiceService;
