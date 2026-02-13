// backend/src/features/inventory/items/pricing/pricing.dto.ts

import {
  ICreatePricingInput,
  IUpdatePricingInput,
  IPricingWithItem,
  IPricingTier,
  ICreatePricingTierInput,
  IUpdatePricingTierInput,
} from './pricing.interface'

export class CreatePricingDTO {
  itemId: string
  costPrice: number
  salePrice: number
  wholesalePrice?: number | null
  minMargin: number
  maxMargin: number
  discountPercentage?: number | null
  notes?: string | null

  constructor(data: ICreatePricingInput) {
    this.itemId = data.itemId
    this.costPrice = data.costPrice
    this.salePrice = data.salePrice
    this.minMargin = data.minMargin
    this.maxMargin = data.maxMargin

    if (data.wholesalePrice !== null && data.wholesalePrice !== undefined)
      this.wholesalePrice = data.wholesalePrice
    if (data.discountPercentage !== undefined)
      this.discountPercentage = data.discountPercentage
    if (data.notes !== undefined) this.notes = data.notes
  }
}

export class UpdatePricingDTO {
  costPrice?: number
  salePrice?: number
  wholesalePrice?: number | null
  minMargin?: number
  maxMargin?: number
  discountPercentage?: number | null
  notes?: string | null
  isActive?: boolean

  constructor(data: IUpdatePricingInput) {
    if (data.costPrice !== undefined) this.costPrice = data.costPrice
    if (data.salePrice !== undefined) this.salePrice = data.salePrice
    if (data.wholesalePrice !== undefined)
      this.wholesalePrice = data.wholesalePrice
    if (data.minMargin !== undefined) this.minMargin = data.minMargin
    if (data.maxMargin !== undefined) this.maxMargin = data.maxMargin
    if (data.discountPercentage !== undefined)
      this.discountPercentage = data.discountPercentage
    if (data.notes !== undefined) this.notes = data.notes
    if (data.isActive !== undefined) this.isActive = data.isActive
  }
}

export class PricingResponseDTO {
  id: string
  itemId: string
  costPrice: number
  salePrice: number
  wholesalePrice?: number | null
  minMargin: number
  maxMargin: number
  discountPercentage?: number | null
  notes?: string | null
  isActive: boolean
  item?: {
    id: string
    sku: string
    name: string
  }
  createdAt: Date
  updatedAt: Date

  constructor(data: IPricingWithItem) {
    this.id = data.id
    this.itemId = data.itemId
    this.costPrice = Number(data.costPrice)
    this.salePrice = Number(data.salePrice)
    this.minMargin = data.minMargin
    this.maxMargin = data.maxMargin
    this.isActive = data.isActive
    if (data.item) {
      this.item = data.item
    }
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt

    if (data.wholesalePrice !== undefined && data.wholesalePrice !== null)
      this.wholesalePrice = Number(data.wholesalePrice)
    if (data.discountPercentage !== undefined)
      this.discountPercentage = data.discountPercentage
    if (data.notes !== undefined) this.notes = data.notes
  }
}

export class CreatePricingTierDTO {
  pricingId: string
  minQuantity: number
  maxQuantity?: number | null
  tierPrice: number
  discountPercentage?: number | null

  constructor(data: ICreatePricingTierInput) {
    this.pricingId = data.pricingId
    this.minQuantity = data.minQuantity
    this.tierPrice = data.tierPrice

    if (data.maxQuantity !== undefined) this.maxQuantity = data.maxQuantity
    if (data.discountPercentage !== undefined)
      this.discountPercentage = data.discountPercentage
  }
}

export class UpdatePricingTierDTO {
  minQuantity?: number
  maxQuantity?: number | null
  tierPrice?: number
  discountPercentage?: number | null

  constructor(data: IUpdatePricingTierInput) {
    if (data.minQuantity !== undefined) this.minQuantity = data.minQuantity
    if (data.maxQuantity !== undefined) this.maxQuantity = data.maxQuantity
    if (data.tierPrice !== undefined) this.tierPrice = data.tierPrice
    if (data.discountPercentage !== undefined)
      this.discountPercentage = data.discountPercentage
  }
}

export class PricingTierResponseDTO {
  id: string
  pricingId: string
  minQuantity: number
  maxQuantity?: number | null
  tierPrice: number
  discountPercentage?: number | null
  createdAt: Date
  updatedAt: Date

  constructor(data: IPricingTier) {
    this.id = data.id
    this.pricingId = data.pricingId
    this.minQuantity = data.minQuantity
    this.tierPrice = Number(data.tierPrice)
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt

    if (data.maxQuantity !== undefined && data.maxQuantity !== null)
      this.maxQuantity = data.maxQuantity
    if (data.discountPercentage !== undefined)
      this.discountPercentage = data.discountPercentage
  }
}
