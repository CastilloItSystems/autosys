// backend/src/features/workshop/workshopOperations/workshopOperations.dto.ts
type AnyRecord = Record<string, any>
const asRecord = (value: unknown): AnyRecord =>
  value !== null && typeof value === 'object' ? (value as AnyRecord) : {}

export class CreateWorkshopOperationDTO {
  code: string
  name: string
  description?: string
  serviceTypeId?: string
  difficulty: string
  requiredSpecialtyId?: string
  standardMinutes?: number
  minMinutes?: number
  maxMinutes?: number
  listPrice: number
  costPrice: number
  warrantyDays?: number
  warrantyKm?: number
  requiredEquipment?: string
  procedure?: string
  isExternalService: boolean
  tags: string[]
  suggestedMaterials?: any[]

  constructor(raw: unknown) {
    const data = asRecord(raw)
    this.code = String(data.code ?? '')
      .toUpperCase()
      .trim()
    this.name = String(data.name ?? '').trim()
    this.description = data.description?.trim() ?? undefined
    this.serviceTypeId = data.serviceTypeId ?? undefined
    this.difficulty = data.difficulty ?? 'STANDARD'
    this.requiredSpecialtyId = data.requiredSpecialtyId ?? undefined
    this.standardMinutes =
      data.standardMinutes != null ? Number(data.standardMinutes) : undefined
    this.minMinutes =
      data.minMinutes != null ? Number(data.minMinutes) : undefined
    this.maxMinutes =
      data.maxMinutes != null ? Number(data.maxMinutes) : undefined
    this.listPrice = Number(data.listPrice ?? 0)
    this.costPrice = Number(data.costPrice ?? 0)
    this.warrantyDays =
      data.warrantyDays != null ? Number(data.warrantyDays) : undefined
    this.warrantyKm =
      data.warrantyKm != null ? Number(data.warrantyKm) : undefined
    this.requiredEquipment = data.requiredEquipment?.trim() ?? undefined
    this.procedure = data.procedure?.trim() ?? undefined
    this.isExternalService = Boolean(data.isExternalService ?? false)
    this.tags = Array.isArray(data.tags)
      ? data.tags.map((t: any) => String(t).trim())
      : []
    this.suggestedMaterials = Array.isArray(data.suggestedMaterials)
      ? data.suggestedMaterials
      : undefined
  }
}

export class UpdateWorkshopOperationDTO {
  code?: string
  name?: string
  description?: string | null
  serviceTypeId?: string | null
  difficulty?: string
  requiredSpecialtyId?: string | null
  standardMinutes?: number | null
  minMinutes?: number | null
  maxMinutes?: number | null
  listPrice?: number
  costPrice?: number
  warrantyDays?: number | null
  warrantyKm?: number | null
  requiredEquipment?: string | null
  procedure?: string | null
  isExternalService?: boolean
  tags?: string[]
  suggestedMaterials?: any[]

  constructor(raw: unknown) {
    const data = asRecord(raw)
    if (data.code !== undefined)
      this.code = String(data.code).toUpperCase().trim()
    if (data.name !== undefined) this.name = String(data.name).trim()
    if ('description' in data)
      this.description = data.description?.trim() ?? null
    if ('serviceTypeId' in data) this.serviceTypeId = data.serviceTypeId ?? null
    if (data.difficulty !== undefined) this.difficulty = data.difficulty
    if ('requiredSpecialtyId' in data)
      this.requiredSpecialtyId = data.requiredSpecialtyId ?? null
    if ('standardMinutes' in data)
      this.standardMinutes =
        data.standardMinutes != null ? Number(data.standardMinutes) : null
    if ('minMinutes' in data)
      this.minMinutes = data.minMinutes != null ? Number(data.minMinutes) : null
    if ('maxMinutes' in data)
      this.maxMinutes = data.maxMinutes != null ? Number(data.maxMinutes) : null
    if (data.listPrice !== undefined) this.listPrice = Number(data.listPrice)
    if (data.costPrice !== undefined) this.costPrice = Number(data.costPrice)
    if ('warrantyDays' in data)
      this.warrantyDays =
        data.warrantyDays != null ? Number(data.warrantyDays) : null
    if ('warrantyKm' in data)
      this.warrantyKm = data.warrantyKm != null ? Number(data.warrantyKm) : null
    if ('requiredEquipment' in data)
      this.requiredEquipment = data.requiredEquipment?.trim() ?? null
    if ('procedure' in data) this.procedure = data.procedure?.trim() ?? null
    if (data.isExternalService !== undefined)
      this.isExternalService = Boolean(data.isExternalService)
    if (Array.isArray(data.tags))
      this.tags = data.tags.map((t: any) => String(t).trim())
    if (Array.isArray(data.suggestedMaterials))
      this.suggestedMaterials = data.suggestedMaterials
  }
}

export class WorkshopOperationResponseDTO {
  id: string
  code: string
  name: string
  description: string | null
  serviceTypeId: string | null
  serviceType: any | null
  difficulty: string
  requiredSpecialtyId: string | null
  requiredSpecialty: any | null
  standardMinutes: number | null
  minMinutes: number | null
  maxMinutes: number | null
  listPrice: number
  costPrice: number
  warrantyDays: number | null
  warrantyKm: number | null
  requiredEquipment: string | null
  procedure: string | null
  isExternalService: boolean
  tags: string[]
  isActive: boolean
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
  suggestedMaterials: any[]

  constructor(data: any) {
    this.id = data.id
    this.code = data.code
    this.name = data.name
    this.description = data.description ?? null
    this.serviceTypeId = data.serviceTypeId ?? null
    this.serviceType = data.serviceType ?? null
    this.difficulty = data.difficulty ?? 'STANDARD'
    this.requiredSpecialtyId = data.requiredSpecialtyId ?? null
    this.requiredSpecialty = data.requiredSpecialty ?? null
    this.standardMinutes = data.standardMinutes ?? null
    this.minMinutes = data.minMinutes ?? null
    this.maxMinutes = data.maxMinutes ?? null
    this.listPrice = Number(data.listPrice ?? 0)
    this.costPrice = Number(data.costPrice ?? 0)
    this.warrantyDays = data.warrantyDays ?? null
    this.warrantyKm = data.warrantyKm ?? null
    this.requiredEquipment = data.requiredEquipment ?? null
    this.procedure = data.procedure ?? null
    this.isExternalService = data.isExternalService ?? false
    this.tags = data.tags ?? []
    this.isActive = data.isActive
    this.createdBy = data.createdBy ?? null
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.suggestedMaterials = (data.suggestedMaterials ?? []).map((m: any) => ({
      id: m.id,
      itemId: m.itemId ?? null,
      item: m.item
        ? {
            id: m.item.id,
            name: m.item.name,
            code: m.item.code,
            sku: m.item.sku,
          }
        : null,
      description: m.description,
      quantity: Number(m.quantity ?? 1),
      isRequired: m.isRequired ?? false,
      notes: m.notes ?? null,
    }))
  }
}
