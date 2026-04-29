// app/api/sales/invoiceService.ts

import apiClient from "@/app/api/apiClient";
import { ApiResponse, PaginatedResponse } from "@/app/api/inventory/types";
import { Invoice, InvoiceStatus } from "../interfaces/invoice.interface";

interface InvoiceParams {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  customerId?: string;
  preInvoiceId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const invoiceService = {
  async getAll(params?: InvoiceParams): Promise<PaginatedResponse<Invoice>> {
    const res = await apiClient.get("/sales/invoices", { params });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<Invoice>> {
    const res = await apiClient.get(`/sales/invoices/${id}`);
    return res.data;
  },

  async cancel(
    id: string,
    cancellationReason: string,
  ): Promise<ApiResponse<Invoice>> {
    const res = await apiClient.patch(`/sales/invoices/${id}/cancel`, {
      cancellationReason,
    });
    return res.data;
  },
};

export default invoiceService;
