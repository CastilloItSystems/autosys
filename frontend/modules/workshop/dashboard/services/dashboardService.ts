// app/api/workshop/dashboardService.ts
import apiClient from '@/app/api/apiClient'
import type { WorkshopDashboardData, WorkshopDashboardSummary } from '../interfaces/dashboard.interface'
import type { WorkshopResponse } from '@/modules/workshop/shared/interfaces/shared.interface'

const BASE = '/workshop/dashboard'

const dashboardService = {
  async getDashboard(): Promise<WorkshopResponse<WorkshopDashboardData>> {
    const res = await apiClient.get(BASE)
    return res.data
  },

  async getSummary(startDate: string, endDate: string): Promise<WorkshopResponse<WorkshopDashboardSummary>> {
    const res = await apiClient.get(`${BASE}/summary`, { params: { startDate, endDate } })
    return res.data
  },
}

export default dashboardService
