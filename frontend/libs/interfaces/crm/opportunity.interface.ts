export enum OpportunityStatus {
  OPEN = 'OPEN',
  WON = 'WON',
  LOST = 'LOST',
}

export interface Opportunity {
  id: string
  empresaId: string
  leadId?: string | null
  customerId?: string | null
  campaignId?: string | null
  channel: 'REPUESTOS' | 'TALLER' | 'VEHICULOS' | string
  stageCode: string
  status: OpportunityStatus | string
  title: string
  description?: string | null
  amount?: number | null
  currency: string
  ownerId: string
  nextActivityAt: string
  expectedCloseAt?: string | null
  wonAt?: string | null
  lostAt?: string | null
  lostReasonId?: string | null
  lostReasonText?: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export const OPPORTUNITY_STATUS_CONFIG = {
  OPEN: { label: 'Abierta', severity: 'info' as const },
  WON: { label: 'Ganada', severity: 'success' as const },
  LOST: { label: 'Perdida', severity: 'danger' as const },
}

export const OPPORTUNITY_CHANNEL_CONFIG = {
  REPUESTOS: { label: 'Repuestos', severity: 'info' as const },
  TALLER: { label: 'Taller', severity: 'warning' as const },
  VEHICULOS: { label: 'Vehículos', severity: 'success' as const },
}
