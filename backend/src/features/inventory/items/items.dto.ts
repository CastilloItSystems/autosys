// backend/src/features/inventory/items/items.dto.ts
type AnyRecord = Record<string, unknown>

const asRecord = (value: unknown): AnyRecord =>
  value && typeof value === 'object' ? (value as AnyRecord) : {}

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
  technicalSpecs?: unknown
  tags?: string[]

  constructor(data: unknown) {
    const d = asRecord(data)

    this.sku = String(d.sku ?? '').toUpperCase()
    this.name = String(d.name ?? '')
    this.brandId = String(d.brandId ?? '')
    this.categoryId = String(d.categoryId ?? '')
    this.unitId = String(d.unitId ?? '')

    if (d.barcode != null) this.barcode = String(d.barcode)
    if (d.description != null) this.description = String(d.description)
    if (d.modelId != null) this.modelId = String(d.modelId)
    if (d.location != null) this.location = String(d.location).toUpperCase()

    this.costPrice = Number(d.costPrice ?? 0)
    this.salePrice = Number(d.salePrice ?? 0)

    if (d.wholesalePrice != null) {
      this.wholesalePrice = Number(d.wholesalePrice)
    }

    this.minStock = Number(d.minStock ?? 5)
    this.maxStock = Number(d.maxStock ?? 100)
    this.reorderPoint = Number(d.reorderPoint ?? 10)

    this.isActive = (d.isActive as boolean) ?? true
    this.isSerialized = (d.isSerialized as boolean) ?? false
    this.hasBatch = (d.hasBatch as boolean) ?? false
    this.hasExpiry = (d.hasExpiry as boolean) ?? false
    this.allowNegativeStock = (d.allowNegativeStock as boolean) ?? false

    if (d.technicalSpecs !== undefined) this.technicalSpecs = d.technicalSpecs

    if (Array.isArray(d.tags)) {
      this.tags = d.tags.map((tag) => String(tag).toLowerCase())
    }
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
  technicalSpecs?: unknown
  tags?: string[]

  constructor(data: unknown) {
    const d = asRecord(data)

    if (d.sku !== undefined) this.sku = String(d.sku).toUpperCase()
    if (d.barcode !== undefined)
      this.barcode = d.barcode == null ? '' : String(d.barcode)
    if (d.name !== undefined) this.name = String(d.name)
    if (d.description !== undefined)
      this.description = d.description == null ? '' : String(d.description)
    if (d.brandId !== undefined) this.brandId = String(d.brandId)
    if (d.categoryId !== undefined) this.categoryId = String(d.categoryId)
    if (d.modelId !== undefined)
      this.modelId = d.modelId == null ? '' : String(d.modelId)
    if (d.unitId !== undefined) this.unitId = String(d.unitId)
    if (d.location !== undefined)
      this.location = d.location == null ? '' : String(d.location).toUpperCase()
    if (d.costPrice !== undefined) this.costPrice = Number(d.costPrice)
    if (d.salePrice !== undefined) this.salePrice = Number(d.salePrice)
    if (d.wholesalePrice !== undefined)
      this.wholesalePrice = Number(d.wholesalePrice)
    if (d.minStock !== undefined) this.minStock = Number(d.minStock)
    if (d.maxStock !== undefined) this.maxStock = Number(d.maxStock)
    if (d.reorderPoint !== undefined) this.reorderPoint = Number(d.reorderPoint)
    if (d.isActive !== undefined) this.isActive = Boolean(d.isActive)
    if (d.isSerialized !== undefined)
      this.isSerialized = Boolean(d.isSerialized)
    if (d.hasBatch !== undefined) this.hasBatch = Boolean(d.hasBatch)
    if (d.hasExpiry !== undefined) this.hasExpiry = Boolean(d.hasExpiry)
    if (d.allowNegativeStock !== undefined)
      this.allowNegativeStock = Boolean(d.allowNegativeStock)
    if (d.technicalSpecs !== undefined) this.technicalSpecs = d.technicalSpecs
    if (d.tags !== undefined && Array.isArray(d.tags)) {
      this.tags = d.tags.map((tag) => String(tag).toLowerCase())
    }
  }
}

export class ItemResponseDTO {
  id: string
  sku: string
  barcode?: string | null
  name: string
  description?: string | null

  brandId: string
  categoryId: string
  modelId?: string | null
  unitId: string

  brand?: { id: string; code: string; name: string }
  category?: { id: string; code: string; name: string }
  model?: {
    id: string
    name: string
    year?: number | null
    fullName?: string
  } | null
  unit?: { id: string; code: string; name: string; abbreviation: string }

  location?: string | null

  costPrice: number
  salePrice: number
  wholesalePrice?: number | null
  margin?: number

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

  images?: { id: string; url: string; isPrimary: boolean; order: number }[]
  primaryImage?: string

  stockCount?: number
  movementCount?: number
  imageCount?: number

  totalStock?: number
  availableStock?: number
  reservedStock?: number

  createdAt: Date
  updatedAt: Date

  constructor(
    item: unknown,
    options?: { includeRelations?: boolean; includeStock?: boolean }
  ) {
    const i = asRecord(item)

    this.id = String(i.id ?? '')
    this.sku = String(i.sku ?? '')
    this.name = String(i.name ?? '')
    this.brandId = String(i.brandId ?? '')
    this.categoryId = String(i.categoryId ?? '')
    this.unitId = String(i.unitId ?? '')

    if (i.barcode !== undefined)
      this.barcode = (i.barcode as string | null) ?? null
    if (i.description !== undefined)
      this.description = (i.description as string | null) ?? null
    if (i.modelId !== undefined)
      this.modelId = (i.modelId as string | null) ?? null
    if (i.location !== undefined)
      this.location = (i.location as string | null) ?? null

    this.costPrice = Number(i.costPrice ?? 0)
    this.salePrice = Number(i.salePrice ?? 0)
    if (i.wholesalePrice !== undefined && i.wholesalePrice !== null) {
      this.wholesalePrice = Number(i.wholesalePrice)
    } else if (i.wholesalePrice === null) {
      this.wholesalePrice = null
    }

    if (this.costPrice > 0) {
      this.margin = Number(
        (((this.salePrice - this.costPrice) / this.costPrice) * 100).toFixed(2)
      )
    }

    this.minStock = Number(i.minStock ?? 0)
    if (i.maxStock !== undefined)
      this.maxStock = (i.maxStock as number | null) ?? null
    this.reorderPoint = Number(i.reorderPoint ?? 0)

    this.isActive = Boolean(i.isActive)
    this.isSerialized = Boolean(i.isSerialized)
    this.hasBatch = Boolean(i.hasBatch)
    this.hasExpiry = Boolean(i.hasExpiry)
    this.allowNegativeStock = Boolean(i.allowNegativeStock)

    if (i.technicalSpecs !== undefined) this.technicalSpecs = i.technicalSpecs
    if (Array.isArray(i.tags)) this.tags = i.tags as string[]

    this.createdAt = (i.createdAt as Date) ?? new Date()
    this.updatedAt = (i.updatedAt as Date) ?? new Date()

    if (options?.includeRelations) {
      const brand = asRecord(i.brand)
      if (brand.id) {
        this.brand = {
          id: String(brand.id),
          code: String(brand.code ?? ''),
          name: String(brand.name ?? ''),
        }
      }

      const category = asRecord(i.category)
      if (category.id) {
        this.category = {
          id: String(category.id),
          code: String(category.code ?? ''),
          name: String(category.name ?? ''),
        }
      }

      const model = asRecord(i.model)
      if (model.id) {
        const modelBrand = asRecord(model.brand)
        const modelName = String(model.name ?? '')
        const modelYear = model.year as number | null | undefined
        this.model = {
          id: String(model.id),
          name: modelName,
          year: modelYear ?? null,
          fullName: modelBrand.name
            ? `${String(modelBrand.name)} ${modelName}${modelYear ? ` ${modelYear}` : ''}`
            : modelName,
        }
      }

      const unit = asRecord(i.unit)
      if (unit.id) {
        this.unit = {
          id: String(unit.id),
          code: String(unit.code ?? ''),
          name: String(unit.name ?? ''),
          abbreviation: String(unit.abbreviation ?? ''),
        }
      }

      if (Array.isArray(i.images)) {
        this.images = i.images.map((imgRaw) => {
          const img = asRecord(imgRaw)
          return {
            id: String(img.id ?? ''),
            url: String(img.url ?? ''),
            isPrimary: Boolean(img.isPrimary),
            order: Number(img.order ?? 0),
          }
        })
        const primary = this.images.find((img) => img.isPrimary)
        const primaryUrl = primary?.url ?? this.images[0]?.url
        if (primaryUrl) {
          this.primaryImage = primaryUrl
        }
      }
    }

    const count = asRecord(i._count)
    if (Object.keys(count).length > 0) {
      this.stockCount = Number(count.stocks ?? 0)
      this.movementCount = Number(count.movements ?? 0)
      this.imageCount = Number(count.images ?? 0)
    }

    if (options?.includeStock && Array.isArray(i.stocks)) {
      const stocks = i.stocks.map((s) => asRecord(s))
      this.totalStock = stocks.reduce(
        (sum, s) => sum + Number(s.quantityReal ?? 0),
        0
      )
      this.availableStock = stocks.reduce(
        (sum, s) => sum + Number(s.quantityAvailable ?? 0),
        0
      )
      this.reservedStock = stocks.reduce(
        (sum, s) => sum + Number(s.quantityReserved ?? 0),
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

  constructor(data: unknown) {
    const d = asRecord(data)
    const items = Array.isArray(d.items) ? d.items : []
    this.items = items.map(
      (item) =>
        new ItemResponseDTO(item, {
          includeRelations: true,
          includeStock: true,
        })
    )
    this.total = Number(d.total ?? 0)
    this.page = Number(d.page ?? 1)
    this.limit = Number(d.limit ?? 10)
    this.totalPages = Number(d.totalPages ?? 1)
  }
}
