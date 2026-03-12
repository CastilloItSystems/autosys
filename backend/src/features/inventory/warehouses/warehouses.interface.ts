// backend/src/features/inventory/warehouses/warehouses.interface.ts

export enum WarehouseType {
  PRINCIPAL = 'PRINCIPAL',
  SUCURSAL = 'SUCURSAL',
  TRANSITO = 'TRANSITO',
}

export interface IWarehouse {
  id: string
  code: string
  name: string
  type: WarehouseType
  address?: string | null
  isActive: boolean
  empresaId: string

  // Auditoría
  createdAt: Date
  updatedAt: Date
}

export interface IWarehouseWithRelations extends IWarehouse {
  stocks?: Array<{
    itemId: string
    quantityReal: number
    quantityAvailable: number
  }>
  _count?: {
    movementsFrom?: number
    movementsTo?: number
    exitNotes?: number
    entryNotes?: number
    purchaseOrders?: number
    adjustments?: number
    stocks?: number
  }
}

export interface ICreateWarehouseInput {
  code: string
  name: string
  type?: WarehouseType
  address?: string
  isActive?: boolean
}

export interface IUpdateWarehouseInput {
  code?: string
  name?: string
  type?: WarehouseType
  address?: string | null
  isActive?: boolean
}

export interface IWarehouseFilters {
  search?: string
  type?: WarehouseType
  isActive?: boolean
  code?: string
}
