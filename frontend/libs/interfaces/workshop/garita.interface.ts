// libs/interfaces/workshop/garita.interface.ts
import type { WorkshopPagedResponse, WorkshopResponse } from './shared.interface'

export type GaritaEventType =
  | 'VEHICLE_IN'
  | 'VEHICLE_OUT'
  | 'PART_OUT'
  | 'PART_IN'
  | 'ROAD_TEST_OUT'
  | 'ROAD_TEST_IN'
  | 'OTHER'

export type GaritaEventStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'COMPLETED'
  | 'FLAGGED'
  | 'CANCELLED'

export interface GaritaEvent {
  id: string
  type: GaritaEventType
  status: GaritaEventStatus
  serviceOrderId?: string | null
  serviceOrder?: { id: string; folio: string; status: string; vehiclePlate?: string | null; vehicleDesc?: string | null } | null
  totId?: string | null
  tot?: { id: string; totNumber: string; status: string; partDescription: string } | null
  plateNumber?: string | null
  vehicleDesc?: string | null
  serialMotor?: string | null
  serialBody?: string | null
  kmIn?: number | null
  kmOut?: number | null
  driverName?: string | null
  driverId?: string | null
  exitPassRef?: string | null
  authorizedById?: string | null
  authorizedAt?: string | null
  photoUrls?: string[] | null
  hasIrregularity: boolean
  irregularityNotes?: string | null
  eventAt: string
  completedAt?: string | null
  notes?: string | null
  empresaId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface GaritaFilters {
  type?: GaritaEventType
  status?: GaritaEventStatus
  serviceOrderId?: string
  totId?: string
  plateNumber?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface CreateGaritaEventInput {
  type: GaritaEventType
  serviceOrderId?: string | null
  totId?: string | null
  plateNumber?: string | null
  vehicleDesc?: string | null
  serialMotor?: string | null
  serialBody?: string | null
  kmIn?: number | null
  driverName?: string | null
  driverId?: string | null
  exitPassRef?: string | null
  photoUrls?: string[] | null
  notes?: string | null
  eventAt?: string | null
}

export interface UpdateGaritaStatusInput {
  status: GaritaEventStatus
  kmOut?: number | null
  exitPassRef?: string | null
  irregularityNotes?: string | null
  notes?: string | null
}

export type GaritaPagedResponse = WorkshopPagedResponse<GaritaEvent>
export type GaritaResponse = WorkshopResponse<GaritaEvent>
