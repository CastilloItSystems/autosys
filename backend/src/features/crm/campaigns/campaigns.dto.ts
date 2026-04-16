import { ICampaign } from './campaigns.interface.js'

export class CreateCampaignDTO {
  name: string
  description?: string
  status?: string
  channel: string
  budget?: number
  startsAt?: string
  endsAt?: string

  constructor(data: Record<string, unknown>) {
    this.name = String(data.name).trim()
    this.channel = String(data.channel)

    if (data.description != null && String(data.description).trim() !== '') this.description = String(data.description).trim()
    if (data.status != null && String(data.status).trim() !== '') this.status = String(data.status).trim()
    if (data.budget !== undefined && data.budget !== null) this.budget = Number(data.budget)
    if (data.startsAt != null && String(data.startsAt).trim() !== '') this.startsAt = String(data.startsAt)
    if (data.endsAt != null && String(data.endsAt).trim() !== '') this.endsAt = String(data.endsAt)
  }
}

export class CampaignResponseDTO {
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

  constructor(data: ICampaign) {
    this.id = data.id
    this.empresaId = data.empresaId
    this.name = data.name
    this.status = data.status
    this.channel = data.channel
    this.sentCount = data.sentCount
    this.responseCount = data.responseCount
    this.leadsCreatedCount = data.leadsCreatedCount
    this.opportunitiesCount = data.opportunitiesCount
    this.opportunitiesWonCount = data.opportunitiesWonCount
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt

    if (data.description != null) this.description = data.description
    if (data.budget != null) this.budget = data.budget
    if (data.startsAt != null) this.startsAt = data.startsAt
    if (data.endsAt != null) this.endsAt = data.endsAt
  }
}
