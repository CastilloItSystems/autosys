// app/api/workshop/appointmentService.ts
import apiClient from '../apiClient'
import type {
  ServiceAppointment,
  AppointmentFilters,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  AppointmentStatus,
  WorkshopPagedResponse,
  WorkshopResponse,
} from '@/libs/interfaces/workshop'

const BASE = '/workshop/appointments'

const appointmentService = {
  async getAll(filters?: AppointmentFilters): Promise<WorkshopPagedResponse<ServiceAppointment>> {
    const res = await apiClient.get(BASE, { params: filters })
    return res.data
  },

  async getById(id: string): Promise<WorkshopResponse<ServiceAppointment>> {
    const res = await apiClient.get(`${BASE}/${id}`)
    return res.data
  },

  async create(data: CreateAppointmentInput): Promise<WorkshopResponse<ServiceAppointment>> {
    const res = await apiClient.post(BASE, data)
    return res.data
  },

  async update(id: string, data: UpdateAppointmentInput): Promise<WorkshopResponse<ServiceAppointment>> {
    const res = await apiClient.put(`${BASE}/${id}`, data)
    return res.data
  },

  async updateStatus(id: string, status: AppointmentStatus): Promise<WorkshopResponse<ServiceAppointment>> {
    const res = await apiClient.patch(`${BASE}/${id}/status`, { status })
    return res.data
  },

  async delete(id: string): Promise<WorkshopResponse<null>> {
    const res = await apiClient.delete(`${BASE}/${id}`)
    return res.data
  },
}

export default appointmentService
