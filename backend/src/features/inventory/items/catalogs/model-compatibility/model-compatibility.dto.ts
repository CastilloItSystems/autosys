// backend/src/features/inventory/items/catalogs/model-compatibility/model-compatibility.dto.ts

import {
  ICreateCompatibilityInput,
  IUpdateCompatibilityInput,
  IModelCompatibilityWithRelations,
} from './model-compatibility.interface.js'

export class CreateCompatibilityDTO implements ICreateCompatibilityInput {
  partModelId: string
  vehicleModelId: string
  notes?: string
  isVerified?: boolean

  constructor(data: ICreateCompatibilityInput) {
    this.partModelId = data.partModelId
    this.vehicleModelId = data.vehicleModelId
    if (data.notes !== undefined) this.notes = data.notes
    this.isVerified = data.isVerified ?? false
  }
}

export class UpdateCompatibilityDTO implements IUpdateCompatibilityInput {
  notes?: string | null
  isVerified?: boolean

  constructor(data: IUpdateCompatibilityInput) {
    if (data.notes !== undefined) this.notes = data.notes
    if (data.isVerified !== undefined) this.isVerified = data.isVerified
  }
}

export class CompatibilityResponseDTO {
  id: string
  partModelId: string
  vehicleModelId: string
  notes: string | null
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
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

  constructor(data: IModelCompatibilityWithRelations) {
    this.id = data.id
    this.partModelId = data.partModelId
    this.vehicleModelId = data.vehicleModelId
    this.notes = data.notes ?? null
    this.isVerified = data.isVerified
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    if (data.partModel !== undefined) this.partModel = data.partModel
    if (data.vehicleModel !== undefined) this.vehicleModel = data.vehicleModel
  }
}
