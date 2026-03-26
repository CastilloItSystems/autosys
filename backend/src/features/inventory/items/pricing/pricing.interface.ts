// backend/src/features/inventory/items/pricing/pricing.interface.ts

import { Decimal } from '@prisma/client/runtime/client'

export interface IPriceLevel {
  id: string
  pricingId: string
  level: number
  priceForeign: number | Decimal
  price: number | Decimal
  finalPrice: number | Decimal
  utility: number | Decimal
  commission: number | Decimal
}

export interface IPricing {
  id: string
  itemId: string
  costPrice: number | any
  salePrice: number | any
  wholesalePrice?: number | any | null
  minMargin: Decimal
  maxMargin: Decimal
  discountPercentage?: number | Decimal | null
  costForeign: number | Decimal
  exchangeRate: number | Decimal
  costRef: number | Decimal
  costPrevious: number | Decimal
  taxRateSale: number | Decimal
  taxRatePurchase: number | Decimal
  notes?: string | null
  isActive: boolean
  priceLevels?: IPriceLevel[]
  createdAt: Date
  updatedAt: Date
}

export interface IPricingWithItem extends Omit<IPricing, 'item'> {
  item?: {
    id: string
    sku: string
    name: string
  }
}

export interface IPricingTier {
  id: string
  pricingId: string
  minQuantity: number
  maxQuantity?: number | null
  tierPrice: number | Decimal
  discountPercentage?: number | Decimal | null
  createdAt: Date
  updatedAt: Date
}

export interface ICreatePricingInput {
  itemId: string
  costPrice: number
  salePrice: number
  wholesalePrice?: number | null
  minMargin?: number
  maxMargin?: number
  discountPercentage?: number
  costForeign?: number
  exchangeRate?: number
  taxRateSale?: number
  taxRatePurchase?: number
  priceLevels?: { level: number; priceForeign: number }[]
  notes?: string
}

export interface IUpdatePricingInput {
  costPrice?: number
  salePrice?: number
  wholesalePrice?: number | null
  minMargin?: number
  maxMargin?: number
  discountPercentage?: number
  costForeign?: number
  exchangeRate?: number
  taxRateSale?: number
  taxRatePurchase?: number
  priceLevels?: { level: number; priceForeign: number }[]
  notes?: string
  isActive?: boolean
}

export interface ICreatePricingTierInput {
  pricingId: string
  minQuantity: number
  maxQuantity?: number | null
  tierPrice: number
  discountPercentage?: number
}

export interface IUpdatePricingTierInput {
  minQuantity?: number
  maxQuantity?: number | null
  tierPrice?: number
  discountPercentage?: number
}

export interface IPricingFilters {
  itemId?: string
  isActive?: boolean
}

export interface IPricingTierFilters {
  pricingId?: string
}

export interface IPricingCalculation {
  costPrice: number
  salePrice: number
  profit: number
  profitPercentage: number
  margin: number
  withinMarginLimits: boolean
}
