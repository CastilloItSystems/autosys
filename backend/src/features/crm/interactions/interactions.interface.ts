// backend/src/features/crm/interactions/interactions.interface.ts

export enum InteractionType {
  CALL = 'CALL',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  VISIT = 'VISIT',
  NOTE = 'NOTE',
  QUOTE = 'QUOTE',
  FOLLOW_UP = 'FOLLOW_UP',
  MEETING = 'MEETING',
}

export enum InteractionChannel {
  REPUESTOS = 'REPUESTOS',
  TALLER = 'TALLER',
  VEHICULOS = 'VEHICULOS',
  GENERAL = 'GENERAL',
}

export enum InteractionDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export interface IInteraction {
  id: string
  empresaId: string
  customerId: string
  leadId?: string | null
  type: InteractionType
  channel: InteractionChannel
  direction: InteractionDirection
  subject?: string | null
  notes: string
  outcome?: string | null
  nextAction?: string | null
  nextActionAt?: Date | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface IInteractionFilters {
  customerId?: string
  leadId?: string
  type?: string
  channel?: string
  createdBy?: string
  dateFrom?: string
  dateTo?: string
}
