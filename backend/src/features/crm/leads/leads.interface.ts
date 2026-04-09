// backend/src/features/crm/leads/leads.interface.ts

export enum LeadSource {
  WALK_IN = 'WALK_IN',
  REFERRAL = 'REFERRAL',
  PHONE = 'PHONE',
  WHATSAPP = 'WHATSAPP',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  WEBSITE = 'WEBSITE',
  EMAIL = 'EMAIL',
  OTHER = 'OTHER',
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  WON = 'WON',
  LOST = 'LOST',
}

export enum LeadChannel {
  REPUESTOS = 'REPUESTOS',
  TALLER = 'TALLER',
  VEHICULOS = 'VEHICULOS',
}

export interface ILead {
  id: string
  empresaId: string
  customerId?: string | null
  channel: LeadChannel
  source: LeadSource
  status: LeadStatus
  title: string
  description?: string | null
  estimatedValue?: any | null
  currency: string
  assignedTo?: string | null
  expectedCloseAt?: Date | null
  closedAt?: Date | null
  lostReason?: string | null
  orderId?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ILeadFilters {
  channel?: string
  status?: string
  assignedTo?: string
  customerId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}
