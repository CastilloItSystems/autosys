export interface ICampaign {
  id: string
  empresaId: string
  name: string
  description?: string | null
  status: string
  channel: string
  budget?: any | null
  startsAt?: Date | null
  endsAt?: Date | null
  sentCount: number
  responseCount: number
  leadsCreatedCount: number
  opportunitiesCount: number
  opportunitiesWonCount: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ICampaignFilters {
  status?: string
  channel?: string
  search?: string
}
