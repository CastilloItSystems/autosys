// backend/src/features/workshop/workshopGarita/workshopGarita.interface.ts

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

export interface IGaritaEvent {
  id: string
  type: GaritaEventType
  status: GaritaEventStatus
  serviceOrderId?: string | null
  totId?: string | null
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
  authorizedAt?: Date | null
  photoUrls?: any | null
  hasIrregularity: boolean
  irregularityNotes?: string | null
  eventAt: Date
  completedAt?: Date | null
  notes?: string | null
  empresaId: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ICreateGaritaEvent {
  type: GaritaEventType
  serviceOrderId?: string
  totId?: string
  plateNumber?: string
  vehicleDesc?: string
  serialMotor?: string
  serialBody?: string
  kmIn?: number
  driverName?: string
  driverId?: string
  exitPassRef?: string
  photoUrls?: string[]
  notes?: string
  eventAt?: Date
}

export interface IUpdateGaritaEvent {
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
  authorizedAt?: Date | null
  photoUrls?: string[] | null
  hasIrregularity?: boolean
  irregularityNotes?: string | null
  completedAt?: Date | null
  notes?: string | null
}

export interface IGaritaFilters {
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
