// libs/interfaces/workshop/workshopOperation.interface.ts

export type OperationDifficulty = 'BASIC' | 'STANDARD' | 'ADVANCED' | 'SPECIALIST'

export interface SuggestedMaterial {
  id: string
  itemId: string | null
  item: { id: string; name: string; code: string; sku: string } | null
  description: string
  quantity: number
  isRequired: boolean
  notes: string | null
}

export interface SuggestedMaterialInput {
  itemId?: string | null
  description: string
  quantity?: number
  isRequired?: boolean
  notes?: string | null
}

export interface WorkshopOperation {
  id: string
  code: string
  name: string
  description: string | null
  serviceTypeId: string | null
  serviceType: { id: string; name: string; code: string } | null

  difficulty: OperationDifficulty
  requiredSpecialtyId: string | null
  requiredSpecialty: { id: string; name: string; code: string } | null

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
  createdAt: string
  updatedAt: string
  suggestedMaterials: SuggestedMaterial[]
}

export interface WorkshopOperationFilters {
  search?: string
  serviceTypeId?: string
  difficulty?: OperationDifficulty
  requiredSpecialtyId?: string
  isActive?: 'true' | 'false'
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateWorkshopOperationInput {
  code: string
  name: string
  description?: string
  serviceTypeId?: string | null
  difficulty?: OperationDifficulty
  requiredSpecialtyId?: string | null
  standardMinutes?: number | null
  minMinutes?: number | null
  maxMinutes?: number | null
  listPrice: number
  costPrice?: number
  warrantyDays?: number | null
  warrantyKm?: number | null
  requiredEquipment?: string | null
  procedure?: string | null
  isExternalService?: boolean
  tags?: string[]
  suggestedMaterials?: SuggestedMaterialInput[]
}

export interface UpdateWorkshopOperationInput {
  code?: string
  name?: string
  description?: string | null
  serviceTypeId?: string | null
  difficulty?: OperationDifficulty
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
  suggestedMaterials?: SuggestedMaterialInput[]
}
