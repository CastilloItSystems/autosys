// backend/src/features/workshop/appointments/appointments.dto.ts
import type { AppointmentStatus } from './appointments.interface.js'

export class CreateAppointmentDTO {
  customerId: string
  customerVehicleId?: string
  vehiclePlate?: string
  vehicleDesc?: string
  serviceTypeId?: string
  scheduledDate: Date
  estimatedMinutes?: number
  assignedAdvisorId?: string
  clientNotes?: string
  internalNotes?: string

  constructor(data: any) {
    this.customerId = data.customerId
    this.customerVehicleId = data.customerVehicleId ?? undefined
    this.vehiclePlate = data.vehiclePlate?.trim() ?? undefined
    this.vehicleDesc = data.vehicleDesc?.trim() ?? undefined
    this.serviceTypeId = data.serviceTypeId ?? undefined
    this.scheduledDate = new Date(data.scheduledDate)
    this.estimatedMinutes = data.estimatedMinutes != null ? Number(data.estimatedMinutes) : undefined
    this.assignedAdvisorId = data.assignedAdvisorId ?? undefined
    this.clientNotes = data.clientNotes?.trim() ?? undefined
    this.internalNotes = data.internalNotes?.trim() ?? undefined
  }
}

export class UpdateAppointmentDTO {
  customerVehicleId?: string | null
  vehiclePlate?: string
  vehicleDesc?: string
  serviceTypeId?: string | null
  scheduledDate?: Date
  estimatedMinutes?: number | null
  assignedAdvisorId?: string | null
  clientNotes?: string
  internalNotes?: string

  constructor(data: any) {
    if ('customerVehicleId' in data) this.customerVehicleId = data.customerVehicleId ?? null
    if (data.vehiclePlate !== undefined) this.vehiclePlate = data.vehiclePlate.trim()
    if (data.vehicleDesc !== undefined) this.vehicleDesc = data.vehicleDesc.trim()
    if ('serviceTypeId' in data) this.serviceTypeId = data.serviceTypeId ?? null
    if (data.scheduledDate !== undefined) this.scheduledDate = new Date(data.scheduledDate)
    if ('estimatedMinutes' in data) this.estimatedMinutes = data.estimatedMinutes != null ? Number(data.estimatedMinutes) : null
    if ('assignedAdvisorId' in data) this.assignedAdvisorId = data.assignedAdvisorId ?? null
    if (data.clientNotes !== undefined) this.clientNotes = data.clientNotes.trim()
    if (data.internalNotes !== undefined) this.internalNotes = data.internalNotes.trim()
  }
}

export class UpdateAppointmentStatusDTO {
  status: AppointmentStatus

  constructor(data: any) {
    this.status = data.status
  }
}

export class AppointmentResponseDTO {
  id: string
  folio: string
  customerId: string
  customer: any | null
  customerVehicleId: string | null
  customerVehicle: any | null
  vehiclePlate: string | null
  vehicleDesc: string | null
  serviceTypeId: string | null
  serviceType: any | null
  scheduledDate: Date
  estimatedMinutes: number | null
  assignedAdvisorId: string | null
  status: AppointmentStatus
  clientNotes: string | null
  internalNotes: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date

  constructor(data: any) {
    this.id = data.id
    this.folio = data.folio
    this.customerId = data.customerId
    this.customer = data.customer ?? null
    this.customerVehicleId = data.customerVehicleId ?? null
    this.customerVehicle = data.customerVehicle ?? null
    this.vehiclePlate = data.vehiclePlate ?? null
    this.vehicleDesc = data.vehicleDesc ?? null
    this.serviceTypeId = data.serviceTypeId ?? null
    this.serviceType = data.serviceType ?? null
    this.scheduledDate = data.scheduledDate
    this.estimatedMinutes = data.estimatedMinutes ?? null
    this.assignedAdvisorId = data.assignedAdvisorId ?? null
    this.status = data.status
    this.clientNotes = data.clientNotes ?? null
    this.internalNotes = data.internalNotes ?? null
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
