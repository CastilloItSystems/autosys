// backend/src/features/inventory/reservations/reservations.interface.ts

export enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  PENDING_PICKUP = 'PENDING_PICKUP',
  CONSUMED = 'CONSUMED',
  RELEASED = 'RELEASED',
}

export interface IReservation {
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
}

export interface IReservationWithRelations extends IReservation {
  item?: any
  exitNote?: any
  warehouse?: any
}

export interface ICreateReservationInput {
  itemId: string
  warehouseId: string
  quantity: number
  workOrderId?: string | undefined
  saleOrderId?: string | undefined
  exitNoteId?: string | undefined
  reference?: string | undefined
  notes?: string | undefined
  expiresAt?: Date | undefined
  createdBy?: string | undefined
}

export interface IUpdateReservationInput {
  quantity?: number | undefined
  status?: ReservationStatus | undefined
  workOrderId?: string | null | undefined
  saleOrderId?: string | null | undefined
  reference?: string | null | undefined
  notes?: string | null | undefined
  expiresAt?: Date | null | undefined
}

export interface IReservationFilters {
  status?: ReservationStatus
  itemId?: string
  warehouseId?: string
  workOrderId?: string
  saleOrderId?: string
  createdBy?: string
  reservedFrom?: Date
  reservedTo?: Date
}

