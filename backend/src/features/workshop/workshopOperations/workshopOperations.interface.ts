// backend/src/features/workshop/workshopOperations/workshopOperations.interface.ts

export interface IWorkshopOperation {
  id: string
  code: string
  name: string
  description?: string | null
  serviceTypeId?: string | null
  serviceType?: { id: string; code: string; name: string } | null

  difficulty: string
  requiredSpecialtyId?: string | null
  requiredSpecialty?: { id: string; code: string; name: string } | null

  standardMinutes?: number | null
  minMinutes?: number | null
  maxMinutes?: number | null

  listPrice: number
  costPrice: number

  warrantyDays?: number | null
  warrantyKm?: number | null

  requiredEquipment?: string | null
  procedure?: string | null
  isExternalService: boolean
  tags: string[]

  isActive: boolean
  empresaId: string
  createdBy?: string | null
  createdAt: Date
  updatedAt: Date

  suggestedMaterials?: ISuggestedMaterial[]
}

export interface ISuggestedMaterial {
  id: string
  operationId: string
  itemId?: string | null
  item?: { id: string; name: string; code: string; sku: string } | null
  description: string
  quantity: number
  isRequired: boolean
  notes?: string | null
}

export interface ISuggestedMaterialInput {
  itemId?: string | null
  description: string
  quantity?: number
  isRequired?: boolean
  notes?: string | null
}

export interface ICreateWorkshopOperationInput {
  code: string
  name: string
  description?: string
  serviceTypeId?: string
  difficulty?: string
  requiredSpecialtyId?: string
  standardMinutes?: number
  minMinutes?: number
  maxMinutes?: number
  listPrice?: number
  costPrice?: number
  warrantyDays?: number
  warrantyKm?: number
  requiredEquipment?: string
  procedure?: string
  isExternalService?: boolean
  tags?: string[]
  suggestedMaterials?: ISuggestedMaterialInput[]
}

export interface IUpdateWorkshopOperationInput {
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
  suggestedMaterials?: ISuggestedMaterialInput[]
}

export interface IWorkshopOperationFilters {
  search?: string
  serviceTypeId?: string
  difficulty?: string
  requiredSpecialtyId?: string
  isActive?: boolean
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
