import apiClient from "../apiClient";
import type {
  EntryNote,
  EntryNoteItem,
  EntryNoteStatus,
  EntryType,
} from "@/libs/interfaces/inventory/entryNote.interface";

// ===== Types =====

export interface EntryNotesResponse {
  data: EntryNote[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface EntryNoteResponse {
  data: EntryNote;
}

export interface CreateEntryNotePayload {
  type?: EntryType;
  purchaseOrderId?: string | null;
  warehouseId: string;
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
  supplierName?: string | null;
  supplierId?: string | null;
  supplierPhone?: string | null;
  reason?: string | null;
  reference?: string | null;
}

export interface AddEntryNoteItemPayload {
  itemId: string;
  quantityReceived: number;
  unitCost: number;
  storedToLocation?: string | null;
  batchId?: string | null;
  serialNumberId?: string | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
}

// ===== CRUD =====

/**
 * Get all entry notes with optional filters and pagination
 */
export const getEntryNotes = async (params?: {
  page?: number;
  limit?: number;
  type?: EntryType;
  status?: EntryNoteStatus;
  purchaseOrderId?: string;
  warehouseId?: string;
  receivedBy?: string;
  receivedFrom?: string;
  receivedTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<EntryNotesResponse> => {
  const response = await apiClient.get("/inventory/entry-notes", { params });
  return {
    data: response.data.data || [],
    meta: response.data.meta || { page: 1, limit: 20, total: 0, totalPages: 0 },
  };
};

/**
 * Get single entry note by ID
 */
export const getEntryNote = async (
  id: string,
  includeItems = true,
): Promise<EntryNoteResponse> => {
  const response = await apiClient.get(`/inventory/entry-notes/${id}`, {
    params: { includeItems },
  });
  return { data: response.data.data };
};

/**
 * Create new entry note
 */
export const createEntryNote = async (
  data: CreateEntryNotePayload,
): Promise<EntryNoteResponse> => {
  const response = await apiClient.post("/inventory/entry-notes", data);
  return { data: response.data.data };
};

/**
 * Update entry note
 */
export const updateEntryNote = async (
  id: string,
  data: UpdateEntryNotePayload,
): Promise<EntryNoteResponse> => {
  const response = await apiClient.put(`/inventory/entry-notes/${id}`, data);
  return { data: response.data.data };
};

/**
 * Delete entry note (only if not completed)
 */
export const deleteEntryNote = async (id: string): Promise<void> => {
  await apiClient.delete(`/inventory/entry-notes/${id}`);
};

// ===== Items =====

/**
 * Get items of an entry note
 */
export const getEntryNoteItems = async (
  entryNoteId: string,
): Promise<EntryNoteItem[]> => {
  const response = await apiClient.get(
    `/inventory/entry-notes/${entryNoteId}/items`,
  );
  return response.data.data || [];
};

/**
 * Add item to entry note
 */
export const addEntryNoteItem = async (
  entryNoteId: string,
  data: AddEntryNoteItemPayload,
): Promise<EntryNoteItem> => {
  const response = await apiClient.post(
    `/inventory/entry-notes/${entryNoteId}/items`,
    data,
  );
  return response.data.data;
};

// ===== Workflow actions =====

/**
 * Start processing entry note (PENDING → IN_PROGRESS)
 */
export const startEntryNote = async (
  id: string,
): Promise<EntryNoteResponse> => {
  const response = await apiClient.post(`/inventory/entry-notes/${id}/start`);
  return { data: response.data.data };
};

/**
 * Complete entry note (IN_PROGRESS → COMPLETED) — updates stock & creates movements
 */
export const completeEntryNote = async (
  id: string,
): Promise<EntryNoteResponse> => {
  const response = await apiClient.post(
    `/inventory/entry-notes/${id}/complete`,
  );
  return { data: response.data.data };
};

/**
 * Cancel entry note (PENDING|IN_PROGRESS → CANCELLED)
 */
export const cancelEntryNote = async (
  id: string,
): Promise<EntryNoteResponse> => {
  const response = await apiClient.post(`/inventory/entry-notes/${id}/cancel`);
  return { data: response.data.data };
};
