// app/api/workshop/workshopOperationService.ts
import apiClient from '../apiClient'
import type {
  WorkshopOperation,
  WorkshopOperationFilters,
  CreateWorkshopOperationInput,
  UpdateWorkshopOperationInput,
  WorkshopPagedResponse,
  WorkshopResponse,
} from '@/libs/interfaces/workshop'

const BASE = '/workshop/operations'

const workshopOperationService = {
  async getAll(filters?: WorkshopOperationFilters): Promise<WorkshopPagedResponse<WorkshopOperation>> {
    const res = await apiClient.get(BASE, { params: filters })
    return res.data
  },

  async getById(id: string): Promise<WorkshopResponse<WorkshopOperation>> {
    const res = await apiClient.get(`${BASE}/${id}`)
    return res.data
  },

  async create(data: CreateWorkshopOperationInput): Promise<WorkshopResponse<WorkshopOperation>> {
    const res = await apiClient.post(BASE, data)
    return res.data
  },

  async update(id: string, data: UpdateWorkshopOperationInput): Promise<WorkshopResponse<WorkshopOperation>> {
    const res = await apiClient.put(`${BASE}/${id}`, data)
    return res.data
  },

  async toggleActive(id: string): Promise<WorkshopResponse<WorkshopOperation>> {
    const res = await apiClient.patch(`${BASE}/${id}/toggle-active`)
    return res.data
  },

  async delete(id: string): Promise<WorkshopResponse<null>> {
    const res = await apiClient.delete(`${BASE}/${id}`)
    return res.data
  },
}

export default workshopOperationService
