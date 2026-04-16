// backend/src/features/inventory/reservations/reservations.dto.ts

import {
  IReservation,
  IReservationWithRelations,
  ReservationStatus,
} from './reservations.interface.js'

// ---------------------------------------------------------------------------
// Input DTOs
// ---------------------------------------------------------------------------

export class CreateReservationDTO {
  itemId: string
  warehouseId: string
  quantity: number
  workOrderId?: string
  saleOrderId?: string
  reference?: string
  notes?: string
  expiresAt?: Date
  createdBy?: string

  constructor(data: Record<string, unknown>) {
    this.itemId = String(data.itemId)
    this.warehouseId = String(data.warehouseId)
    this.quantity = Number(data.quantity)
    if (data.workOrderId) this.workOrderId = String(data.workOrderId)
    if (data.saleOrderId) this.saleOrderId = String(data.saleOrderId)
    if (data.reference) this.reference = String(data.reference)
    if (data.notes) this.notes = String(data.notes)
    if (data.expiresAt) this.expiresAt = new Date(data.expiresAt as string)
    if (data.createdBy) this.createdBy = String(data.createdBy)
  }
}

export class UpdateReservationDTO {
  quantity?: number
  workOrderId?: string | null
  saleOrderId?: string | null
  reference?: string | null
  notes?: string | null
  expiresAt?: Date | null

  constructor(data: Record<string, unknown>) {
    if (data.quantity !== undefined) this.quantity = Number(data.quantity)
    if (data.workOrderId !== undefined)
      this.workOrderId = data.workOrderId ? String(data.workOrderId) : null
    if (data.saleOrderId !== undefined)
      this.saleOrderId = data.saleOrderId ? String(data.saleOrderId) : null
    if (data.reference !== undefined)
      this.reference = data.reference ? String(data.reference) : null
    if (data.notes !== undefined)
      this.notes = data.notes ? String(data.notes) : null
    if (data.expiresAt !== undefined)
      this.expiresAt = data.expiresAt
        ? new Date(data.expiresAt as string)
        : null
  }
}

export class ConsumeReservationDTO {
  reservationId: string
  quantity?: number
  deliveredBy?: string

  constructor(data: Record<string, unknown>) {
    this.reservationId = String(data.reservationId)
    if (data.quantity) this.quantity = Number(data.quantity)
    if (data.deliveredBy) this.deliveredBy = String(data.deliveredBy)
  }
}

export class ReleaseReservationDTO {
  // reservationId comes from req.params — not needed in body DTO
  reason?: string

  constructor(data: Record<string, unknown>) {
    if (data.reason) this.reason = String(data.reason)
  }
}

// ---------------------------------------------------------------------------
// Response DTOs
// ---------------------------------------------------------------------------

export class ReservationResponseDTO {
  id: string
  reservationNumber: string
  itemId: string
  warehouseId: string
  quantity: number
  status: ReservationStatus
  workOrderId: string | null
  saleOrderId: string | null
  exitNoteId: string | null
  reference: string | null
  notes: string | null
  reservedAt: Date
  expiresAt: Date | null
  deliveredAt: Date | null
  releasedAt: Date | null
  createdBy: string | null
  deliveredBy: string | null
  createdAt: Date
  updatedAt: Date
  item?: unknown
  exitNote?: unknown
  warehouse?: unknown

  constructor(
    reservation: IReservation | IReservationWithRelations,
    options: { includeRelations?: boolean } = {}
  ) {
    this.id = reservation.id
    this.reservationNumber = reservation.reservationNumber
    this.itemId = reservation.itemId
    this.warehouseId = reservation.warehouseId
    this.quantity = reservation.quantity
    this.status = reservation.status
    this.workOrderId = reservation.workOrderId ?? null
    this.saleOrderId = reservation.saleOrderId ?? null
    this.exitNoteId = reservation.exitNoteId ?? null
    this.reference = reservation.reference ?? null
    this.notes = reservation.notes ?? null
    this.reservedAt = reservation.reservedAt
    this.expiresAt = reservation.expiresAt ?? null
    this.deliveredAt = reservation.deliveredAt ?? null
    this.releasedAt = reservation.releasedAt ?? null
    this.createdBy = reservation.createdBy ?? null
    this.deliveredBy = reservation.deliveredBy ?? null
    this.createdAt = reservation.createdAt
    this.updatedAt = reservation.updatedAt

    if (options.includeRelations) {
      const withRelations = reservation as IReservationWithRelations
      if (withRelations.item !== undefined) this.item = withRelations.item
      if (withRelations.exitNote !== undefined)
        this.exitNote = withRelations.exitNote
      if (withRelations.warehouse !== undefined)
        this.warehouse = withRelations.warehouse
    }
  }
}
