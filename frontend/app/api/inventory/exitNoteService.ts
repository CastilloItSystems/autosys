import apiClient from "../apiClient";
import {
  ExitNote,
  CreateExitNote,
  ExitNotesResponse,
  ExitNoteResponse,
  ExitNoteStatus,
  ExitNoteType,
} from "@/libs/interfaces/inventory/exitNote.interface";

/**
 * Get all exit notes with optional filters
 * @param page Page number (1-indexed)
 * @param limit Items per page
 * @param type Filter by ExitNoteType
 * @param status Filter by ExitNoteStatus
 * @param warehouseId Filter by warehouse
 * @param search Global search text
 */
export const getExitNotes = async (
  page = 1,
  limit = 20,
  type?: ExitNoteType,
  status?: ExitNoteStatus,
  warehouseId?: string,
  search?: string,
): Promise<ExitNotesResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (type) params.append("type", type);
  if (status) params.append("status", status);
  if (warehouseId) params.append("warehouseId", warehouseId);
  if (search) params.append("search", search);

  const response = await apiClient.get(`/inventory/exit-notes?${params}`);
  // Backend returns: { success, data: ExitNote[], meta: {page, limit, total, totalPages}, message }
  return {
    data: response.data.data || [],
    meta: response.data.meta || { page, limit, total: 0, totalPages: 0 },
  };
};

/**
 * Get exit note by number
 */
export const getExitNoteByNumber = async (
  exitNoteNumber: string,
): Promise<ExitNoteResponse> => {
  const response = await apiClient.get(
    `/inventory/exit-notes/number/${exitNoteNumber}`,
  );
  return { data: response.data.data };
};

/**
 * Get exit notes by warehouse
 */
export const getExitNotesByWarehouse = async (
  warehouseId: string,
): Promise<ExitNotesResponse> => {
  const response = await apiClient.get(
    `/inventory/exit-notes/warehouse/${warehouseId}`,
  );
  return {
    data: response.data.data || [],
    meta: response.data.meta || {
      page: 1,
      limit: 100,
      total: 0,
      totalPages: 0,
    },
  };
};

/**
 * Get exit notes by type
 */
export const getExitNotesByType = async (
  type: ExitNoteType,
): Promise<ExitNotesResponse> => {
  const response = await apiClient.get(`/inventory/exit-notes/type/${type}`);
  return {
    data: response.data.data || [],
    meta: response.data.meta || {
      page: 1,
      limit: 100,
      total: 0,
      totalPages: 0,
    },
  };
};

/**
 * Get exit notes by status
 */
export const getExitNotesByStatus = async (
  status: ExitNoteStatus,
): Promise<ExitNotesResponse> => {
  const response = await apiClient.get(
    `/inventory/exit-notes/status/${status}`,
  );
  return {
    data: response.data.data || [],
    meta: response.data.meta || {
      page: 1,
      limit: 100,
      total: 0,
      totalPages: 0,
    },
  };
};

/**
 * Get single exit note by ID
 */
export const getExitNote = async (id: string): Promise<ExitNoteResponse> => {
  const response = await apiClient.get(`/inventory/exit-notes/${id}`);
  return { data: response.data.data };
};

/**
 * Get status info for an exit note
 */
export const getStatusInfo = async (id: string) => {
  const response = await apiClient.get(`/inventory/exit-notes/${id}/status`);
  return response.data.data;
};

/**
 * Get summary for an exit note
 */
export const getSummary = async (id: string) => {
  const response = await apiClient.get(`/inventory/exit-notes/${id}/summary`);
  return response.data.data;
};

/**
 * Create new exit note
 */
export const createExitNote = async (
  data: CreateExitNote,
): Promise<ExitNoteResponse> => {
  const response = await apiClient.post("/inventory/exit-notes", data);
  return { data: response.data.data };
};

/**
 * Update exit note (only when PENDING)
 */
export const updateExitNote = async (
  id: string,
  data: Partial<CreateExitNote>,
): Promise<ExitNoteResponse> => {
  const response = await apiClient.put(`/inventory/exit-notes/${id}`, data);
  return { data: response.data.data };
};

/**
 * Start preparing an exit note
 * Transitions: PENDING → IN_PROGRESS
 * @Bug FIX: Route was `/prepare` but backend route is `/start`
 */
export const startPreparing = async (id: string): Promise<ExitNoteResponse> => {
  const response = await apiClient.patch(`/inventory/exit-notes/${id}/start`);
  return { data: response.data.data };
};

/**
 * Mark exit note as ready
 * Transitions: IN_PROGRESS → READY
 */
export const markAsReady = async (id: string): Promise<ExitNoteResponse> => {
  const response = await apiClient.patch(`/inventory/exit-notes/${id}/ready`);
  return { data: response.data.data };
};

/**
 * Deliver exit note
 * Transitions: READY → DELIVERED
 */
export const deliverExitNote = async (
  id: string,
): Promise<ExitNoteResponse> => {
  const response = await apiClient.patch(`/inventory/exit-notes/${id}/deliver`);
  return { data: response.data.data };
};

/**
 * Cancel exit note
 * Transitions: PENDING or IN_PROGRESS → CANCELLED
 */
export const cancelExitNote = async (
  id: string,
  reason: string,
): Promise<ExitNoteResponse> => {
  const response = await apiClient.patch(`/inventory/exit-notes/${id}/cancel`, {
    reason,
  });
  return { data: response.data.data };
};

/**
 * Delete exit note (soft delete)
 */
export const deleteExitNote = async (id: string): Promise<ExitNoteResponse> => {
  const response = await apiClient.delete(`/inventory/exit-notes/${id}`);
  return { data: response.data.data };
};

/**
 * Get items for an exit note
 */
export const getExitNoteItems = async (exitNoteId: string) => {
  const response = await apiClient.get(
    `/inventory/exit-notes/${exitNoteId}/items`,
  );
  return response.data.data;
};

/**
 * Pick an item in an exit note
 */
export const pickItem = async (
  exitNoteId: string,
  itemId: string,
  data: {
    quantityPicked?: number;
    location?: string;
    notes?: string;
  },
) => {
  const response = await apiClient.patch(
    `/inventory/exit-notes/${exitNoteId}/items/${itemId}/pick`,
    data,
  );
  return response.data.data;
};

/**
 * Verify an item in an exit note
 */
export const verifyItem = async (exitNoteId: string, itemId: string) => {
  const response = await apiClient.patch(
    `/inventory/exit-notes/${exitNoteId}/items/${itemId}/verify`,
  );
  return response.data.data;
};

/**
 * Get items summary for an exit note
 */
export const getItemsSummary = async (exitNoteId: string) => {
  const response = await apiClient.get(
    `/inventory/exit-notes/${exitNoteId}/items/summary`,
  );
  return response.data.data;
};
