// backend/src/features/inventory/items/catalogs/units/units.dto.ts

import { UnitType } from './units.interface'

export class CreateUnitDTO {
  code: string
  name: string
  abbreviation: string
  type: UnitType
  isActive?: boolean

  constructor(data: any) {
    this.code = data.code
    this.name = data.name
    this.abbreviation = data.abbreviation
    this.type = data.type
    this.isActive = data.isActive ?? true
  }
}

export class UpdateUnitDTO {
  code?: string
  name?: string
  abbreviation?: string
  type?: UnitType
  isActive?: boolean

  constructor(data: any) {
    if (data.code !== undefined) this.code = data.code
    if (data.name !== undefined) this.name = data.name
    if (data.abbreviation !== undefined) this.abbreviation = data.abbreviation
    if (data.type !== undefined) this.type = data.type
    if (data.isActive !== undefined) this.isActive = data.isActive
  }
}

export class UnitResponseDTO {
  id: string
  code: string
  name: string
  abbreviation: string
  type: UnitType
  typeLabel: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date

  // Contadores
  itemsCount?: number

  constructor(unit: any) {
    this.id = unit.id
    this.code = unit.code
    this.name = unit.name
    this.abbreviation = unit.abbreviation
    this.type = unit.type
    this.typeLabel = this.getTypeLabel(unit.type)
    this.isActive = unit.isActive
    this.createdAt = unit.createdAt
    this.updatedAt = unit.updatedAt

    // Contadores
    if (unit._count) {
      this.itemsCount = unit._count.items || 0
    }
  }

  private getTypeLabel(type: UnitType): string {
    const labels: Record<UnitType, string> = {
      COUNTABLE: 'Contable',
      WEIGHT: 'Peso',
      VOLUME: 'Volumen',
      LENGTH: 'Longitud',
    }
    return labels[type] || type
  }
}

export class UnitListResponseDTO {
  units: UnitResponseDTO[]
  total: number
  page: number
  limit: number
  totalPages: number

  constructor(data: any) {
    this.units = data.units.map((unit: any) => new UnitResponseDTO(unit))
    this.total = data.total
    this.page = data.page
    this.limit = data.limit
    this.totalPages = data.totalPages
  }
}

export class UnitGroupedDTO {
  type: UnitType
  typeLabel: string
  units: UnitResponseDTO[]
  count: number

  constructor(data: any) {
    this.type = data.type
    this.typeLabel = data.typeLabel
    this.units = data.units.map((unit: any) => new UnitResponseDTO(unit))
    this.count = data.count
  }
}
