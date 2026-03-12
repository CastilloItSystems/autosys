// backend/src/features/inventory/warehouses/warehouses.dto.ts

import {
  IWarehouseWithRelations,
  WarehouseType,
} from './warehouses.interface.js'

export class CreateWarehouseDTO {
  code: string
  name: string
  type: WarehouseType
  address?: string

  constructor(data: Record<string, unknown>) {
    this.code = (data.code as string)?.toUpperCase()
    this.name = data.name as string
    this.type = (data.type as WarehouseType) ?? WarehouseType.PRINCIPAL
    if (data.address !== undefined) this.address = data.address as string
  }
}

export class UpdateWarehouseDTO {
  code?: string
  name?: string
  type?: WarehouseType
  address?: string | null
  isActive?: boolean

  constructor(data: Record<string, unknown>) {
    if (data.code !== undefined) this.code = (data.code as string).toUpperCase()
    if (data.name !== undefined) this.name = data.name as string
    if (data.type !== undefined) this.type = data.type as WarehouseType
    if (data.address !== undefined)
      this.address = (data.address as string | null) ?? null
    if (data.isActive !== undefined) this.isActive = data.isActive as boolean
  }
}

export class WarehouseResponseDTO {
  id: string
  code: string
  name: string
  type: WarehouseType
  address: string | null
  isActive: boolean
  empresaId: string
  createdAt: Date
  updatedAt: Date
  stocks?: Array<{
    itemId: string
    quantityReal: number
    quantityAvailable: number
  }>
  _count?: Record<string, number>

  constructor(
    warehouse: IWarehouseWithRelations,
    options: { includeRelations?: boolean } = {}
  ) {
    this.id = warehouse.id
    this.code = warehouse.code
    this.name = warehouse.name
    this.type = warehouse.type
    this.address = warehouse.address ?? null
    this.isActive = warehouse.isActive
    this.empresaId = warehouse.empresaId
    this.createdAt = warehouse.createdAt
    this.updatedAt = warehouse.updatedAt

    if (options.includeRelations) {
      if (warehouse.stocks) this.stocks = warehouse.stocks
      if (warehouse._count)
        this._count = warehouse._count as Record<string, number>
    }
  }
}
