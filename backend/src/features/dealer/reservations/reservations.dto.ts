import { IDealerReservation } from './reservations.interface.js'

export class CreateDealerReservationDTO {
  dealerUnitId: string
  customerName: string
  customerDocument?: string
  customerPhone?: string
  customerEmail?: string
  offeredPrice?: number | null
  depositAmount?: number | null
  currency?: string
  expiresAt?: Date | null
  notes?: string
  sourceChannel?: string
  status?: string

  constructor(data: Record<string, unknown>) {
    this.dealerUnitId = String(data.dealerUnitId).trim()
    this.customerName = String(data.customerName).trim()
    if (data.customerDocument != null && String(data.customerDocument).trim() !== '')
      this.customerDocument = String(data.customerDocument).trim()
    if (data.customerPhone != null && String(data.customerPhone).trim() !== '')
      this.customerPhone = String(data.customerPhone).trim()
    if (data.customerEmail != null && String(data.customerEmail).trim() !== '')
      this.customerEmail = String(data.customerEmail).trim()
    if (data.offeredPrice !== undefined) this.offeredPrice = data.offeredPrice !== null ? Number(data.offeredPrice) : null
    if (data.depositAmount !== undefined)
      this.depositAmount = data.depositAmount !== null ? Number(data.depositAmount) : null
    if (data.currency != null && String(data.currency).trim() !== '') this.currency = String(data.currency).trim()
    if (data.expiresAt !== undefined) this.expiresAt = data.expiresAt ? new Date(data.expiresAt as string) : null
    if (data.notes != null && String(data.notes).trim() !== '') this.notes = String(data.notes).trim()
    if (data.sourceChannel != null && String(data.sourceChannel).trim() !== '')
      this.sourceChannel = String(data.sourceChannel).trim()
    if (data.status != null && String(data.status).trim() !== '') this.status = String(data.status).trim()
  }
}

export class UpdateDealerReservationDTO {
  customerName?: string
  customerDocument?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  offeredPrice?: number | null
  depositAmount?: number | null
  currency?: string | null
  expiresAt?: Date | null
  notes?: string | null
  sourceChannel?: string | null
  status?: string
  isActive?: boolean

  constructor(data: Record<string, unknown>) {
    if (data.customerName !== undefined) this.customerName = String(data.customerName).trim()
    if (data.customerDocument !== undefined) this.customerDocument = data.customerDocument ? String(data.customerDocument).trim() : null
    if (data.customerPhone !== undefined) this.customerPhone = data.customerPhone ? String(data.customerPhone).trim() : null
    if (data.customerEmail !== undefined) this.customerEmail = data.customerEmail ? String(data.customerEmail).trim() : null
    if (data.offeredPrice !== undefined) this.offeredPrice = data.offeredPrice !== null ? Number(data.offeredPrice) : null
    if (data.depositAmount !== undefined)
      this.depositAmount = data.depositAmount !== null ? Number(data.depositAmount) : null
    if (data.currency !== undefined) this.currency = data.currency ? String(data.currency).trim() : null
    if (data.expiresAt !== undefined) this.expiresAt = data.expiresAt ? new Date(data.expiresAt as string) : null
    if (data.notes !== undefined) this.notes = data.notes ? String(data.notes).trim() : null
    if (data.sourceChannel !== undefined) this.sourceChannel = data.sourceChannel ? String(data.sourceChannel).trim() : null
    if (data.status !== undefined) this.status = String(data.status).trim()
    if (data.isActive !== undefined) this.isActive = Boolean(data.isActive)
  }
}

export class DealerReservationResponseDTO {
  id: string
  empresaId: string
  dealerUnitId: string
  reservationNumber: string
  status: string
  customerName: string
  customerDocument?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  offeredPrice?: any | null
  depositAmount?: any | null
  currency?: string | null
  reservedAt: Date
  expiresAt?: Date | null
  confirmedAt?: Date | null
  cancelledAt?: Date | null
  convertedAt?: Date | null
  notes?: string | null
  sourceChannel?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  dealerUnit: IDealerReservation['dealerUnit']

  constructor(data: IDealerReservation) {
    this.id = data.id
    this.empresaId = data.empresaId
    this.dealerUnitId = data.dealerUnitId
    this.reservationNumber = data.reservationNumber
    this.status = data.status
    this.customerName = data.customerName
    this.reservedAt = data.reservedAt
    this.isActive = data.isActive
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.dealerUnit = data.dealerUnit
    if (data.customerDocument != null) this.customerDocument = data.customerDocument
    if (data.customerPhone != null) this.customerPhone = data.customerPhone
    if (data.customerEmail != null) this.customerEmail = data.customerEmail
    if (data.offeredPrice != null) this.offeredPrice = data.offeredPrice
    if (data.depositAmount != null) this.depositAmount = data.depositAmount
    if (data.currency != null) this.currency = data.currency
    if (data.expiresAt != null) this.expiresAt = data.expiresAt
    if (data.confirmedAt != null) this.confirmedAt = data.confirmedAt
    if (data.cancelledAt != null) this.cancelledAt = data.cancelledAt
    if (data.convertedAt != null) this.convertedAt = data.convertedAt
    if (data.notes != null) this.notes = data.notes
    if (data.sourceChannel != null) this.sourceChannel = data.sourceChannel
  }
}
