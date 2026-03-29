// app/api/workshop/serviceOrderService.ts
import apiClient from '../apiClient'
import type {
  ServiceOrder,
  ServiceOrderFilters,
  CreateServiceOrderInput,
  UpdateServiceOrderInput,
  UpdateServiceOrderStatusInput,
  WorkshopPagedResponse,
  WorkshopResponse,
} from '@/libs/interfaces/workshop'

const BASE = '/workshop/service-orders'

const serviceOrderService = {
  async getAll(filters?: ServiceOrderFilters): Promise<WorkshopPagedResponse<ServiceOrder>> {
    const res = await apiClient.get(BASE, { params: filters })
    return res.data
  },

  async getById(id: string): Promise<WorkshopResponse<ServiceOrder>> {
    const res = await apiClient.get(`${BASE}/${id}`)
    return res.data
  },

  async create(data: CreateServiceOrderInput): Promise<WorkshopResponse<ServiceOrder>> {
    const res = await apiClient.post(BASE, data)
    return res.data
  },

  async update(id: string, data: UpdateServiceOrderInput): Promise<WorkshopResponse<ServiceOrder>> {
    const res = await apiClient.put(`${BASE}/${id}`, data)
    return res.data
  },

  async updateStatus(id: string, payload: UpdateServiceOrderStatusInput): Promise<WorkshopResponse<ServiceOrder>> {
    const res = await apiClient.patch(`${BASE}/${id}/status`, payload)
    return res.data
  },

  async delete(id: string): Promise<WorkshopResponse<null>> {
    const res = await apiClient.delete(`${BASE}/${id}`)
    return res.data
  },
}

export default serviceOrderService
