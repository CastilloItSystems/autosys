// backend/src/features/inventory/items/catalogs/model-compatibility/model-compatibility.interface.ts

export interface IModelCompatibility {
  id: string
  partModelId: string
  vehicleModelId: string
  notes?: string | null
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IModelCompatibilityWithRelations extends IModelCompatibility {
  partModel?: {
    id: string
    code: string | null
    name: string
    type: string
    brand?: {
      id: string
      code: string
      name: string
    }
  }
  vehicleModel?: {
    id: string
    code: string | null
    name: string
    type: string
    brand?: {
      id: string
      code: string
      name: string
    }
  }
}

export interface ICreateCompatibilityInput {
  partModelId: string
  vehicleModelId: string
  notes?: string
  isVerified?: boolean
}

export interface IUpdateCompatibilityInput {
  notes?: string | null
  isVerified?: boolean
}

export interface ICompatibilityFilters {
  partModelId?: string
  vehicleModelId?: string
  isVerified?: boolean
}
