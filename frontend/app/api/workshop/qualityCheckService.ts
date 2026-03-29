// app/api/workshop/qualityCheckService.ts
import apiClient from '../apiClient'
import type {
  QualityCheck,
  CreateQualityCheckInput,
  SubmitQualityCheckInput,
  WorkshopPagedResponse,
  WorkshopResponse,
} from '@/libs/interfaces/workshop'

const BASE = '/workshop/quality-checks'

const qualityCheckService = {
  async getAll(params?: { serviceOrderId?: string; page?: number; limit?: number }): Promise<WorkshopPagedResponse<QualityCheck>> {
    const res = await apiClient.get(BASE, { params })
    return res.data
  },

  async getById(id: string): Promise<WorkshopResponse<QualityCheck>> {
    const res = await apiClient.get(`${BASE}/${id}`)
    return res.data
  },

  async getByOrder(serviceOrderId: string): Promise<WorkshopResponse<QualityCheck>> {
    const res = await apiClient.get(`${BASE}/order/${serviceOrderId}`)
    return res.data
  },

  async create(data: CreateQualityCheckInput): Promise<WorkshopResponse<QualityCheck>> {
    const res = await apiClient.post(BASE, data)
    return res.data
  },

  async submit(id: string, data: SubmitQualityCheckInput): Promise<WorkshopResponse<QualityCheck>> {
    const res = await apiClient.patch(`${BASE}/${id}/submit`, data)
    return res.data
  },
}

export default qualityCheckService
