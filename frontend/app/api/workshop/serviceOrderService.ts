// app/api/workshop/serviceOrderService.ts
import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "../inventory/types";

export type ServiceOrderStatus =
  | "RECEIVED"
  | "IN_PROGRESS"
  | "DONE"
  | "DELIVERED"
  | "CANCELLED";

export type ServiceOrderItemType = "LABOR" | "PART" | "OTHER";

export interface ServiceOrderItem {
  id?: string;
  type: ServiceOrderItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  total?: number;
}

export interface ServiceOrder {
  id: string;
  folio: string;
  status: ServiceOrderStatus;
  customerId: string;
  customer: { id: string; name: string; code: string; phone?: string; mobile?: string } | null;
  customerVehicleId: string | null;
  customerVehicle: { id: string; plate: string; vin?: string; year?: number; color?: string } | null;
  vehiclePlate: string | null;
  vehicleDesc: string | null;
  mileageIn: number | null;
  mileageOut: number | null;
  diagnosisNotes: string | null;
  observations: string | null;
  assignedTechnicianId: string | null;
  receivedAt: string;
  estimatedDelivery: string | null;
  deliveredAt: string | null;
  laborTotal: number;
  partsTotal: number;
  total: number;
  items: ServiceOrderItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrderFilters {
  status?: ServiceOrderStatus;
  customerId?: string;
  assignedTechnicianId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const BASE = "/workshop/service-orders";

const serviceOrderService = {
  async getAll(filters?: ServiceOrderFilters): Promise<PaginatedResponse<ServiceOrder>> {
    const res = await apiClient.get(BASE, { params: filters });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<ServiceOrder>> {
    const res = await apiClient.get(`${BASE}/${id}`);
    return res.data;
  },

  async create(data: Partial<ServiceOrder>): Promise<ApiResponse<ServiceOrder>> {
    const res = await apiClient.post(BASE, data);
    return res.data;
  },

  async update(id: string, data: Partial<ServiceOrder>): Promise<ApiResponse<ServiceOrder>> {
    const res = await apiClient.put(`${BASE}/${id}`, data);
    return res.data;
  },

  async updateStatus(
    id: string,
    payload: { status: ServiceOrderStatus; mileageOut?: number }
  ): Promise<ApiResponse<ServiceOrder>> {
    const res = await apiClient.patch(`${BASE}/${id}/status`, payload);
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    const res = await apiClient.delete(`${BASE}/${id}`);
    return res.data;
  },
};

export default serviceOrderService;
