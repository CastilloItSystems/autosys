// backend/src/features/workshop/workshopGarita/workshopGarita.dto.ts
import type { IGaritaEvent, GaritaEventType, GaritaEventStatus, ICreateGaritaEvent, IUpdateGaritaEvent } from './workshopGarita.interface.js'

export class CreateGaritaEventDTO implements ICreateGaritaEvent {
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

  constructor(data: any) {
    this.type = data.type as GaritaEventType
    this.serviceOrderId = data.serviceOrderId || undefined
    this.totId = data.totId || undefined
    this.plateNumber = data.plateNumber ? String(data.plateNumber).trim().toUpperCase() : undefined
    this.vehicleDesc = data.vehicleDesc ? String(data.vehicleDesc).trim() : undefined
    this.serialMotor = data.serialMotor ? String(data.serialMotor).trim() : undefined
    this.serialBody = data.serialBody ? String(data.serialBody).trim() : undefined
    this.kmIn = data.kmIn !== undefined && data.kmIn !== null ? Number(data.kmIn) : undefined
    this.driverName = data.driverName ? String(data.driverName).trim() : undefined
    this.driverId = data.driverId ? String(data.driverId).trim() : undefined
    this.exitPassRef = data.exitPassRef ? String(data.exitPassRef).trim() : undefined
    this.photoUrls = Array.isArray(data.photoUrls) ? data.photoUrls : undefined
    this.notes = data.notes ? String(data.notes).trim() : undefined
    this.eventAt = data.eventAt ? new Date(data.eventAt) : undefined
  }
}

export class UpdateGaritaEventDTO implements IUpdateGaritaEvent {
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

  constructor(data: any) {
    if ('plateNumber' in data) this.plateNumber = data.plateNumber ? String(data.plateNumber).trim().toUpperCase() : null
    if ('vehicleDesc' in data) this.vehicleDesc = data.vehicleDesc ? String(data.vehicleDesc).trim() : null
    if ('serialMotor' in data) this.serialMotor = data.serialMotor ? String(data.serialMotor).trim() : null
    if ('serialBody' in data) this.serialBody = data.serialBody ? String(data.serialBody).trim() : null
    if ('kmIn' in data) this.kmIn = data.kmIn !== null ? Number(data.kmIn) : null
    if ('kmOut' in data) this.kmOut = data.kmOut !== null ? Number(data.kmOut) : null
    if ('driverName' in data) this.driverName = data.driverName ? String(data.driverName).trim() : null
    if ('driverId' in data) this.driverId = data.driverId ? String(data.driverId).trim() : null
    if ('exitPassRef' in data) this.exitPassRef = data.exitPassRef ? String(data.exitPassRef).trim() : null
    if ('authorizedById' in data) this.authorizedById = data.authorizedById || null
    if ('authorizedAt' in data) this.authorizedAt = data.authorizedAt ? new Date(data.authorizedAt) : null
    if ('photoUrls' in data) this.photoUrls = Array.isArray(data.photoUrls) ? data.photoUrls : null
    if (data.hasIrregularity !== undefined) this.hasIrregularity = Boolean(data.hasIrregularity)
    if ('irregularityNotes' in data) this.irregularityNotes = data.irregularityNotes ? String(data.irregularityNotes).trim() : null
    if ('completedAt' in data) this.completedAt = data.completedAt ? new Date(data.completedAt) : null
    if ('notes' in data) this.notes = data.notes ? String(data.notes).trim() : null
  }
}

export class GaritaEventResponseDTO {
  id: string
  type: GaritaEventType
  status: GaritaEventStatus
  serviceOrderId: string | null
  serviceOrder: any | null
  totId: string | null
  tot: any | null
  plateNumber: string | null
  vehicleDesc: string | null
  serialMotor: string | null
  serialBody: string | null
  kmIn: number | null
  kmOut: number | null
  driverName: string | null
  driverId: string | null
  exitPassRef: string | null
  authorizedById: string | null
  authorizedAt: Date | null
  photoUrls: string[] | null
  hasIrregularity: boolean
  irregularityNotes: string | null
  eventAt: Date
  completedAt: Date | null
  notes: string | null
  empresaId: string
  createdBy: string
  createdAt: Date
  updatedAt: Date

  constructor(data: any) {
    this.id = data.id
    this.type = data.type
    this.status = data.status
    this.serviceOrderId = data.serviceOrderId ?? null
    this.serviceOrder = data.serviceOrder ?? null
    this.totId = data.totId ?? null
    this.tot = data.tot ?? null
    this.plateNumber = data.plateNumber ?? null
    this.vehicleDesc = data.vehicleDesc ?? null
    this.serialMotor = data.serialMotor ?? null
    this.serialBody = data.serialBody ?? null
    this.kmIn = data.kmIn ?? null
    this.kmOut = data.kmOut ?? null
    this.driverName = data.driverName ?? null
    this.driverId = data.driverId ?? null
    this.exitPassRef = data.exitPassRef ?? null
    this.authorizedById = data.authorizedById ?? null
    this.authorizedAt = data.authorizedAt ?? null
    this.photoUrls = data.photoUrls ?? null
    this.hasIrregularity = data.hasIrregularity ?? false
    this.irregularityNotes = data.irregularityNotes ?? null
    this.eventAt = data.eventAt
    this.completedAt = data.completedAt ?? null
    this.notes = data.notes ?? null
    this.empresaId = data.empresaId
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
