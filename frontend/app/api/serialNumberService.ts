import apiClient from "./apiClient";
import {
  SerialNumber,
  CreateSerialNumberInput,
  UpdateSerialNumberInput,
  SerialNumberFilters,
  SerialNumberListResponse,
  SerialNumberJourney,
} from "../../types/serialNumber.interface";

// Get all serial numbers with pagination
export const getSerialNumbers = async (
  page: number = 1,
  limit: number = 20,
  filters?: SerialNumberFilters,
) => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  if (filters?.itemId) params.append("itemId", filters.itemId);
  if (filters?.sku) params.append("sku", filters.sku);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.warehouseId) params.append("warehouseId", filters.warehouseId);
  if (filters?.serialNumber)
    params.append("serialNumber", filters.serialNumber);

  const response = await apiClient.get<SerialNumberListResponse>(
    `/inventory/serial-numbers?${params.toString()}`,
  );
  return response.data;
};

// Get single serial number by ID
export const getSerialNumberById = async (
  id: string,
): Promise<SerialNumber> => {
  const response = await apiClient.get<SerialNumber>(
    `/inventory/serial-numbers/${id}`,
  );
  return response.data;
};

// Get serial number by serial number string
export const getSerialNumberBySerialNumber = async (
  serialNumber: string,
): Promise<SerialNumber> => {
  const response = await apiClient.get<SerialNumber>(
    `/inventory/serial-numbers/search/${serialNumber}`,
  );
  return response.data;
};

// Get serial numbers by item ID
export const getSerialNumbersByItemId = async (
  itemId: string,
): Promise<SerialNumber[]> => {
  const response = await apiClient.get<SerialNumber[]>(
    `/inventory/serial-numbers/item/${itemId}`,
  );
  return response.data;
};

// Get serial numbers by warehouse ID
export const getSerialNumbersByWarehouseId = async (
  warehouseId: string,
): Promise<SerialNumber[]> => {
  const response = await apiClient.get<SerialNumber[]>(
    `/inventory/serial-numbers/warehouse/${warehouseId}`,
  );
  return response.data;
};

// Get serial numbers by status
export const getSerialNumbersByStatus = async (
  status: string,
): Promise<SerialNumber[]> => {
  const response = await apiClient.get<SerialNumber[]>(
    `/inventory/serial-numbers/status/${status}`,
  );
  return response.data;
};

// Create new serial number
export const createSerialNumber = async (
  data: CreateSerialNumberInput,
): Promise<SerialNumber> => {
  const response = await apiClient.post<SerialNumber>(
    "/inventory/serial-numbers",
    data,
  );
  return response.data;
};

// Update serial number
export const updateSerialNumber = async (
  id: string,
  data: UpdateSerialNumberInput,
): Promise<SerialNumber> => {
  const response = await apiClient.put<SerialNumber>(
    `/inventory/serial-numbers/${id}`,
    data,
  );
  return response.data;
};

// Assign serial number to warehouse
export const assignSerialToWarehouse = async (
  id: string,
  warehouseId: string,
): Promise<SerialNumber> => {
  const response = await apiClient.patch<SerialNumber>(
    `/inventory/serial-numbers/${id}/assign`,
    { warehouseId },
  );
  return response.data;
};

// Delete serial number
export const deleteSerialNumber = async (id: string): Promise<void> => {
  await apiClient.delete(`/inventory/serial-numbers/${id}`);
};

// Get serial number's tracking/journey
export const getSerialNumberJourney = async (
  id: string,
): Promise<SerialNumberJourney> => {
  const response = await apiClient.get<SerialNumberJourney>(
    `/inventory/serial-numbers/${id}/tracking/journey`,
  );
  return response.data;
};

// Update serial number status
export const updateSerialNumberStatus = async (
  id: string,
  status: string,
): Promise<SerialNumber> => {
  const response = await apiClient.patch<SerialNumber>(
    `/inventory/serial-numbers/${id}/status`,
    { status },
  );
  return response.data;
};
