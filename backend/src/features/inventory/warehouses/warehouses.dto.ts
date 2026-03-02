// backend/src/features/inventory/warehouses/warehouses.dto.ts

import { IWarehouse, WarehouseType } from './warehouses.interface'

export class CreateWarehouseDTO {
  code: string
  name: string
  type: WarehouseType
  address?: string

  constructor(data: any) {
    this.code = data.code?.toUpperCase()
    this.name = data.name
    this.type = data.type ?? WarehouseType.PRINCIPAL
    this.address = data.address
  }
}

export class UpdateWarehouseDTO {
  code?: string
  name?: string
  type?: WarehouseType
  address?: string | null
  isActive?: boolean

  constructor(data: any) {
    if (data.code) this.code = data.code.toUpperCase()
    if (data.name) this.name = data.name
    if (data.type) this.type = data.type
    if (data.address !== undefined) this.address = data.address
    if (data.isActive !== undefined) this.isActive = data.isActive
  }
}

export class WarehouseResponseDTO {
  id: string
  code: string
  name: string
  type: WarehouseType
  address?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  stocks?: any[]
  movementsFrom?: any[]
  movementsTo?: any[]
  orders?: any[]
  preInvoices?: any[]
  exitNotes?: any[]
  purchaseOrders?: any[]

  constructor(
    warehouse: IWarehouse,
    options: {
      includeRelations?: boolean
    } = {}
  ) {
    this.id = warehouse.id
    this.code = warehouse.code
    this.name = warehouse.name
    this.type = warehouse.type
    this.address = warehouse.address ?? null
    this.isActive = warehouse.isActive
    this.createdAt = warehouse.createdAt
    this.updatedAt = warehouse.updatedAt

    if (options.includeRelations && warehouse) {
      const relations = warehouse as any
      if (relations.stocks) this.stocks = relations.stocks
      if (relations.movementsFrom) this.movementsFrom = relations.movementsFrom
      if (relations.movementsTo) this.movementsTo = relations.movementsTo
      if (relations.orders) this.orders = relations.orders
      if (relations.preInvoices) this.preInvoices = relations.preInvoices
      if (relations.exitNotes) this.exitNotes = relations.exitNotes
      if (relations.purchaseOrders)
        this.purchaseOrders = relations.purchaseOrders
    }
  }
}
