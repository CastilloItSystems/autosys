// app/api/workshop/materialService.ts
import apiClient from '../apiClient'
import type {
  ServiceOrderMaterial,
  MaterialFilters,
  CreateMaterialInput,
  UpdateMaterialInput,
  WorkshopPagedResponse,
  WorkshopResponse,
} from '@/libs/interfaces/workshop'

const BASE = '/workshop/materials'

const materialService = {
  async getAll(filters?: MaterialFilters): Promise<WorkshopPagedResponse<ServiceOrderMaterial>> {
    const res = await apiClient.get(BASE, { params: filters })
    return res.data
  },

  async getById(id: string): Promise<WorkshopResponse<ServiceOrderMaterial>> {
    const res = await apiClient.get(`${BASE}/${id}`)
    return res.data
  },

  async create(data: CreateMaterialInput): Promise<WorkshopResponse<ServiceOrderMaterial>> {
    const res = await apiClient.post(BASE, data)
    return res.data
  },

  async update(id: string, data: UpdateMaterialInput): Promise<WorkshopResponse<ServiceOrderMaterial>> {
    const res = await apiClient.put(`${BASE}/${id}`, data)
    return res.data
  },

  async delete(id: string): Promise<WorkshopResponse<null>> {
    const res = await apiClient.delete(`${BASE}/${id}`)
    return res.data
  },

  async updateStatus(
    id: string,
    status: string,
    payload?: { warehouseId?: string; quantityReturned?: number }
  ): Promise<WorkshopResponse<ServiceOrderMaterial>> {
    const res = await apiClient.patch(`${BASE}/${id}/status`, {
      status,
      ...(payload?.warehouseId ? { warehouseId: payload.warehouseId } : {}),
      ...(payload?.quantityReturned !== undefined
        ? { quantityReturned: payload.quantityReturned }
        : {}),
    })
    return res.data
  },

  async updateApproval(
    id: string,
    clientApproved: boolean,
    notes?: string
  ): Promise<WorkshopResponse<ServiceOrderMaterial>> {
    const res = await apiClient.patch(`${BASE}/${id}/approval`, {
      clientApproved,
      notes,
    })
    return res.data
  },
}

export default materialService
