// app/api/workshop/dashboardService.ts
import apiClient from '../apiClient'
import type { WorkshopResponse } from '@/libs/interfaces/workshop'
import type { WorkshopDashboardData, WorkshopDashboardSummary } from '@/libs/interfaces/workshop'

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
