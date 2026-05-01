// app/api/workshop/receptionService.ts
import apiClient from "@/app/api/apiClient";
import type {
  CreateReceptionInput,
  ReceptionFilters,
  UpdateReceptionInput,
  VehicleReception,
} from '@/modules/workshop/receptions/interfaces/reception.interface';
import type { WorkshopPagedResponse, WorkshopResponse } from '@/modules/workshop/shared/interfaces/shared.interface';

const BASE = "/workshop/receptions";

const receptionService = {
  async getAll(
    filters?: ReceptionFilters,
  ): Promise<WorkshopPagedResponse<VehicleReception>> {
    const res = await apiClient.get(BASE, { params: filters });
    return res.data;
  },

  async getById(id: string): Promise<WorkshopResponse<VehicleReception>> {
    const res = await apiClient.get(`${BASE}/${id}`);
    return res.data;
  },

  async create(
    data: CreateReceptionInput,
  ): Promise<WorkshopResponse<VehicleReception>> {
    const res = await apiClient.post(BASE, data);
    return res.data;
  },

  async update(
    id: string,
    data: UpdateReceptionInput,
  ): Promise<WorkshopResponse<VehicleReception>> {
    const res = await apiClient.put(`${BASE}/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<WorkshopResponse<null>> {
    const res = await apiClient.delete(`${BASE}/${id}`);
    return res.data;
  },

  async uploadSignature(
    id: string,
    signatureBase64: string,
    diagnosticAuthorized: boolean,
  ) {
    const res = await apiClient.post(`${BASE}/${id}/signature`, {
      signatureBase64,
      diagnosticAuthorized,
    });
    return res.data;
  },
};

export default receptionService;
