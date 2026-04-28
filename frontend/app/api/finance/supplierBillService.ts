import apiClient from "../apiClient";
import type {
  CreateSupplierBillData,
  RegisterSupplierInvoiceData,
  UpdateSupplierBillData,
} from "@/libs/interfaces/finance";

const supplierBillService = {
  async getAll(params?: {
    status?: string;
    supplierId?: string;
    purchaseOrderId?: string;
    from?: string;
    to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get("/finance/supplier-bills", { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/finance/supplier-bills/${id}`);
    return response.data;
  },

  async getAccountsPayable() {
    const response = await apiClient.get("/finance/supplier-bills/accounts-payable");
    return response.data;
  },

  async getAvailablePurchaseOrders() {
    const response = await apiClient.get(
      "/finance/supplier-bills/purchase-orders/available",
    );
    return response.data;
  },

  async create(data: CreateSupplierBillData) {
    const response = await apiClient.post("/finance/supplier-bills", data);
    return response.data;
  },

  async update(id: string, data: UpdateSupplierBillData) {
    const response = await apiClient.patch(`/finance/supplier-bills/${id}`, data);
    return response.data;
  },

  async registerInvoice(id: string, data: RegisterSupplierInvoiceData) {
    const response = await apiClient.patch(
      `/finance/supplier-bills/${id}/register-invoice`,
      data,
    );
    return response.data;
  },

  async cancel(id: string) {
    const response = await apiClient.post(`/finance/supplier-bills/${id}/cancel`);
    return response.data;
  },
};

export default supplierBillService;
