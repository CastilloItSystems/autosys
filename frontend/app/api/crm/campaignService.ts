import apiClient from '../apiClient'
import { ApiResponse, PaginatedResponse } from '../inventory/types'
import { Campaign } from '@/libs/interfaces/crm/campaign.interface'

interface CampaignParams {
  page?: number
  limit?: number
  status?: string
  channel?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

const campaignService = {
  async getAll(params?: CampaignParams): Promise<PaginatedResponse<Campaign>> {
    const res = await apiClient.get('/crm/campaigns', { params })
    return res.data
  },

  async create(data: Partial<Campaign>): Promise<ApiResponse<Campaign>> {
    const res = await apiClient.post('/crm/campaigns', data)
    return res.data
  },
}

export default campaignService
