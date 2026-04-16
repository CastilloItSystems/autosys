export enum OpportunityStatus {
  OPEN = 'OPEN',
  WON = 'WON',
  LOST = 'LOST',
}

export interface IOpportunity {
  id: string
  empresaId: string
  leadId?: string | null
  customerId?: string | null
  campaignId?: string | null
  channel: string
  stageCode: string
  status: OpportunityStatus
  title: string
  description?: string | null
  amount?: any | null
  currency: string
  ownerId: string
  nextActivityAt: Date
  expectedCloseAt?: Date | null
  wonAt?: Date | null
  lostAt?: Date | null
  lostReasonId?: string | null
  lostReasonText?: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface IOpportunityFilters {
  channel?: string
  stageCode?: string
  status?: string
  ownerId?: string
  customerId?: string
  campaignId?: string
  search?: string
  amountMin?: number
  amountMax?: number
  expectedFrom?: string
  expectedTo?: string
}
