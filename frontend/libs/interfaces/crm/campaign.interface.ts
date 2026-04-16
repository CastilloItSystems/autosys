export interface Campaign {
  id: string
  empresaId: string
  name: string
  description?: string | null
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | string
  channel: 'EMAIL' | 'WHATSAPP' | 'PHONE' | 'SOCIAL_MEDIA' | 'WEB' | 'OTHER' | string
  budget?: number | null
  startsAt?: string | null
  endsAt?: string | null
  sentCount: number
  responseCount: number
  leadsCreatedCount: number
  opportunitiesCount: number
  opportunitiesWonCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export const CAMPAIGN_STATUS_OPTIONS = [
  { label: 'Borrador', value: 'DRAFT' },
  { label: 'Activa', value: 'ACTIVE' },
  { label: 'Pausada', value: 'PAUSED' },
  { label: 'Completada', value: 'COMPLETED' },
  { label: 'Cancelada', value: 'CANCELLED' },
]

export const CAMPAIGN_CHANNEL_OPTIONS = [
  { label: 'Email', value: 'EMAIL' },
  { label: 'WhatsApp', value: 'WHATSAPP' },
  { label: 'Teléfono', value: 'PHONE' },
  { label: 'Redes Sociales', value: 'SOCIAL_MEDIA' },
  { label: 'Web', value: 'WEB' },
  { label: 'Otro', value: 'OTHER' },
]
