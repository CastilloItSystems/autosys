// backend/src/features/inventory/items/items.interface.ts
export interface IItem {
  id: string
  sku: string
  barcode?: string | null
  name: string
  description?: string | null

  brandId: string
  categoryId: string
  modelId?: string | null
  unitId: string

  location?: string | null

  costPrice: number
  salePrice: number
  wholesalePrice?: number | null

  minStock: number
  maxStock?: number | null
  reorderPoint: number

  isActive: boolean
  isSerialized: boolean
  hasBatch: boolean
  hasExpiry: boolean
  allowNegativeStock: boolean

  technicalSpecs?: unknown
  tags?: string[]

  historial?: unknown
  createdAt: Date
  updatedAt: Date
}

export interface IItemImage {
  id: string
  itemId: string
  url: string
  isPrimary: boolean
  order: number
  createdAt: Date
}

export interface IItemWithRelations extends IItem {
  brand?: {
    id: string
    code: string
    name: string
  }
  category?: {
    id: string
    code: string
    name: string
  }
  model?: {
    id: string
    name: string
    year?: number | null
  } | null
  unit?: {
    id: string
    code: string
    name: string
    abbreviation: string
  }
  images?: IItemImage[]
  stocks?: Array<{
    warehouseId: string
    quantityReal: number
    quantityReserved: number
    quantityAvailable: number
    warehouse?: {
      id: string
      code?: string
      name: string
    }
  }>
  _count?: {
    stocks: number
    movements: number
    images: number
    reservations?: number
  }
}

export interface ICreateItemInput {
  sku: string
  barcode?: string | undefined
  name: string
  description?: string | undefined
  brandId: string
  categoryId: string
  modelId?: string | undefined
  unitId: string
  location?: string | undefined
  costPrice: number
  salePrice: number
  wholesalePrice?: number | undefined
  minStock?: number | undefined
  maxStock?: number | undefined
  reorderPoint?: number | undefined
  isActive?: boolean | undefined
  isSerialized?: boolean | undefined
  hasBatch?: boolean | undefined
  hasExpiry?: boolean | undefined
  allowNegativeStock?: boolean | undefined
  technicalSpecs?: unknown
  tags?: string[] | undefined
}

export interface IUpdateItemInput {
  sku?: string | undefined
  barcode?: string | undefined
  name?: string | undefined
  description?: string | undefined
  brandId?: string | undefined
  categoryId?: string | undefined
  modelId?: string | undefined
  unitId?: string | undefined
  location?: string | undefined
  costPrice?: number | undefined
  salePrice?: number | undefined
  wholesalePrice?: number | undefined
  minStock?: number | undefined
  maxStock?: number | undefined
  reorderPoint?: number | undefined
  isActive?: boolean | undefined
  isSerialized?: boolean | undefined
  hasBatch?: boolean | undefined
  hasExpiry?: boolean | undefined
  allowNegativeStock?: boolean | undefined
  technicalSpecs?: unknown
  tags?: string[] | undefined
}

export interface IItemFilters {
  search?: string
  brandId?: string
  categoryId?: string
  modelId?: string
  isActive?: boolean
  tags?: string[]
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  lowStock?: boolean
}

export interface IItemWithStock extends IItemWithRelations {
  totalStock?: number
  availableStock?: number
  reservedStock?: number
  stockByWarehouse?: {
    warehouseId: string
    warehouseName: string
    quantityReal: number
    quantityReserved: number
    quantityAvailable: number
  }[]
}
