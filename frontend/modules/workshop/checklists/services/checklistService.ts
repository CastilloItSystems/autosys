// app/api/workshop/checklistService.ts
import apiClient from "@/app/api/apiClient";
import type { ChecklistResponse, ChecklistResponsesData, ChecklistTemplate, ChecklistTemplateFilters, CreateChecklistTemplateInput, UpdateChecklistTemplateInput } from '@/modules/workshop/checklists/interfaces/checklist.interface';
import type { WorkshopPagedResponse, WorkshopResponse } from '@/modules/workshop/shared/interfaces/shared.interface';
const BASE = "/workshop/checklists";

const checklistService = {
  async getAll(
    filters?: ChecklistTemplateFilters,
  ): Promise<WorkshopPagedResponse<ChecklistTemplate>> {
    const res = await apiClient.get(BASE, { params: filters });
    return res.data;
  },

  async getById(id: string): Promise<WorkshopResponse<ChecklistTemplate>> {
    const res = await apiClient.get(`${BASE}/${id}`);
    return res.data;
  },

  async create(
    data: CreateChecklistTemplateInput,
  ): Promise<WorkshopResponse<ChecklistTemplate>> {
    const res = await apiClient.post(BASE, data);
    return res.data;
  },

  async update(
    id: string,
    data: UpdateChecklistTemplateInput,
  ): Promise<WorkshopResponse<ChecklistTemplate>> {
    const res = await apiClient.put(`${BASE}/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<WorkshopResponse<null>> {
    const res = await apiClient.delete(`${BASE}/${id}`);
    return res.data;
  },

  async toggleActive(id: string): Promise<WorkshopResponse<ChecklistTemplate>> {
    const res = await apiClient.patch(`${BASE}/${id}/toggle-active`);
    return res.data;
  },

  async getChecklistResponses(
    receptionId: string,
  ): Promise<WorkshopResponse<ChecklistResponsesData>> {
    const res = await apiClient.get(
      `/workshop/receptions/${receptionId}/checklist-responses`,
    );
    return res.data;
  },

  async saveChecklistResponses(
    receptionId: string,
    responses: ChecklistResponse[],
  ): Promise<WorkshopResponse<ChecklistResponse[]>> {
    const res = await apiClient.post(
      `/workshop/receptions/${receptionId}/checklist-responses`,
      responses,
    );
    return res.data;
  },
};
export default checklistService;
