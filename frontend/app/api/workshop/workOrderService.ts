import apiClient from "../apiClient";
import {
  WorkOrder,
  WorkOrderStatus,
  WorkOrderFilters,
  WorkOrderResponse,
  WorkOrderItem,
} from "@/libs/interfaces/workshop";
import { WorkOrderHistory } from "@/libs/interfaces/workshop/workOrderMain.interface";
import {
  WorkOrderFormData,
  WorkOrderStatusFormData,
} from "@/libs/zods/workshop";

const BASE_URL = "/work-orders";

// Work Orders CRUD
export const getWorkOrders = async (filters?: WorkOrderFilters) => {
  const response = await apiClient.get<WorkOrderResponse>(BASE_URL, {
    params: filters,
  });
  return response.data;
};

export const getWorkOrder = async (id: string) => {
  const response = await apiClient.get<{ success: boolean; data: WorkOrder }>(
    `${BASE_URL}/${id}`
  );
  return response.data.data;
};

export const createWorkOrder = async (data: WorkOrderFormData) => {
  const response = await apiClient.post<{ success: boolean; data: WorkOrder }>(
    BASE_URL,
    data
  );
  return response.data.data;
};

export const updateWorkOrder = async (id: string, data: WorkOrderFormData) => {
  const response = await apiClient.put<{ success: boolean; data: WorkOrder }>(
    `${BASE_URL}/${id}`,
    data
  );
  return response.data.data;
};

export const deleteWorkOrder = async (id: string) => {
  const response = await apiClient.delete<{
    success: boolean;
    message: string;
  }>(`${BASE_URL}/${id}`);
  return response.data;
};

// Work Order Items
export const getWorkOrderItems = async (workOrderId: string) => {
  const response = await apiClient.get<{
    success: boolean;
    data: WorkOrderItem[];
  }>(`${BASE_URL}/${workOrderId}/items`);
  return response.data.data;
};

export const createWorkOrderItem = async (
  workOrderId: string,
  data: Partial<WorkOrderItem>
) => {
  const response = await apiClient.post<{
    success: boolean;
    data: WorkOrderItem;
  }>(`${BASE_URL}/${workOrderId}/items`, data);
  return response.data.data;
};

export const updateWorkOrderItem = async (
  workOrderId: string,
  itemId: string,
  data: Partial<WorkOrderItem>
) => {
  const response = await apiClient.put<{
    success: boolean;
    data: WorkOrderItem;
  }>(`${BASE_URL}/${workOrderId}/items/${itemId}`, data);
  return response.data.data;
};

export const deleteWorkOrderItem = async (
  workOrderId: string,
  itemId: string
) => {
  const response = await apiClient.delete<{
    success: boolean;
    message: string;
  }>(`${BASE_URL}/${workOrderId}/items/${itemId}`);
  return response.data;
};

// Work Order Status Management
export const changeWorkOrderStatus = async (
  id: string,
  newStatus: string,
  notes?: string
) => {
  const response = await apiClient.patch<{
    success: boolean;
    data: WorkOrder;
    msg: string;
    estadoAnterior: any;
    estadoNuevo: any;
  }>(`${BASE_URL}/${id}/status`, {
    newStatus,
    notes,
  });
  return response.data;
};

// Work Order Statuses CRUD
export const getWorkOrderStatuses = async () => {
  const response = await apiClient.get<{
    success: boolean;
    data: WorkOrderStatus[];
  }>("/work-order-statuses");
  return response.data.data;
};

export const getWorkOrderStatus = async (id: string) => {
  const response = await apiClient.get<{
    success: boolean;
    data: WorkOrderStatus;
  }>(`/work-order-statuses/${id}`);
  return response.data.data;
};

export const createWorkOrderStatus = async (data: WorkOrderStatusFormData) => {
  const response = await apiClient.post<{
    success: boolean;
    data: WorkOrderStatus;
  }>("/work-order-statuses", data);
  return response.data.data;
};

export const updateWorkOrderStatus = async (
  id: string,
  data: WorkOrderStatusFormData
) => {
  const response = await apiClient.put<{
    success: boolean;
    data: WorkOrderStatus;
  }>(`/work-order-statuses/${id}`, data);
  return response.data.data;
};

export const deleteWorkOrderStatus = async (id: string) => {
  const response = await apiClient.delete<{
    success: boolean;
    message: string;
  }>(`/work-order-statuses/${id}`);
  return response.data;
};

// Work Order History
export const getWorkOrderHistory = async (workOrderId: string) => {
  const response = await apiClient.get<{
    success: boolean;
    data: WorkOrderHistory[];
    pagination: {
      total: number;
      page: number;
      pages: number;
      limit: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>(`${BASE_URL}/${workOrderId}/history`);
  return response.data;
};
