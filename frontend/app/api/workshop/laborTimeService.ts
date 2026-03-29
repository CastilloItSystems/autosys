// app/api/workshop/laborTimeService.ts
import apiClient from '../apiClient'
import type {
  LaborTime,
  LaborTimeFilters,
  StartLaborTimeInput,
  WorkshopPagedResponse,
  WorkshopResponse,
} from '@/libs/interfaces/workshop'

const BASE = '/workshop/labor-times'

const laborTimeService = {
  async getAll(filters?: LaborTimeFilters): Promise<WorkshopPagedResponse<LaborTime>> {
    const res = await apiClient.get(BASE, { params: filters })
    return res.data
  },

  async getById(id: string): Promise<WorkshopResponse<LaborTime>> {
    const res = await apiClient.get(`${BASE}/${id}`)
    return res.data
  },

  async start(data: StartLaborTimeInput): Promise<WorkshopResponse<LaborTime>> {
    const res = await apiClient.post(`${BASE}/start`, data)
    return res.data
  },

  async pause(id: string): Promise<WorkshopResponse<LaborTime>> {
    const res = await apiClient.patch(`${BASE}/${id}/pause`)
    return res.data
  },

  async resume(id: string): Promise<WorkshopResponse<LaborTime>> {
    const res = await apiClient.patch(`${BASE}/${id}/resume`)
    return res.data
  },

  async finish(id: string): Promise<WorkshopResponse<LaborTime>> {
    const res = await apiClient.patch(`${BASE}/${id}/finish`)
    return res.data
  },

  async cancel(id: string): Promise<WorkshopResponse<LaborTime>> {
    const res = await apiClient.patch(`${BASE}/${id}/cancel`)
    return res.data
  },
}

export default laborTimeService
