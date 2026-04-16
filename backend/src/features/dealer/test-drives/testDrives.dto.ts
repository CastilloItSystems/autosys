import { IDealerTestDrive } from './testDrives.interface.js'

export class CreateDealerTestDriveDTO {
  dealerUnitId: string
  customerName: string
  customerDocument?: string
  customerPhone?: string
  customerEmail?: string
  driverLicense?: string
  scheduledAt: Date
  advisorName?: string
  routeDescription?: string
  observations?: string
  customerFeedback?: string
  status?: string

  constructor(data: Record<string, unknown>) {
    this.dealerUnitId = String(data.dealerUnitId).trim()
    this.customerName = String(data.customerName).trim()
    this.scheduledAt = new Date(String(data.scheduledAt))
    if (data.customerDocument != null && String(data.customerDocument).trim() !== '')
      this.customerDocument = String(data.customerDocument).trim()
    if (data.customerPhone != null && String(data.customerPhone).trim() !== '')
      this.customerPhone = String(data.customerPhone).trim()
    if (data.customerEmail != null && String(data.customerEmail).trim() !== '')
      this.customerEmail = String(data.customerEmail).trim()
    if (data.driverLicense != null && String(data.driverLicense).trim() !== '')
      this.driverLicense = String(data.driverLicense).trim()
    if (data.advisorName != null && String(data.advisorName).trim() !== '')
      this.advisorName = String(data.advisorName).trim()
    if (data.routeDescription != null && String(data.routeDescription).trim() !== '')
      this.routeDescription = String(data.routeDescription).trim()
    if (data.observations != null && String(data.observations).trim() !== '')
      this.observations = String(data.observations).trim()
    if (data.customerFeedback != null && String(data.customerFeedback).trim() !== '')
      this.customerFeedback = String(data.customerFeedback).trim()
    if (data.status != null && String(data.status).trim() !== '') this.status = String(data.status).trim()
  }
}

export class UpdateDealerTestDriveDTO {
  customerName?: string
  customerDocument?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  driverLicense?: string | null
  scheduledAt?: Date
  advisorName?: string | null
  routeDescription?: string | null
  observations?: string | null
  customerFeedback?: string | null
  status?: string
  isActive?: boolean

  constructor(data: Record<string, unknown>) {
    if (data.customerName !== undefined) this.customerName = String(data.customerName).trim()
    if (data.customerDocument !== undefined) this.customerDocument = data.customerDocument ? String(data.customerDocument).trim() : null
    if (data.customerPhone !== undefined) this.customerPhone = data.customerPhone ? String(data.customerPhone).trim() : null
    if (data.customerEmail !== undefined) this.customerEmail = data.customerEmail ? String(data.customerEmail).trim() : null
    if (data.driverLicense !== undefined) this.driverLicense = data.driverLicense ? String(data.driverLicense).trim() : null
    if (data.scheduledAt !== undefined) this.scheduledAt = new Date(String(data.scheduledAt))
    if (data.advisorName !== undefined) this.advisorName = data.advisorName ? String(data.advisorName).trim() : null
    if (data.routeDescription !== undefined)
      this.routeDescription = data.routeDescription ? String(data.routeDescription).trim() : null
    if (data.observations !== undefined) this.observations = data.observations ? String(data.observations).trim() : null
    if (data.customerFeedback !== undefined)
      this.customerFeedback = data.customerFeedback ? String(data.customerFeedback).trim() : null
    if (data.status !== undefined) this.status = String(data.status).trim()
    if (data.isActive !== undefined) this.isActive = Boolean(data.isActive)
  }
}

export class DealerTestDriveResponseDTO {
  id: string
  empresaId: string
  dealerUnitId: string
  testDriveNumber: string
  status: string
  customerName: string
  customerDocument?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  driverLicense?: string | null
  scheduledAt: Date
  startedAt?: Date | null
  completedAt?: Date | null
  cancelledAt?: Date | null
  advisorName?: string | null
  routeDescription?: string | null
  observations?: string | null
  customerFeedback?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  dealerUnit: IDealerTestDrive['dealerUnit']

  constructor(data: IDealerTestDrive) {
    this.id = data.id
    this.empresaId = data.empresaId
    this.dealerUnitId = data.dealerUnitId
    this.testDriveNumber = data.testDriveNumber
    this.status = data.status
    this.customerName = data.customerName
    this.scheduledAt = data.scheduledAt
    this.isActive = data.isActive
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.dealerUnit = data.dealerUnit
    if (data.customerDocument != null) this.customerDocument = data.customerDocument
    if (data.customerPhone != null) this.customerPhone = data.customerPhone
    if (data.customerEmail != null) this.customerEmail = data.customerEmail
    if (data.driverLicense != null) this.driverLicense = data.driverLicense
    if (data.startedAt != null) this.startedAt = data.startedAt
    if (data.completedAt != null) this.completedAt = data.completedAt
    if (data.cancelledAt != null) this.cancelledAt = data.cancelledAt
    if (data.advisorName != null) this.advisorName = data.advisorName
    if (data.routeDescription != null) this.routeDescription = data.routeDescription
    if (data.observations != null) this.observations = data.observations
    if (data.customerFeedback != null) this.customerFeedback = data.customerFeedback
  }
}
