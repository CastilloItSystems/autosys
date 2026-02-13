// backend/src/features/inventory/items/catalogs/brands/brands.dto.ts

import {
  BrandType,
  IBrand,
  IBrandWithStats,
  BRAND_TYPE_LABELS,
} from './brands.interface'

// ============================================
// CREATE DTO
// ============================================
export class CreateBrandDTO {
  code: string
  name: string
  description?: string
  type: BrandType
  isActive?: boolean

  constructor(data: any) {
    this.code = data.code.toUpperCase()
    this.name = data.name
    this.description = data.description
    this.type = data.type || 'PART'
    this.isActive = data.isActive ?? true
  }
}

// ============================================
// UPDATE DTO
// ============================================
export class UpdateBrandDTO {
  code?: string
  name?: string
  description?: string
  type?: BrandType
  isActive?: boolean

  constructor(data: any) {
    if (data.code !== undefined) this.code = data.code.toUpperCase()
    if (data.name !== undefined) this.name = data.name
    if (data.description !== undefined) this.description = data.description
    if (data.type !== undefined) this.type = data.type
    if (data.isActive !== undefined) this.isActive = data.isActive
  }
}

// ============================================
// RESPONSE DTO - INDIVIDUAL
// ============================================
export class BrandResponseDTO {
  id: string
  code: string
  name: string
  description?: string | null
  type: BrandType
  typeLabel: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date

  // Estadísticas opcionales
  stats?: {
    itemsCount: number
    modelsCount: number
  }

  constructor(brand: IBrandWithStats) {
    this.id = brand.id
    this.code = brand.code
    this.name = brand.name
    this.description = brand.description || null
    this.type = brand.type
    this.typeLabel = BRAND_TYPE_LABELS[brand.type]
    this.isActive = brand.isActive
    this.createdAt = brand.createdAt
    this.updatedAt = brand.updatedAt

    // Mapear estadísticas si existen
    if (brand._count) {
      this.stats = {
        itemsCount: brand._count.items || 0,
        modelsCount: brand._count.models || 0,
      }
    }
  }
}

// ============================================
// RESPONSE DTO - LISTA PAGINADA
// ============================================
export class BrandListResponseDTO {
  brands: BrandResponseDTO[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }

  constructor(data: {
    brands: IBrandWithStats[]
    total: number
    page: number
    limit: number
    totalPages: number
  }) {
    this.brands = data.brands.map((brand) => new BrandResponseDTO(brand))
    this.pagination = {
      total: data.total,
      page: data.page,
      limit: data.limit,
      totalPages: data.totalPages,
    }
  }
}

// ============================================
// RESPONSE DTO - GRUPO POR TIPO
// ============================================
export class BrandGroupDTO {
  type: BrandType
  typeLabel: string
  brands: BrandResponseDTO[]
  count: number

  constructor(data: { type: BrandType; brands: IBrandWithStats[] }) {
    this.type = data.type
    this.typeLabel = BRAND_TYPE_LABELS[data.type]
    this.brands = data.brands.map((brand) => new BrandResponseDTO(brand))
    this.count = data.brands.length
  }
}

// ============================================
// RESPONSE DTO - AGRUPADO POR TIPO
// ============================================
export class BrandGroupedResponseDTO {
  groups: BrandGroupDTO[]
  totalBrands: number

  constructor(data: {
    groups: Array<{ type: BrandType; brands: IBrandWithStats[] }>
  }) {
    this.groups = data.groups.map((group) => new BrandGroupDTO(group))
    this.totalBrands = this.groups.reduce((sum, group) => sum + group.count, 0)
  }
}

// ============================================
// RESPONSE DTO - SIMPLE (SIN STATS)
// ============================================
export class BrandSimpleDTO {
  id: string
  code: string
  name: string
  type: BrandType
  typeLabel: string
  isActive: boolean

  constructor(brand: IBrand) {
    this.id = brand.id
    this.code = brand.code
    this.name = brand.name
    this.type = brand.type
    this.typeLabel = BRAND_TYPE_LABELS[brand.type]
    this.isActive = brand.isActive
  }
}
