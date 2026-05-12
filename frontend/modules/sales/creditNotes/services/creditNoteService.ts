import apiClient from "@/app/api/apiClient";
import { ApiResponse, PaginatedResponse } from "@/modules/inventory/types";
import { CreditNote, CreditNoteStatus } from "../interfaces/creditNote.interface";

export interface CreateCreditNoteItemPayload {
  itemId?: string;
  itemName?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  taxType: string;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  totalLine: number;
}

export interface CreateCreditNotePayload {
  invoiceId: string;
  reason: string;
  currency?: string;
  exchangeRate?: number;
  discountAmount?: number;
  subtotalBruto: number;
  baseImponible: number;
  baseExenta: number;
  taxAmount: number;
  taxRate: number;
  igtfApplies?: boolean;
  igtfRate?: number;
  igtfAmount?: number;
  total: number;
  notes?: string;
  items: CreateCreditNoteItemPayload[];
}

interface CreditNoteParams {
  page?: number;
  limit?: number;
  status?: CreditNoteStatus;
  customerId?: string;
  invoiceId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const creditNoteService = {
  async getAll(params?: CreditNoteParams): Promise<PaginatedResponse<CreditNote>> {
    const res = await apiClient.get("/sales/credit-notes", { params });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<CreditNote>> {
    const res = await apiClient.get(`/sales/credit-notes/${id}`);
    return res.data;
  },

  async create(data: CreateCreditNotePayload): Promise<ApiResponse<CreditNote>> {
    const res = await apiClient.post("/sales/credit-notes", data);
    return res.data;
  },

  async cancel(id: string, cancellationReason: string): Promise<ApiResponse<CreditNote>> {
    const res = await apiClient.patch(`/sales/credit-notes/${id}/cancel`, { cancellationReason });
    return res.data;
  },
};

export default creditNoteService;
