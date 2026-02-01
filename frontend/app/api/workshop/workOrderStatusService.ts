import apiClient from "../apiClient";
import {
  WorkOrderStatus,
  WorkOrderStatusFilters,
  WorkOrderStatusResponse,
  WorkOrderStatusSingleResponse,
} from "@/libs/interfaces/workshop";

const BASE_URL = "/work-order-statuses";

// Get all work order statuses with optional filters
export const getStatuses = async (
  filters?: WorkOrderStatusFilters
): Promise<WorkOrderStatusResponse> => {
  const response = await apiClient.get<WorkOrderStatusResponse>(BASE_URL, {
    params: filters,
  });
  return response.data;
};

// Get a single work order status by ID
export const getStatusById = async (id: string): Promise<WorkOrderStatus> => {
  const response = await apiClient.get<WorkOrderStatusSingleResponse>(
    `${BASE_URL}/${id}`
  );
  return response.data.data;
};

// Create a new work order status
export const createStatus = async (
  data: Partial<WorkOrderStatus>
): Promise<WorkOrderStatus> => {
  const response = await apiClient.post<WorkOrderStatusSingleResponse>(
    BASE_URL,
    data
  );
  return response.data.data;
};

// Update an existing work order status
export const updateStatusById = async (
  id: string,
  data: Partial<WorkOrderStatus>
): Promise<WorkOrderStatus> => {
  const response = await apiClient.put<WorkOrderStatusSingleResponse>(
    `${BASE_URL}/${id}`,
    data
  );
  return response.data.data;
};

// Delete a work order status
export const deleteStatusById = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};

// Get active work order statuses only
export const getActiveStatuses = async (): Promise<WorkOrderStatus[]> => {
  const response = await getStatuses({ activo: true });
  return response.data;
};

// Get work order statuses by type
export const getStatusesByType = async (
  tipo: "inicial" | "intermedio" | "final" | "cancelado"
): Promise<WorkOrderStatus[]> => {
  const response = await getStatuses({ tipo });
  return response.data;
};
