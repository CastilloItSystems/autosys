// backend/src/features/inventory/reservations/reservations.dto.ts

import {
  IReservation,
  IReservationAlert,
  ReservationStatus,
} from './reservations.interface'

export class CreateReservationDTO {
  itemId: string
  warehouseId: string
  quantity: number
  workOrderId?: string | undefined
  saleOrderId?: string | undefined
  reference?: string | undefined
  notes?: string | undefined
  expiresAt?: Date | undefined
  createdBy?: string | undefined

  constructor(data: any) {
    this.itemId = data.itemId
    this.warehouseId = data.warehouseId
    this.quantity = Number(data.quantity)
    this.workOrderId = data.workOrderId
    this.saleOrderId = data.saleOrderId
    this.reference = data.reference
    this.notes = data.notes
    this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : undefined
    this.createdBy = data.createdBy
  }
}

export class UpdateReservationDTO {
  quantity?: number | undefined
  status?: ReservationStatus | undefined
  workOrderId?: string | null | undefined
  saleOrderId?: string | null | undefined
  reference?: string | null | undefined
  notes?: string | null | undefined
  expiresAt?: Date | null | undefined

  constructor(data: any) {
    if (data.quantity !== undefined) this.quantity = Number(data.quantity)
    if (data.status !== undefined) this.status = data.status
    if (data.workOrderId !== undefined)
      this.workOrderId = data.workOrderId ?? null
    if (data.saleOrderId !== undefined)
      this.saleOrderId = data.saleOrderId ?? null
    if (data.reference !== undefined) this.reference = data.reference ?? null
    if (data.notes !== undefined) this.notes = data.notes ?? null
    if (data.expiresAt !== undefined)
      this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null
  }
}

export class ReservationResponseDTO {
  id: string
  reservationNumber: string
  itemId: string
  warehouseId: string
  quantity: number
  status: ReservationStatus
  workOrderId?: string | null
  saleOrderId?: string | null
  exitNoteId?: string | null
  reference?: string | null
  notes?: string | null
  reservedAt: Date
  expiresAt?: Date | null
  deliveredAt?: Date | null
  releasedAt?: Date | null
  createdBy?: string | null
  deliveredBy?: string | null
  createdAt: Date
  updatedAt: Date
  item?: any
  exitNote?: any

  constructor(
    reservation: IReservation,
    options: {
      includeRelations?: boolean
    } = {}
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

    if (options.includeRelations && reservation) {
      const relations = reservation as any
      if (relations.item) this.item = relations.item
      if (relations.exitNote) this.exitNote = relations.exitNote
    }
  }
}

export class ConsumeReservationDTO {
  reservationId: string
  quantity?: number | undefined
  deliveredBy?: string | undefined

  constructor(data: any) {
    this.reservationId = data.reservationId
    this.quantity = data.quantity ? Number(data.quantity) : undefined
    this.deliveredBy = data.deliveredBy
  }
}

export class ReleaseReservationDTO {
  reservationId: string
  reason?: string | undefined

  constructor(data: any) {
    this.reservationId = data.reservationId
    this.reason = data.reason
  }
}

export class ReservationAlertResponseDTO {
  id: string
  reservationId: string
  type: 'EXPIRED' | 'EXPIRING_SOON' | 'PENDING_DELIVERY'
  message: string
  isRead: boolean
  createdAt: Date

  constructor(alert: IReservationAlert) {
    this.id = alert.id
    this.reservationId = alert.reservationId
    this.type = alert.type
    this.message = alert.message
    this.isRead = alert.isRead
    this.createdAt = alert.createdAt
  }
}
