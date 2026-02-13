// backend/src/features/inventory/items/items.dto.ts

export class CreateItemDTO {
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

  constructor(data: any) {
    this.sku = data.sku?.toUpperCase()
    this.barcode = data.barcode
    this.name = data.name
    this.description = data.description
    this.brandId = data.brandId
    this.categoryId = data.categoryId
    this.modelId = data.modelId
    this.unitId = data.unitId
    this.location = data.location?.toUpperCase()
    this.costPrice = Number(data.costPrice)
    this.salePrice = Number(data.salePrice)
    if (data.wholesalePrice) {
      this.wholesalePrice = Number(data.wholesalePrice)
    }
    this.minStock = data.minStock ?? 5
    this.maxStock = data.maxStock ?? 100
    this.reorderPoint = data.reorderPoint ?? 10
    this.isActive = data.isActive ?? true
    this.isSerialized = data.isSerialized ?? false
    this.hasBatch = data.hasBatch ?? false
    this.hasExpiry = data.hasExpiry ?? false
    this.allowNegativeStock = data.allowNegativeStock ?? false
    this.technicalSpecs = data.technicalSpecs
    this.tags = data.tags?.map((tag: string) => tag.toLowerCase())
  }
}

export class UpdateItemDTO {
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

  constructor(data: any) {
    if (data.sku !== undefined) this.sku = data.sku.toUpperCase()
    if (data.barcode !== undefined) this.barcode = data.barcode
    if (data.name !== undefined) this.name = data.name
    if (data.description !== undefined) this.description = data.description
    if (data.brandId !== undefined) this.brandId = data.brandId
    if (data.categoryId !== undefined) this.categoryId = data.categoryId
    if (data.modelId !== undefined) this.modelId = data.modelId
    if (data.unitId !== undefined) this.unitId = data.unitId
    if (data.location !== undefined)
      this.location = data.location?.toUpperCase()
    if (data.costPrice !== undefined) this.costPrice = Number(data.costPrice)
    if (data.salePrice !== undefined) this.salePrice = Number(data.salePrice)
    if (data.wholesalePrice !== undefined)
      this.wholesalePrice = Number(data.wholesalePrice)
    if (data.minStock !== undefined) this.minStock = data.minStock
    if (data.maxStock !== undefined) this.maxStock = data.maxStock
    if (data.reorderPoint !== undefined) this.reorderPoint = data.reorderPoint
    if (data.isActive !== undefined) this.isActive = data.isActive
    if (data.isSerialized !== undefined) this.isSerialized = data.isSerialized
    if (data.hasBatch !== undefined) this.hasBatch = data.hasBatch
    if (data.hasExpiry !== undefined) this.hasExpiry = data.hasExpiry
    if (data.allowNegativeStock !== undefined)
      this.allowNegativeStock = data.allowNegativeStock
    if (data.technicalSpecs !== undefined)
      this.technicalSpecs = data.technicalSpecs
    if (data.tags !== undefined)
      this.tags = data.tags.map((tag: string) => tag.toLowerCase())
  }
}

export class ItemResponseDTO {
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
    fullName?: string
  } | null
  unit?: {
    id: string
    code: string
    name: string
    abbreviation: string
  }

  // Ubicación
  location?: string | null

  // Precios
  costPrice: number
  salePrice: number
  wholesalePrice?: number | null
  margin?: number // Calculado

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

  // Imágenes
  images?: {
    id: string
    url: string
    isPrimary: boolean
    order: number
  }[]
  primaryImage?: string

  // Contadores
  stockCount?: number
  movementCount?: number
  imageCount?: number

  // Stock (si se incluye)
  totalStock?: number
  availableStock?: number
  reservedStock?: number

  createdAt: Date
  updatedAt: Date

  constructor(
    item: any,
    options?: { includeRelations?: boolean; includeStock?: boolean }
  ) {
    this.id = item.id
    this.sku = item.sku
    this.barcode = item.barcode
    this.name = item.name
    this.description = item.description

    this.brandId = item.brandId
    this.categoryId = item.categoryId
    this.modelId = item.modelId
    this.unitId = item.unitId

    this.location = item.location

    this.costPrice = Number(item.costPrice)
    this.salePrice = Number(item.salePrice)
    this.wholesalePrice = item.wholesalePrice
      ? Number(item.wholesalePrice)
      : null

    // Calcular margen
    if (this.costPrice > 0) {
      this.margin = Number(
        (((this.salePrice - this.costPrice) / this.costPrice) * 100).toFixed(2)
      )
    }

    this.minStock = item.minStock
    this.maxStock = item.maxStock
    this.reorderPoint = item.reorderPoint

    this.isActive = item.isActive
    this.isSerialized = item.isSerialized
    this.hasBatch = item.hasBatch
    this.hasExpiry = item.hasExpiry
    this.allowNegativeStock = item.allowNegativeStock

    this.technicalSpecs = item.technicalSpecs
    this.tags = item.tags

    this.createdAt = item.createdAt
    this.updatedAt = item.updatedAt

    // Relaciones
    if (options?.includeRelations) {
      if (item.brand) {
        this.brand = {
          id: item.brand.id,
          code: item.brand.code,
          name: item.brand.name,
        }
      }

      if (item.category) {
        this.category = {
          id: item.category.id,
          code: item.category.code,
          name: item.category.name,
        }
      }

      if (item.model) {
        this.model = {
          id: item.model.id,
          name: item.model.name,
          year: item.model.year,
          fullName: item.model.brand
            ? `${item.model.brand.name} ${item.model.name}${item.model.year ? ` ${item.model.year}` : ''}`
            : item.model.name,
        }
      }

      if (item.unit) {
        this.unit = {
          id: item.unit.id,
          code: item.unit.code,
          name: item.unit.name,
          abbreviation: item.unit.abbreviation,
        }
      }

      // Imágenes
      if (item.images) {
        this.images = item.images.map((img: any) => ({
          id: img.id,
          url: img.url,
          isPrimary: img.isPrimary,
          order: img.order,
        }))

        const primary = item.images.find((img: any) => img.isPrimary)
        this.primaryImage = primary?.url || item.images[0]?.url
      }
    }

    // Contadores
    if (item._count) {
      this.stockCount = item._count.stocks || 0
      this.movementCount = item._count.movements || 0
      this.imageCount = item._count.images || 0
    }

    // Stock
    if (options?.includeStock && item.stocks) {
      this.totalStock = item.stocks.reduce(
        (sum: number, s: any) => sum + s.quantityReal,
        0
      )
      this.availableStock = item.stocks.reduce(
        (sum: number, s: any) => sum + s.quantityAvailable,
        0
      )
      this.reservedStock = item.stocks.reduce(
        (sum: number, s: any) => sum + s.quantityReserved,
        0
      )
    }
  }
}

export class ItemListResponseDTO {
  items: ItemResponseDTO[]
  total: number
  page: number
  limit: number
  totalPages: number

  constructor(data: any) {
    this.items = data.items.map(
      (item: any) =>
        new ItemResponseDTO(item, {
          includeRelations: true,
          includeStock: true,
        })
    )
    this.total = data.total
    this.page = data.page
    this.limit = data.limit
    this.totalPages = data.totalPages
  }
}
