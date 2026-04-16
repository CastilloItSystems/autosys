import { DealerReservationStatus } from '../../../generated/prisma/client.js'

export interface IDealerReservationUnit {
  id: string
  code?: string | null
  vin?: string | null
  plate?: string | null
  status: string
  brand: {
    id: string
    code: string
    name: string
  }
  model?: {
    id: string
    name: string
    year?: number | null
  } | null
}

export interface IDealerReservation {
  id: string
  empresaId: string
  dealerUnitId: string
  reservationNumber: string
  status: DealerReservationStatus
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
  dealerUnit: IDealerReservationUnit
}

export interface IDealerReservationFilters {
  dealerUnitId?: string
  status?: string
  isActive?: boolean
  search?: string
  fromDate?: Date
  toDate?: Date
}
