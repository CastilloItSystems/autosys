// app/api/workshop/reportService.ts
import apiClient from '../apiClient'
import type { WorkshopResponse } from '@/libs/interfaces/workshop'
import type { WorkshopReportsAll, WorkshopReportFilters } from '@/libs/interfaces/workshop'

const BASE = '/workshop/reports'

const reportService = {
  async getAll(filters?: WorkshopReportFilters): Promise<WorkshopResponse<WorkshopReportsAll>> {
    const res = await apiClient.get(BASE, { params: filters })
    return res.data
  },

  async getServiceOrders(filters?: WorkshopReportFilters): Promise<WorkshopResponse<any>> {
    const res = await apiClient.get(`${BASE}/service-orders`, { params: filters })
    return res.data
  },

  async getProductivity(filters?: WorkshopReportFilters): Promise<WorkshopResponse<any>> {
    const res = await apiClient.get(`${BASE}/productivity`, { params: filters })
    return res.data
  },

  async getEfficiency(filters?: WorkshopReportFilters): Promise<WorkshopResponse<any>> {
    const res = await apiClient.get(`${BASE}/efficiency`, { params: filters })
    return res.data
  },

  async getMaterials(filters?: WorkshopReportFilters): Promise<WorkshopResponse<any>> {
    const res = await apiClient.get(`${BASE}/materials`, { params: filters })
    return res.data
  },

  async getWarranty(filters?: WorkshopReportFilters): Promise<WorkshopResponse<any>> {
    const res = await apiClient.get(`${BASE}/warranty`, { params: filters })
    return res.data
  },

  async getFinancial(filters?: WorkshopReportFilters): Promise<WorkshopResponse<any>> {
    const res = await apiClient.get(`${BASE}/financial`, { params: filters })
    return res.data
  },
}

export default reportService
