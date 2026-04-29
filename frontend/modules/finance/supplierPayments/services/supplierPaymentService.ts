import apiClient from "@/app/api/apiClient";
import type { CreateSupplierPaymentData } from "../interfaces/supplierPayment";

const supplierPaymentService = {
  async getAll(params?: {
    status?: string;
    supplierId?: string;
    supplierBillId?: string;
    expenseId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get("/finance/supplier-payments", {
      params,
    });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/finance/supplier-payments/${id}`);
    return response.data;
  },

  async create(data: CreateSupplierPaymentData) {
    const response = await apiClient.post("/finance/supplier-payments", data);
    return response.data;
  },

  async cancel(id: string) {
    const response = await apiClient.post(
      `/finance/supplier-payments/${id}/cancel`,
    );
    return response.data;
  },
};

export default supplierPaymentService;
