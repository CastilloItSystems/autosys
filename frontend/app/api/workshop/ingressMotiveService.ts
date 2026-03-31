// app/api/workshop/ingressMotiveService.ts
import apiClient from '../apiClient'
import type {
  IngressMotive,
  IngressMotiveFilters,
  CreateIngressMotiveInput,
  UpdateIngressMotiveInput,
  WorkshopPagedResponse,
  WorkshopResponse,
} from '@/libs/interfaces/workshop'

const BASE = '/workshop/ingress-motives'

const ingressMotiveService = {
  async getAll(filters?: IngressMotiveFilters): Promise<WorkshopPagedResponse<IngressMotive>> {
    const res = await apiClient.get(BASE, { params: filters })
    return res.data
  },

  async getById(id: string): Promise<WorkshopResponse<IngressMotive>> {
    const res = await apiClient.get(`${BASE}/${id}`)
    return res.data
  },

  async create(data: CreateIngressMotiveInput): Promise<WorkshopResponse<IngressMotive>> {
    const res = await apiClient.post(BASE, data)
    return res.data
  },

  async update(id: string, data: UpdateIngressMotiveInput): Promise<WorkshopResponse<IngressMotive>> {
    const res = await apiClient.put(`${BASE}/${id}`, data)
    return res.data
  },

  async delete(id: string): Promise<WorkshopResponse<null>> {
    const res = await apiClient.delete(`${BASE}/${id}`)
    return res.data
  },
}

export default ingressMotiveService
