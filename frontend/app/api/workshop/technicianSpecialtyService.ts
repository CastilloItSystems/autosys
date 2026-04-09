// app/api/workshop/technicianSpecialtyService.ts
import apiClient from '../apiClient'
import type {
  TechnicianSpecialty,
  TechnicianSpecialtyFilters,
  CreateTechnicianSpecialtyInput,
  UpdateTechnicianSpecialtyInput,
  WorkshopPagedResponse,
  WorkshopResponse,
} from '@/libs/interfaces/workshop'

const BASE = '/workshop/technician-specialties'

const technicianSpecialtyService = {
  async getAll(filters?: TechnicianSpecialtyFilters): Promise<WorkshopPagedResponse<TechnicianSpecialty>> {
    const res = await apiClient.get(BASE, { params: filters })
    return res.data
  },

  async getById(id: string): Promise<WorkshopResponse<TechnicianSpecialty>> {
    const res = await apiClient.get(`${BASE}/${id}`)
    return res.data
  },

  async create(data: CreateTechnicianSpecialtyInput): Promise<WorkshopResponse<TechnicianSpecialty>> {
    const res = await apiClient.post(BASE, data)
    return res.data
  },

  async update(id: string, data: UpdateTechnicianSpecialtyInput): Promise<WorkshopResponse<TechnicianSpecialty>> {
    const res = await apiClient.put(`${BASE}/${id}`, data)
    return res.data
  },

  async delete(id: string): Promise<WorkshopResponse<null>> {
    const res = await apiClient.delete(`${BASE}/${id}`)
    return res.data
  },
}

export default technicianSpecialtyService
