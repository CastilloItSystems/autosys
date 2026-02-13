// backend/src/features/inventory/items/catalogs/units/units.interface.ts

export type UnitType = 'COUNTABLE' | 'WEIGHT' | 'VOLUME' | 'LENGTH'

export interface IUnit {
  id: string
  code: string
  name: string
  abbreviation: string
  type: UnitType
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IUnitWithRelations extends IUnit {
  _count?: {
    items: number
  }
}

export interface ICreateUnitInput {
  code: string
  name: string
  abbreviation: string
  type: UnitType
  isActive?: boolean
}

export interface IUpdateUnitInput {
  code?: string
  name?: string
  abbreviation?: string
  type?: UnitType
  isActive?: boolean
}

export interface IUnitFilters {
  search?: string
  type?: UnitType
  isActive?: boolean
}

export interface IUnitGroupedByType {
  type: UnitType
  typeLabel: string
  units: IUnitWithRelations[]
  count: number
}
