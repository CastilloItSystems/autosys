// app/api/crm/customerVehicleService.ts

import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "../inventory/types";
import { CustomerVehicle } from "@/libs/interfaces/crm/customerVehicle.interface";

export interface ServiceHistoryItem {
  id: string;
  folio: string;
  status: string;
  mileageIn?: number | null;
  mileageOut?: number | null;
  diagnosisNotes?: string | null;
  observations?: string | null;
  laborTotal: number;
  partsTotal: number;
  total: number;
  receivedAt: string;
  estimatedDelivery?: string | null;
  deliveredAt?: string | null;
  assignedTechnicianId?: string | null;
  items: { id: string; type: string; description: string; quantity: number; unitPrice: number; total: number }[];
}

interface CustomerVehicleParams {
  page?: number;
  limit?: number;
  brandId?: string;
  isActive?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const customerVehicleService = {
  async getAllByCustomer(
    customerId: string,
    params?: CustomerVehicleParams
  ): Promise<PaginatedResponse<CustomerVehicle>> {
    const res = await apiClient.get(
      `/crm/customers/${customerId}/vehicles`,
      { params }
    );
    return res.data;
  },

  async getById(
    customerId: string,
    vehicleId: string
  ): Promise<ApiResponse<CustomerVehicle>> {
    const res = await apiClient.get(
      `/crm/customers/${customerId}/vehicles/${vehicleId}`
    );
    return res.data;
  },

  async create(
    customerId: string,
    data: Partial<CustomerVehicle>
  ): Promise<ApiResponse<CustomerVehicle>> {
    const res = await apiClient.post(
      `/crm/customers/${customerId}/vehicles`,
      data
    );
    return res.data;
  },

  async update(
    customerId: string,
    vehicleId: string,
    data: Partial<CustomerVehicle>
  ): Promise<ApiResponse<CustomerVehicle>> {
    const res = await apiClient.put(
      `/crm/customers/${customerId}/vehicles/${vehicleId}`,
      data
    );
    return res.data;
  },

  async delete(
    customerId: string,
    vehicleId: string
  ): Promise<ApiResponse<{ success: boolean; id: string }>> {
    const res = await apiClient.delete(
      `/crm/customers/${customerId}/vehicles/${vehicleId}`
    );
    return res.data;
  },

  async getServiceHistory(
    customerId: string,
    vehicleId: string
  ): Promise<ApiResponse<{ vehicle: CustomerVehicle; serviceOrders: ServiceHistoryItem[] }>> {
    const res = await apiClient.get(
      `/crm/customers/${customerId}/vehicles/${vehicleId}/service-history`
    );
    return res.data;
  },
};

export default customerVehicleService;
