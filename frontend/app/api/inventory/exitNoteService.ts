import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";
import {
  ExitNote,
  CreateExitNote,
  ExitNoteStatus,
  ExitNoteType,
} from "@/libs/interfaces/inventory/exitNote.interface";

// ===== Types =====

interface ExitNoteParams {
  page?: number;
  limit?: number;
  type?: ExitNoteType;
  status?: ExitNoteStatus;
  warehouseId?: string;
  search?: string;
}

// ===== Service =====

const exitNoteService = {
  async getAll(params?: ExitNoteParams): Promise<PaginatedResponse<ExitNote>> {
    const res = await apiClient.get("/inventory/exit-notes", { params });
    return res.data;
  },

  async getByNumber(exitNoteNumber: string): Promise<ApiResponse<ExitNote>> {
    const res = await apiClient.get(
      `/inventory/exit-notes/number/${exitNoteNumber}`,
    );
    return res.data;
  },

  async getByWarehouse(
    warehouseId: string,
  ): Promise<PaginatedResponse<ExitNote>> {
    const res = await apiClient.get(
      `/inventory/exit-notes/warehouse/${warehouseId}`,
    );
    return res.data;
  },

  async getByType(type: ExitNoteType): Promise<PaginatedResponse<ExitNote>> {
    const res = await apiClient.get(`/inventory/exit-notes/type/${type}`);
    return res.data;
  },

  async getByStatus(
    status: ExitNoteStatus,
  ): Promise<PaginatedResponse<ExitNote>> {
    const res = await apiClient.get(`/inventory/exit-notes/status/${status}`);
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<ExitNote>> {
    const res = await apiClient.get(`/inventory/exit-notes/${id}`);
    return res.data;
  },

  async getStatusInfo(id: string) {
    const res = await apiClient.get(`/inventory/exit-notes/${id}/status`);
    return res.data.data;
  },

  async getSummary(id: string) {
    const res = await apiClient.get(`/inventory/exit-notes/${id}/summary`);
    return res.data.data;
  },

  async create(data: CreateExitNote): Promise<ApiResponse<ExitNote>> {
    const res = await apiClient.post("/inventory/exit-notes", data);
    return res.data;
  },

  async update(
    id: string,
    data: Partial<CreateExitNote> & {
      items?: {
        itemId: string;
        itemName?: string | null;
        quantity: number;
        pickedFromLocation?: string;
        batchId?: string;
        serialNumberId?: string;
        notes?: string;
      }[];
    },
  ): Promise<ApiResponse<ExitNote>> {
    const res = await apiClient.put(`/inventory/exit-notes/${id}`, data);
    return res.data;
  },

  async start(id: string): Promise<ApiResponse<ExitNote>> {
    const res = await apiClient.patch(`/inventory/exit-notes/${id}/start`);
    return res.data;
  },

  async markReady(id: string): Promise<ApiResponse<ExitNote>> {
    const res = await apiClient.patch(`/inventory/exit-notes/${id}/ready`);
    return res.data;
  },

  async deliver(id: string): Promise<ApiResponse<ExitNote>> {
    const res = await apiClient.patch(`/inventory/exit-notes/${id}/deliver`);
    return res.data;
  },

  async cancel(id: string, reason: string): Promise<ApiResponse<ExitNote>> {
    const res = await apiClient.patch(`/inventory/exit-notes/${id}/cancel`, {
      reason,
    });
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse<ExitNote>> {
    const res = await apiClient.delete(`/inventory/exit-notes/${id}`);
    return res.data;
  },

  async getItems(exitNoteId: string): Promise<ApiResponse<any>> {
    const res = await apiClient.get(
      `/inventory/exit-notes/${exitNoteId}/items`,
    );
    return res.data;
  },

  async pickItem(
    exitNoteId: string,
    itemId: string,
    data: {
      quantityPicked?: number;
      location?: string;
      notes?: string;
    },
  ): Promise<ApiResponse<any>> {
    const res = await apiClient.patch(
      `/inventory/exit-notes/${exitNoteId}/items/${itemId}/pick`,
      data,
    );
    return res.data;
  },

  async verifyItem(
    exitNoteId: string,
    itemId: string,
  ): Promise<ApiResponse<any>> {
    const res = await apiClient.patch(
      `/inventory/exit-notes/${exitNoteId}/items/${itemId}/verify`,
    );
    return res.data;
  },

  async getItemsSummary(exitNoteId: string): Promise<ApiResponse<any>> {
    const res = await apiClient.get(
      `/inventory/exit-notes/${exitNoteId}/items/summary`,
    );
    return res.data;
  },
};

export default exitNoteService;
