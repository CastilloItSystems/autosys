import apiClient from '../apiClient'
import { ApiResponse } from '../inventory/types'
import { LoyaltyEvent, CustomerSurvey } from '@/libs/interfaces/crm/loyalty.interface'

interface LoyaltyFilters {
  page?: number
  limit?: number
  customerId?: string
  status?: string
  type?: string
}

interface LoyaltyOverview {
  events: LoyaltyEvent[]
  surveys: CustomerSurvey[]
  metrics: {
    npsAverage: number | null
    pendingEvents: number
  }
  suggestedTasks: { id: string; label: string; dueAt?: string | null; customerId: string }[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const loyaltyService = {
  async getAll(params?: LoyaltyFilters): Promise<ApiResponse<LoyaltyOverview>> {
    const res = await apiClient.get('/crm/loyalty', { params })
    return res.data
  },

  async create(data: Record<string, unknown>): Promise<ApiResponse<{ kind: 'event' | 'survey'; data: unknown }>> {
    const res = await apiClient.post('/crm/loyalty', data)
    return res.data
  },
}

export default loyaltyService
