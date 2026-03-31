// app/api/workshop/workshopBranchService.ts
import apiClient from "../apiClient";
import type {
  WorkshopBranch,
  WorkshopBranchFilters,
  CreateWorkshopBranchInput,
  UpdateWorkshopBranchInput,
  WorkshopPagedResponse,
  WorkshopResponse,
} from "@/libs/interfaces/workshop";

const BASE = "/workshop/branches";

const workshopBranchService = {
  async getAll(filters?: WorkshopBranchFilters): Promise<WorkshopPagedResponse<WorkshopBranch>> {
    const res = await apiClient.get(BASE, { params: filters });
    return res.data;
  },

  async getById(id: string): Promise<WorkshopResponse<WorkshopBranch>> {
    const res = await apiClient.get(`${BASE}/${id}`);
    return res.data;
  },

  async create(data: CreateWorkshopBranchInput): Promise<WorkshopResponse<WorkshopBranch>> {
    const res = await apiClient.post(BASE, data);
    return res.data;
  },

  async update(id: string, data: UpdateWorkshopBranchInput): Promise<WorkshopResponse<WorkshopBranch>> {
    const res = await apiClient.put(`${BASE}/${id}`, data);
    return res.data;
  },

  async toggleActive(id: string): Promise<WorkshopResponse<WorkshopBranch>> {
    const res = await apiClient.patch(`${BASE}/${id}/toggle-active`);
    return res.data;
  },
};

export default workshopBranchService;
