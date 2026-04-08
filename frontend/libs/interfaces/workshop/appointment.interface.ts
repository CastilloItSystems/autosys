// libs/interfaces/workshop/appointment.interface.ts
import type { CustomerRef, VehicleRef } from './shared.interface'

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELLED'
  | 'RESCHEDULED'
  | 'WAITING'

export type AppointmentOrigin =
  | 'PHONE'
  | 'SOCIAL_MEDIA'
  | 'PRESENTIAL'
  | 'WEB'
  | 'CRM'

export interface PreIdentifiedPart {
  description: string
  qty?: number
}

export interface ServiceAppointment {
  id: string
  folio: string
  customerId: string
  customer: CustomerRef | null
  customerVehicleId: string | null
  customerVehicle: VehicleRef | null
  vehiclePlate: string | null
  vehicleDesc: string | null
  serviceTypeId: string | null
  serviceType: { id: string; name: string; code: string } | null
  scheduledDate: string
  estimatedMinutes: number | null
  assignedAdvisorId: string | null
  origin: AppointmentOrigin
  preDiagnosis: string | null
  preIdentifiedParts: PreIdentifiedPart[] | null
  estimatedCost: number | null
  status: AppointmentStatus
  clientNotes: string | null
  internalNotes: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface AppointmentFilters {
  status?: AppointmentStatus
  customerId?: string
  assignedAdvisorId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateAppointmentInput {
  customerId: string
  customerVehicleId?: string
  vehiclePlate?: string
  vehicleDesc?: string
  serviceTypeId?: string
  scheduledDate: string
  estimatedMinutes?: number
  assignedAdvisorId?: string
  origin?: AppointmentOrigin
  preDiagnosis?: string
  preIdentifiedParts?: PreIdentifiedPart[]
  estimatedCost?: number
  clientNotes?: string
  internalNotes?: string
}

export interface UpdateAppointmentInput {
  customerVehicleId?: string | null
  vehiclePlate?: string
  vehicleDesc?: string
  serviceTypeId?: string | null
  scheduledDate?: string
  estimatedMinutes?: number | null
  assignedAdvisorId?: string | null
  origin?: AppointmentOrigin
  preDiagnosis?: string | null
  preIdentifiedParts?: PreIdentifiedPart[] | null
  estimatedCost?: number | null
  clientNotes?: string
  internalNotes?: string
}
