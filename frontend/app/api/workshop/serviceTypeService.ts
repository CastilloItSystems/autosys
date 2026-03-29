// app/api/workshop/serviceTypeService.ts
import apiClient from '../apiClient'
import type {
  ServiceType,
  ServiceTypeFilters,
  CreateServiceTypeInput,
  UpdateServiceTypeInput,
  WorkshopPagedResponse,
  WorkshopResponse,
} from '@/libs/interfaces/workshop'

const BASE = '/workshop/service-types'

const serviceTypeService = {
  async getAll(filters?: ServiceTypeFilters): Promise<WorkshopPagedResponse<ServiceType>> {
    const res = await apiClient.get(BASE, { params: filters })
    return res.data
  },

  async getById(id: string): Promise<WorkshopResponse<ServiceType>> {
    const res = await apiClient.get(`${BASE}/${id}`)
    return res.data
  },

  async create(data: CreateServiceTypeInput): Promise<WorkshopResponse<ServiceType>> {
    const res = await apiClient.post(BASE, data)
    return res.data
  },

  async update(id: string, data: UpdateServiceTypeInput): Promise<WorkshopResponse<ServiceType>> {
    const res = await apiClient.put(`${BASE}/${id}`, data)
    return res.data
  },

  async toggleActive(id: string): Promise<WorkshopResponse<ServiceType>> {
    const res = await apiClient.patch(`${BASE}/${id}/toggle-active`)
    return res.data
  },

  async delete(id: string): Promise<WorkshopResponse<null>> {
    const res = await apiClient.delete(`${BASE}/${id}`)
    return res.data
  },
}

export default serviceTypeService
