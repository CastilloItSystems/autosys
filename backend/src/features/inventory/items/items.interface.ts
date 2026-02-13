// backend/src/features/inventory/items/items.interface.ts

export interface IItem {
  id: string
  sku: string
  barcode?: string | null
  name: string
  description?: string | null

  // Relaciones
  brandId: string
  categoryId: string
  modelId?: string | null
  unitId: string

  // Ubicación
  location?: string | null

  // Precios
  costPrice: number
  salePrice: number
  wholesalePrice?: number | null

  // Control de inventario
  minStock: number
  maxStock?: number | null
  reorderPoint: number

  // Configuración
  isActive: boolean
  isSerialized: boolean
  hasBatch: boolean
  hasExpiry: boolean
  allowNegativeStock: boolean

  // Información adicional
  technicalSpecs?: any
  tags?: string[]

  // Auditoría
  historial?: any
  createdAt: Date
  updatedAt: Date
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
  _count?: {
    stocks: number
    movements: number
    images: number
  }
}

export interface IItemImage {
  id: string
  itemId: string
  url: string
  isPrimary: boolean
  order: number
  createdAt: Date
}

export interface ICreateItemInput {
  sku: string
  barcode?: string
  name: string
  description?: string
  brandId: string
  categoryId: string
  modelId?: string
  unitId: string
  location?: string
  costPrice: number
  salePrice: number
  wholesalePrice?: number
  minStock?: number
  maxStock?: number
  reorderPoint?: number
  isActive?: boolean
  isSerialized?: boolean
  hasBatch?: boolean
  hasExpiry?: boolean
  allowNegativeStock?: boolean
  technicalSpecs?: any
  tags?: string[]
}

export interface IUpdateItemInput {
  sku?: string
  barcode?: string
  name?: string
  description?: string
  brandId?: string
  categoryId?: string
  modelId?: string
  unitId?: string
  location?: string
  costPrice?: number
  salePrice?: number
  wholesalePrice?: number
  minStock?: number
  maxStock?: number
  reorderPoint?: number
  isActive?: boolean
  isSerialized?: boolean
  hasBatch?: boolean
  hasExpiry?: boolean
  allowNegativeStock?: boolean
  technicalSpecs?: any
  tags?: string[]
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
