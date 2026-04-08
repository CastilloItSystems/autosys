// backend/src/features/workshop/appointments/appointments.interface.ts

export type AppointmentStatus =
  | 'SCHEDULED' | 'CONFIRMED' | 'ARRIVED' | 'COMPLETED'
  | 'NO_SHOW' | 'CANCELLED' | 'RESCHEDULED' | 'WAITING'

export type AppointmentOrigin =
  | 'PHONE' | 'SOCIAL_MEDIA' | 'PRESENTIAL' | 'WEB' | 'CRM'

export interface IAppointment {
  id: string
  folio: string
  customerId: string
  customerVehicleId?: string | null
  vehiclePlate?: string | null
  vehicleDesc?: string | null
  serviceTypeId?: string | null
  scheduledDate: Date
  estimatedMinutes?: number | null
  assignedAdvisorId?: string | null
  origin: AppointmentOrigin
  preDiagnosis?: string | null
  preIdentifiedParts?: any | null
  estimatedCost?: number | null
  status: AppointmentStatus
  clientNotes?: string | null
  internalNotes?: string | null
  empresaId: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ICreateAppointmentInput {
  customerId: string
  customerVehicleId?: string
  vehiclePlate?: string
  vehicleDesc?: string
  serviceTypeId?: string
  scheduledDate: Date
  estimatedMinutes?: number
  assignedAdvisorId?: string
  origin?: AppointmentOrigin
  preDiagnosis?: string
  preIdentifiedParts?: any
  estimatedCost?: number
  clientNotes?: string
  internalNotes?: string
}

export interface IUpdateAppointmentInput {
  customerVehicleId?: string | null
  vehiclePlate?: string
  vehicleDesc?: string
  serviceTypeId?: string | null
  scheduledDate?: Date
  estimatedMinutes?: number | null
  assignedAdvisorId?: string | null
  origin?: AppointmentOrigin
  preDiagnosis?: string | null
  preIdentifiedParts?: any | null
  estimatedCost?: number | null
  clientNotes?: string
  internalNotes?: string
}

export interface IAppointmentFilters {
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
