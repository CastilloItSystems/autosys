import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";
import type {
  EntryNote,
  EntryNoteItem,
  EntryNoteStatus,
  EntryType,
} from "@/libs/interfaces/inventory/entryNote.interface";

// ===== Types =====

export interface CreateEntryNotePayload {
  type?: EntryType;
  purchaseOrderId?: string | null;
  warehouseId: string;
  catalogSupplierId?: string | null;
  supplierName?: string | null;
  supplierId?: string | null;
  supplierPhone?: string | null;
  reason?: string | null;
  reference?: string | null;
  notes?: string | null;
  receivedBy?: string | null;
  authorizedBy?: string | null;
}

export interface UpdateEntryNotePayload {
  status?: EntryNoteStatus;
  notes?: string | null;
  receivedBy?: string | null;
  verifiedBy?: string | null;
  authorizedBy?: string | null;
  catalogSupplierId?: string | null;
  supplierName?: string | null;
  supplierId?: string | null;
  supplierPhone?: string | null;
  reason?: string | null;
  reference?: string | null;
  items?: {
    itemId: string;
    itemName?: string | null;
    quantityReceived: number;
    unitCost: number;
    storedToLocation?: string | null;
    batchNumber?: string | null;
    expiryDate?: string | null;
    notes?: string | null;
  }[];
}

export interface AddEntryNoteItemPayload {
  itemId: string;
  itemName?: string | null;
  quantityReceived: number;
  unitCost: number;
  storedToLocation?: string | null;
  batchId?: string | null;
  serialNumberId?: string | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
}

interface EntryNoteParams {
  page?: number;
  limit?: number;
  type?: EntryType;
  status?: EntryNoteStatus;
  purchaseOrderId?: string;
  warehouseId?: string;
  catalogSupplierId?: string;
  receivedBy?: string;
  receivedFrom?: string;
  receivedTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

// ===== Service =====

const entryNoteService = {
  async getAll(
    params?: EntryNoteParams,
  ): Promise<PaginatedResponse<EntryNote>> {
    const res = await apiClient.get("/inventory/entry-notes", { params });
    return res.data;
  },

  async getById(
    id: string,
    includeItems = true,
  ): Promise<ApiResponse<EntryNote>> {
    const res = await apiClient.get(`/inventory/entry-notes/${id}`, {
      params: { includeItems },
    });
    return res.data;
  },

  async create(data: CreateEntryNotePayload): Promise<ApiResponse<EntryNote>> {
    const res = await apiClient.post("/inventory/entry-notes", data);
    return res.data;
  },

  async update(
    id: string,
    data: UpdateEntryNotePayload,
  ): Promise<ApiResponse<EntryNote>> {
    const res = await apiClient.put(`/inventory/entry-notes/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/inventory/entry-notes/${id}`);
  },

  async getItems(entryNoteId: string): Promise<ApiResponse<EntryNoteItem[]>> {
    const res = await apiClient.get(
      `/inventory/entry-notes/${entryNoteId}/items`,
    );
    return res.data;
  },

  async addItem(
    entryNoteId: string,
    data: AddEntryNoteItemPayload,
  ): Promise<ApiResponse<EntryNoteItem>> {
    const res = await apiClient.post(
      `/inventory/entry-notes/${entryNoteId}/items`,
      data,
    );
    return res.data;
  },

  async start(id: string): Promise<ApiResponse<EntryNote>> {
    const res = await apiClient.post(`/inventory/entry-notes/${id}/start`);
    return res.data;
  },

  async complete(id: string): Promise<ApiResponse<EntryNote>> {
    const res = await apiClient.post(`/inventory/entry-notes/${id}/complete`);
    return res.data;
  },

  async cancel(id: string): Promise<ApiResponse<EntryNote>> {
    const res = await apiClient.post(`/inventory/entry-notes/${id}/cancel`);
    return res.data;
  },
};

export default entryNoteService;
