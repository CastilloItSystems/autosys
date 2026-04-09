// app/api/workshop/additionalService.ts
import apiClient from '../apiClient'
import type {
  ServiceOrderAdditional,
  ServiceOrderAdditionalItem,
  AdditionalFilters,
  CreateAdditionalInput,
  UpdateAdditionalInput,
  CreateAdditionalItemInput,
  WorkshopPagedResponse,
  WorkshopResponse,
} from '@/libs/interfaces/workshop'

const BASE = '/workshop/additionals'

const additionalService = {
  async getAll(filters?: AdditionalFilters): Promise<WorkshopPagedResponse<ServiceOrderAdditional>> {
    const res = await apiClient.get(BASE, { params: filters })
    return res.data
  },

  async getById(id: string): Promise<WorkshopResponse<ServiceOrderAdditional>> {
    const res = await apiClient.get(`${BASE}/${id}`)
    return res.data
  },

  async create(data: CreateAdditionalInput): Promise<WorkshopResponse<ServiceOrderAdditional>> {
    const res = await apiClient.post(BASE, data)
    return res.data
  },

  async update(id: string, data: UpdateAdditionalInput): Promise<WorkshopResponse<ServiceOrderAdditional>> {
    const res = await apiClient.put(`${BASE}/${id}`, data)
    return res.data
  },

  async delete(id: string): Promise<WorkshopResponse<null>> {
    const res = await apiClient.delete(`${BASE}/${id}`)
    return res.data
  },

  async updateStatus(id: string, status: string): Promise<WorkshopResponse<ServiceOrderAdditional>> {
    const res = await apiClient.patch(`${BASE}/${id}/status`, { status })
    return res.data
  },

  async getItems(id: string): Promise<WorkshopResponse<ServiceOrderAdditionalItem[]>> {
    const res = await apiClient.get(`${BASE}/${id}/items`)
    return res.data
  },

  async createItem(id: string, data: CreateAdditionalItemInput): Promise<WorkshopResponse<ServiceOrderAdditionalItem>> {
    const res = await apiClient.post(`${BASE}/${id}/items`, data)
    return res.data
  },

  async updateItem(id: string, itemId: string, data: Partial<CreateAdditionalItemInput>): Promise<WorkshopResponse<ServiceOrderAdditionalItem>> {
    const res = await apiClient.put(`${BASE}/${id}/items/${itemId}`, data)
    return res.data
  },

  async deleteItem(id: string, itemId: string): Promise<WorkshopResponse<null>> {
    const res = await apiClient.delete(`${BASE}/${id}/items/${itemId}`)
    return res.data
  },
}

export default additionalService
