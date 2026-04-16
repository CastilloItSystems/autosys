import apiClient from '../apiClient'
import { ApiResponse, PaginatedResponse } from '../inventory/types'
import { Opportunity } from '@/libs/interfaces/crm/opportunity.interface'

interface OpportunityParams {
  page?: number
  limit?: number
  channel?: string
  stageCode?: string
  status?: string
  ownerId?: string
  customerId?: string
  campaignId?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

const opportunityService = {
  async getAll(params?: OpportunityParams): Promise<PaginatedResponse<Opportunity>> {
    const res = await apiClient.get('/crm/opportunities', { params })
    return res.data
  },

  async getById(id: string): Promise<ApiResponse<Opportunity>> {
    const res = await apiClient.get(`/crm/opportunities/${id}`)
    return res.data
  },

  async create(data: Partial<Opportunity>): Promise<ApiResponse<Opportunity>> {
    const res = await apiClient.post('/crm/opportunities', data)
    return res.data
  },

  async update(id: string, data: Partial<Opportunity>): Promise<ApiResponse<Opportunity>> {
    const res = await apiClient.put(`/crm/opportunities/${id}`, data)
    return res.data
  },

  async updateStage(id: string, stageCode: string, notes?: string): Promise<ApiResponse<Opportunity>> {
    const res = await apiClient.patch(`/crm/opportunities/${id}/stage`, { stageCode, notes })
    return res.data
  },

  async close(
    id: string,
    payload: { result: 'WON' | 'LOST'; lostReasonId?: string; lostReasonText?: string; notes?: string }
  ): Promise<ApiResponse<Opportunity>> {
    const res = await apiClient.post(`/crm/opportunities/${id}/close`, payload)
    return res.data
  },
}

export default opportunityService
