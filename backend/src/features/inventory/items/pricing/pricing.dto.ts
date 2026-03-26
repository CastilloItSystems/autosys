// backend/src/features/inventory/items/pricing/pricing.dto.ts

import {
  ICreatePricingInput,
  IUpdatePricingInput,
  IPricingWithItem,
  IPricingTier,
  IPriceLevel,
  ICreatePricingTierInput,
  IUpdatePricingTierInput,
} from './pricing.interface.js'

export class PriceLevelResponseDTO {
  id: string
  pricingId: string
  level: number
  priceForeign: number
  price: number
  finalPrice: number
  utility: number
  commission: number

  constructor(data: IPriceLevel) {
    this.id = data.id
    this.pricingId = data.pricingId
    this.level = data.level
    this.priceForeign = Number(data.priceForeign)
    this.price = Number(data.price)
    this.finalPrice = Number(data.finalPrice)
    this.utility = Number(data.utility)
    this.commission = Number(data.commission)
  }
}

export class CreatePricingDTO {
  itemId: string
  costPrice: number
  salePrice: number
  wholesalePrice?: number | null
  minMargin: number
  maxMargin: number
  discountPercentage?: number | null
  costForeign?: number
  exchangeRate?: number
  taxRateSale?: number
  taxRatePurchase?: number
  priceLevels?: { level: number; priceForeign: number }[]
  notes?: string | null

  constructor(data: ICreatePricingInput) {
    this.itemId = data.itemId
    this.costPrice = data.costPrice
    this.salePrice = data.salePrice
    this.minMargin = data.minMargin ?? 0
    this.maxMargin = data.maxMargin ?? 0

    if (data.wholesalePrice !== null && data.wholesalePrice !== undefined)
      this.wholesalePrice = data.wholesalePrice
    if (data.discountPercentage !== undefined)
      this.discountPercentage = data.discountPercentage
    if (data.costForeign !== undefined) this.costForeign = data.costForeign
    if (data.exchangeRate !== undefined) this.exchangeRate = data.exchangeRate
    if (data.taxRateSale !== undefined) this.taxRateSale = data.taxRateSale
    if (data.taxRatePurchase !== undefined) this.taxRatePurchase = data.taxRatePurchase
    if (data.priceLevels !== undefined) this.priceLevels = data.priceLevels
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
  costForeign?: number
  exchangeRate?: number
  taxRateSale?: number
  taxRatePurchase?: number
  priceLevels?: { level: number; priceForeign: number }[]
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
    if (data.costForeign !== undefined) this.costForeign = data.costForeign
    if (data.exchangeRate !== undefined) this.exchangeRate = data.exchangeRate
    if (data.taxRateSale !== undefined) this.taxRateSale = data.taxRateSale
    if (data.taxRatePurchase !== undefined) this.taxRatePurchase = data.taxRatePurchase
    if (data.priceLevels !== undefined) this.priceLevels = data.priceLevels
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
  costForeign: number
  exchangeRate: number
  costRef: number
  costPrevious: number
  taxRateSale: number
  taxRatePurchase: number
  notes?: string | null
  isActive: boolean
  priceLevels?: PriceLevelResponseDTO[]
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
    this.minMargin = Number(data.minMargin)
    this.maxMargin = Number(data.maxMargin)
    this.costForeign = Number(data.costForeign ?? 0)
    this.exchangeRate = Number(data.exchangeRate ?? 1)
    this.costRef = Number(data.costRef ?? 0)
    this.costPrevious = Number(data.costPrevious ?? 0)
    this.taxRateSale = Number(data.taxRateSale ?? 0)
    this.taxRatePurchase = Number(data.taxRatePurchase ?? 0)
    this.isActive = data.isActive
    if (data.item) {
      this.item = data.item
    }
    if (data.priceLevels) {
      this.priceLevels = data.priceLevels.map((pl) => new PriceLevelResponseDTO(pl))
    }
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt

    if (data.wholesalePrice !== undefined && data.wholesalePrice !== null)
      this.wholesalePrice = Number(data.wholesalePrice)
    if (data.discountPercentage !== undefined)
      this.discountPercentage = Number(data.discountPercentage)
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
      this.discountPercentage = Number(data.discountPercentage)
  }
}
