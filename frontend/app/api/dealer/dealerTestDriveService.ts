import apiClient from "../apiClient";
import type { DealerTestDrive } from "@/libs/interfaces/dealer/dealerTestDrive.interface";

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

export interface GetDealerTestDrivesParams {
  page?: number;
  limit?: number;
  search?: string;
  dealerUnitId?: string;
  status?: string;
  isActive?: "true" | "false";
  fromDate?: string;
  toDate?: string;
  sortBy?: "scheduledAt" | "createdAt" | "updatedAt" | "status";
  sortOrder?: "asc" | "desc";
}

export interface SaveDealerTestDriveRequest {
  dealerUnitId: string;
  customerName: string;
  customerDocument?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  driverLicense?: string | null;
  scheduledAt: string;
  advisorName?: string | null;
  routeDescription?: string | null;
  observations?: string | null;
  customerFeedback?: string | null;
  status?: string;
  isActive?: boolean;
}

const BASE_ROUTE = "/dealer/test-drives";

const dealerTestDriveService = {
  async getAll(params?: GetDealerTestDrivesParams): Promise<PaginatedResponse<DealerTestDrive>> {
    const res = await apiClient.get(BASE_ROUTE, { params });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<DealerTestDrive>> {
    const res = await apiClient.get(`${BASE_ROUTE}/${id}`);
    return res.data;
  },

  async create(data: SaveDealerTestDriveRequest): Promise<ApiResponse<DealerTestDrive>> {
    const res = await apiClient.post(BASE_ROUTE, data);
    return res.data;
  },

  async update(id: string, data: Partial<SaveDealerTestDriveRequest>): Promise<ApiResponse<DealerTestDrive>> {
    const res = await apiClient.put(`${BASE_ROUTE}/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse<{ success: boolean; id: string }>> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}`);
    return res.data;
  },
};

export default dealerTestDriveService;
