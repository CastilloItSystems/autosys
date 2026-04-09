// app/api/workshop/garitaService.ts
import apiClient from '../apiClient'
import type {
  GaritaEvent, GaritaFilters, CreateGaritaEventInput,
  UpdateGaritaStatusInput, GaritaPagedResponse, GaritaResponse,
} from '@/libs/interfaces/workshop'

const BASE = '/workshop/garita'

const garitaService = {
  async getAll(filters?: GaritaFilters): Promise<GaritaPagedResponse> {
    const res = await apiClient.get(BASE, { params: filters })
    return res.data
  },

  async getById(id: string): Promise<GaritaResponse> {
    const res = await apiClient.get(`${BASE}/${id}`)
    return res.data
  },

  async create(data: CreateGaritaEventInput): Promise<GaritaResponse> {
    const res = await apiClient.post(BASE, data)
    return res.data
  },

  async updateStatus(id: string, data: UpdateGaritaStatusInput): Promise<GaritaResponse> {
    const res = await apiClient.patch(`${BASE}/${id}/status`, data)
    return res.data
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`)
  },
}

export default garitaService
