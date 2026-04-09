// app/api/workshop/warrantyService.ts
import apiClient from '../apiClient'
import type {
  WorkshopWarranty,
  WarrantyFilters,
  CreateWarrantyInput,
  UpdateWarrantyInput,
  WarrantyStatus,
  WorkshopPagedResponse,
  WorkshopResponse,
} from '@/libs/interfaces/workshop'

const BASE = '/workshop/warranties'

const warrantyService = {
  async getAll(filters?: WarrantyFilters): Promise<WorkshopPagedResponse<WorkshopWarranty>> {
    const res = await apiClient.get(BASE, { params: filters })
    return res.data
  },

  async getById(id: string): Promise<WorkshopResponse<WorkshopWarranty>> {
    const res = await apiClient.get(`${BASE}/${id}`)
    return res.data
  },

  async create(data: CreateWarrantyInput): Promise<WorkshopResponse<WorkshopWarranty>> {
    const res = await apiClient.post(BASE, data)
    return res.data
  },

  async update(id: string, data: UpdateWarrantyInput): Promise<WorkshopResponse<WorkshopWarranty>> {
    const res = await apiClient.put(`${BASE}/${id}`, data)
    return res.data
  },

  async updateStatus(id: string, status: WarrantyStatus): Promise<WorkshopResponse<WorkshopWarranty>> {
    const res = await apiClient.patch(`${BASE}/${id}/status`, { status })
    return res.data
  },
}

export default warrantyService
