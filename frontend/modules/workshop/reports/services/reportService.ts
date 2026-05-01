// app/api/workshop/reportService.ts
import apiClient from '@/app/api/apiClient'
import type { WorkshopReportsAll, WorkshopReportFilters } from '../interfaces/report.interface'
import type { WorkshopResponse } from '@/modules/workshop/shared/interfaces/shared.interface'

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
