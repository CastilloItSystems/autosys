import apiClient from "./apiClient";
import {
  Batch,
  CreateBatchInput,
  UpdateBatchInput,
  BatchFilters,
  BatchListResponse,
} from "../../types/batch.interface";

// Get all batches with pagination
export const getBatches = async (
  page: number = 1,
  limit: number = 20,
  filters?: BatchFilters,
) => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  if (filters?.itemId) params.append("itemId", filters.itemId);
  if (filters?.sku) params.append("sku", filters.sku);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.warehouseId) params.append("warehouseId", filters.warehouseId);
  if (filters?.expiryDateFrom)
    params.append("expiryDateFrom", filters.expiryDateFrom.toString());
  if (filters?.expiryDateTo)
    params.append("expiryDateTo", filters.expiryDateTo.toString());

  const response = await apiClient.get<BatchListResponse>(
    `/inventory/batches?${params.toString()}`,
  );
  return response.data;
};

// Get single batch by ID
export const getBatchById = async (id: string): Promise<Batch> => {
  const response = await apiClient.get<Batch>(`/inventory/batches/${id}`);
  return response.data;
};

// Get batches by item ID
export const getBatchesByItemId = async (itemId: string): Promise<Batch[]> => {
  const response = await apiClient.get<Batch[]>(
    `/inventory/batches/item/${itemId}`,
  );
  return response.data;
};

// Get batches by warehouse ID
export const getBatchesByWarehouseId = async (
  warehouseId: string,
): Promise<Batch[]> => {
  const response = await apiClient.get<Batch[]>(
    `/inventory/batches/warehouse/${warehouseId}`,
  );
  return response.data;
};

// Get batches by status
export const getBatchesByStatus = async (status: string): Promise<Batch[]> => {
  const response = await apiClient.get<Batch[]>(
    `/inventory/batches/status/${status}`,
  );
  return response.data;
};

// Create new batch
export const createBatch = async (data: CreateBatchInput): Promise<Batch> => {
  const response = await apiClient.post<Batch>("/inventory/batches", data);
  return response.data;
};

// Update batch
export const updateBatch = async (
  id: string,
  data: UpdateBatchInput,
): Promise<Batch> => {
  const response = await apiClient.put<Batch>(`/inventory/batches/${id}`, data);
  return response.data;
};

// Delete batch
export const deleteBatch = async (id: string): Promise<void> => {
  await apiClient.delete(`/inventory/batches/${id}`);
};

// Update batch status
export const updateBatchStatus = async (
  id: string,
  status: string,
): Promise<Batch> => {
  const response = await apiClient.patch<Batch>(
    `/inventory/batches/${id}/status`,
    { status },
  );
  return response.data;
};
