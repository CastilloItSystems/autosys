// backend/src/features/inventory/items/catalogs/brands/brands.interface.ts

export type BrandType = 'VEHICLE' | 'PART' | 'BOTH'

// ============================================
// INTERFACE BASE
// ============================================
export interface IBrand {
  id: string
  code: string
  name: string
  description?: string | null
  type: BrandType
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// ============================================
// INTERFACE CON ESTADÍSTICAS
// ============================================
export interface IBrandWithStats extends IBrand {
  _count?: {
    items: number
    models: number
  }
}

// ============================================
// INPUTS
// ============================================
export interface ICreateBrandInput {
  code: string
  name: string
  description?: string
  type: BrandType
  isActive?: boolean
}

export interface IUpdateBrandInput {
  code?: string
  name?: string
  description?: string
  type?: BrandType
  isActive?: boolean
}

// ============================================
// FILTROS Y CONSULTAS
// ============================================
export interface IBrandFilters {
  search?: string
  type?: BrandType
  isActive?: boolean
  page?: number
  limit?: number
}

export interface IBrandListResult {
  brands: IBrandWithStats[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============================================
// AGRUPACIÓN POR TIPO
// ============================================
export interface IBrandGroupedByType {
  type: BrandType
  typeLabel: string
  brands: IBrandWithStats[]
  count: number
}

export interface IBrandGroupedResult {
  groups: IBrandGroupedByType[]
  totalBrands: number
}

// ============================================
// LABELS Y UTILIDADES
// ============================================
export const BRAND_TYPE_LABELS: Record<BrandType, string> = {
  VEHICLE: 'Vehículo',
  PART: 'Producto/Repuesto',
  BOTH: 'Ambos',
}

export const BRAND_TYPES: BrandType[] = ['VEHICLE', 'PART', 'BOTH']
