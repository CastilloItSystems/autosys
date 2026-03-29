// backend/src/features/workshop/workshopOperations/workshopOperations.dto.ts

export class CreateWorkshopOperationDTO {
  code: string
  name: string
  description?: string
  serviceTypeId?: string
  standardMinutes?: number
  listPrice: number

  constructor(data: any) {
    this.code = String(data.code ?? '').toUpperCase().trim()
    this.name = String(data.name ?? '').trim()
    this.description = data.description?.trim() ?? undefined
    this.serviceTypeId = data.serviceTypeId ?? undefined
    this.standardMinutes = data.standardMinutes != null ? Number(data.standardMinutes) : undefined
    this.listPrice = Number(data.listPrice ?? 0)
  }
}

export class UpdateWorkshopOperationDTO {
  code?: string
  name?: string
  description?: string | null
  serviceTypeId?: string | null
  standardMinutes?: number | null
  listPrice?: number

  constructor(data: any) {
    if (data.code !== undefined) this.code = String(data.code).toUpperCase().trim()
    if (data.name !== undefined) this.name = String(data.name).trim()
    if ('description' in data) this.description = data.description?.trim() ?? null
    if ('serviceTypeId' in data) this.serviceTypeId = data.serviceTypeId ?? null
    if ('standardMinutes' in data) this.standardMinutes = data.standardMinutes != null ? Number(data.standardMinutes) : null
    if (data.listPrice !== undefined) this.listPrice = Number(data.listPrice)
  }
}

export class WorkshopOperationResponseDTO {
  id: string
  code: string
  name: string
  description: string | null
  serviceTypeId: string | null
  serviceType: any | null
  standardMinutes: number | null
  listPrice: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date

  constructor(data: any) {
    this.id = data.id
    this.code = data.code
    this.name = data.name
    this.description = data.description ?? null
    this.serviceTypeId = data.serviceTypeId ?? null
    this.serviceType = data.serviceType ?? null
    this.standardMinutes = data.standardMinutes ?? null
    this.listPrice = Number(data.listPrice ?? 0)
    this.isActive = data.isActive
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
