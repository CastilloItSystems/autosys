// app/api/workshop/workshopBayService.ts
import apiClient from '../apiClient'
import type {
  WorkshopBay,
  WorkshopBayFilters,
  CreateWorkshopBayInput,
  UpdateWorkshopBayInput,
  WorkshopPagedResponse,
  WorkshopResponse,
} from '@/libs/interfaces/workshop'

const BASE = '/workshop/bays'

const workshopBayService = {
  async getAll(filters?: WorkshopBayFilters): Promise<WorkshopPagedResponse<WorkshopBay>> {
    const res = await apiClient.get(BASE, { params: filters })
    return res.data
  },

  async getById(id: string): Promise<WorkshopResponse<WorkshopBay>> {
    const res = await apiClient.get(`${BASE}/${id}`)
    return res.data
  },

  async create(data: CreateWorkshopBayInput): Promise<WorkshopResponse<WorkshopBay>> {
    const res = await apiClient.post(BASE, data)
    return res.data
  },

  async update(id: string, data: UpdateWorkshopBayInput): Promise<WorkshopResponse<WorkshopBay>> {
    const res = await apiClient.put(`${BASE}/${id}`, data)
    return res.data
  },

  async toggleActive(id: string): Promise<WorkshopResponse<WorkshopBay>> {
    const res = await apiClient.patch(`${BASE}/${id}/toggle-active`)
    return res.data
  },

  async delete(id: string): Promise<WorkshopResponse<null>> {
    const res = await apiClient.delete(`${BASE}/${id}`)
    return res.data
  },
}

export default workshopBayService
