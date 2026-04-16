import apiClient from "../apiClient";
import type { DealerReservation } from "@/libs/interfaces/dealer/dealerReservation.interface";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetDealerReservationsParams {
  page?: number;
  limit?: number;
  search?: string;
  dealerUnitId?: string;
  status?: string;
  isActive?: "true" | "false";
  fromDate?: string;
  toDate?: string;
  sortBy?: "reservedAt" | "createdAt" | "updatedAt" | "status";
  sortOrder?: "asc" | "desc";
}

export interface SaveDealerReservationRequest {
  dealerUnitId: string;
  customerName: string;
  customerDocument?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  offeredPrice?: number | null;
  depositAmount?: number | null;
  currency?: string | null;
  expiresAt?: string | null;
  notes?: string | null;
  sourceChannel?: string | null;
  status?: string;
  isActive?: boolean;
}

const BASE_ROUTE = "/dealer/reservations";

const dealerReservationService = {
  async getAll(params?: GetDealerReservationsParams): Promise<PaginatedResponse<DealerReservation>> {
    const res = await apiClient.get(BASE_ROUTE, { params });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<DealerReservation>> {
    const res = await apiClient.get(`${BASE_ROUTE}/${id}`);
    return res.data;
  },

  async create(data: SaveDealerReservationRequest): Promise<ApiResponse<DealerReservation>> {
    const res = await apiClient.post(BASE_ROUTE, data);
    return res.data;
  },

  async update(id: string, data: Partial<SaveDealerReservationRequest>): Promise<ApiResponse<DealerReservation>> {
    const res = await apiClient.put(`${BASE_ROUTE}/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse<{ success: boolean; id: string }>> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}`);
    return res.data;
  },
};

export default dealerReservationService;
