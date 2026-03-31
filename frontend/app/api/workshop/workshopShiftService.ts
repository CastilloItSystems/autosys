// app/api/workshop/workshopShiftService.ts
import apiClient from "../apiClient";
import type {
  WorkshopShift,
  WorkshopShiftFilters,
  CreateWorkshopShiftInput,
  UpdateWorkshopShiftInput,
  WorkshopPagedResponse,
  WorkshopResponse,
} from "@/libs/interfaces/workshop";

const BASE = "/workshop/shifts";

const workshopShiftService = {
  async getAll(filters?: WorkshopShiftFilters): Promise<WorkshopPagedResponse<WorkshopShift>> {
    const res = await apiClient.get(BASE, { params: filters });
    return res.data;
  },

  async getById(id: string): Promise<WorkshopResponse<WorkshopShift>> {
    const res = await apiClient.get(`${BASE}/${id}`);
    return res.data;
  },

  async create(data: CreateWorkshopShiftInput): Promise<WorkshopResponse<WorkshopShift>> {
    const res = await apiClient.post(BASE, data);
    return res.data;
  },

  async update(id: string, data: UpdateWorkshopShiftInput): Promise<WorkshopResponse<WorkshopShift>> {
    const res = await apiClient.put(`${BASE}/${id}`, data);
    return res.data;
  },

  async toggleActive(id: string): Promise<WorkshopResponse<WorkshopShift>> {
    const res = await apiClient.patch(`${BASE}/${id}/toggle-active`);
    return res.data;
  },
};

export default workshopShiftService;
