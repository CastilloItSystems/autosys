// backend/src/features/workshop/receptions/receptions.dto.ts
import type { FuelLevel } from './receptions.interface.js'

export class CreateReceptionDTO {
  customerId: string
  customerVehicleId?: string
  vehiclePlate?: string
  vehicleDesc?: string
  mileageIn?: number
  fuelLevel?: FuelLevel
  accessories?: string[]
  hasPreExistingDamage: boolean
  damageNotes?: string
  clientDescription?: string
  authorizationName?: string
  authorizationPhone?: string
  estimatedDelivery?: Date
  advisorId?: string
  appointmentId?: string

  constructor(data: any) {
    this.customerId = data.customerId
    this.customerVehicleId = data.customerVehicleId ?? undefined
    this.vehiclePlate = data.vehiclePlate?.trim() ?? undefined
    this.vehicleDesc = data.vehicleDesc?.trim() ?? undefined
    this.mileageIn = data.mileageIn != null ? Number(data.mileageIn) : undefined
    this.fuelLevel = data.fuelLevel ?? undefined
    this.accessories = Array.isArray(data.accessories)
      ? data.accessories.map(String)
      : undefined
    this.hasPreExistingDamage = Boolean(data.hasPreExistingDamage ?? false)
    this.damageNotes = data.damageNotes?.trim() ?? undefined
    this.clientDescription = data.clientDescription?.trim() ?? undefined
    this.authorizationName = data.authorizationName?.trim() ?? undefined
    this.authorizationPhone = data.authorizationPhone?.trim() ?? undefined
    this.estimatedDelivery = data.estimatedDelivery
      ? new Date(data.estimatedDelivery)
      : undefined
    this.advisorId = data.advisorId ?? undefined
    this.appointmentId = data.appointmentId ?? undefined
  }
}

export class UpdateReceptionDTO {
  mileageIn?: number
  fuelLevel?: FuelLevel | null
  accessories?: string[]
  hasPreExistingDamage?: boolean
  damageNotes?: string | null
  clientDescription?: string
  authorizationName?: string
  authorizationPhone?: string
  estimatedDelivery?: Date | null
  advisorId?: string | null

  constructor(data: any) {
    if (data.mileageIn != null) this.mileageIn = Number(data.mileageIn)
    if ('fuelLevel' in data) this.fuelLevel = data.fuelLevel ?? null
    if (Array.isArray(data.accessories))
      this.accessories = data.accessories.map(String)
    if (data.hasPreExistingDamage !== undefined)
      this.hasPreExistingDamage = Boolean(data.hasPreExistingDamage)
    if ('damageNotes' in data)
      this.damageNotes = data.damageNotes?.trim() ?? null
    if (data.clientDescription !== undefined)
      this.clientDescription = data.clientDescription.trim()
    if (data.authorizationName !== undefined)
      this.authorizationName = data.authorizationName.trim()
    if (data.authorizationPhone !== undefined)
      this.authorizationPhone = data.authorizationPhone.trim()
    if ('estimatedDelivery' in data)
      this.estimatedDelivery = data.estimatedDelivery
        ? new Date(data.estimatedDelivery)
        : null
    if ('advisorId' in data) this.advisorId = data.advisorId ?? null
  }
}

export class ReceptionResponseDTO {
  id: string
  folio: string
  customerId: string
  customer: any | null
  customerVehicleId: string | null
  customerVehicle: any | null
  vehiclePlate: string | null
  vehicleDesc: string | null
  mileageIn: number | null
  fuelLevel: string | null
  accessories: any | null
  hasPreExistingDamage: boolean
  damageNotes: string | null
  clientDescription: string | null
  authorizationName: string | null
  authorizationPhone: string | null
  estimatedDelivery: Date | null
  advisorId: string | null
  appointmentId: string | null
  appointment: any | null
  serviceOrder: any | null
  clientSignature: string | null
  diagnosticAuthorized: boolean
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
    this.mileageIn = data.mileageIn ?? null
    this.fuelLevel = data.fuelLevel ?? null
    this.accessories = data.accessories ?? null
    this.hasPreExistingDamage = data.hasPreExistingDamage ?? false
    this.damageNotes = data.damageNotes ?? null
    this.clientDescription = data.clientDescription ?? null
    this.authorizationName = data.authorizationName ?? null
    this.authorizationPhone = data.authorizationPhone ?? null
    this.estimatedDelivery = data.estimatedDelivery ?? null
    this.advisorId = data.advisorId ?? null
    this.appointmentId = data.appointmentId ?? null
    this.appointment = data.appointment ?? null
    this.serviceOrder = data.serviceOrder
      ? {
          id: data.serviceOrder.id,
          folio: data.serviceOrder.folio,
          status: data.serviceOrder.status,
        }
      : null
    this.clientSignature = data.clientSignature ?? null
    this.diagnosticAuthorized = data.diagnosticAuthorized ?? false
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
