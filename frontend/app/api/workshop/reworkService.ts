// app/api/workshop/reworkService.ts
import apiClient from '../apiClient'
import type {
  WorkshopRework,
  ReworkFilters,
  CreateReworkInput,
  UpdateReworkInput,
  ReworkStatus,
  WorkshopPagedResponse,
  WorkshopResponse,
} from '@/libs/interfaces/workshop'

const BASE = '/workshop/reworks'

const reworkService = {
  async getAll(filters?: ReworkFilters): Promise<WorkshopPagedResponse<WorkshopRework>> {
    const res = await apiClient.get(BASE, { params: filters })
    return res.data
  },

  async getById(id: string): Promise<WorkshopResponse<WorkshopRework>> {
    const res = await apiClient.get(`${BASE}/${id}`)
    return res.data
  },

  async create(data: CreateReworkInput): Promise<WorkshopResponse<WorkshopRework>> {
    const res = await apiClient.post(BASE, data)
    return res.data
  },

  async update(id: string, data: UpdateReworkInput): Promise<WorkshopResponse<WorkshopRework>> {
    const res = await apiClient.put(`${BASE}/${id}`, data)
    return res.data
  },

  async delete(id: string): Promise<WorkshopResponse<null>> {
    const res = await apiClient.delete(`${BASE}/${id}`)
    return res.data
  },

  async updateStatus(id: string, status: ReworkStatus): Promise<WorkshopResponse<WorkshopRework>> {
    const res = await apiClient.patch(`${BASE}/${id}/status`, { status })
    return res.data
  },
}

export default reworkService
