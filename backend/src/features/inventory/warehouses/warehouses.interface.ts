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

  // Auditoría
  createdAt: Date
  updatedAt: Date
}

export interface IWarehouseWithRelations extends IWarehouse {
  stocks?: any[]
  movementsFrom?: any[]
  movementsTo?: any[]
  orders?: any[]
  preInvoices?: any[]
  exitNotes?: any[]
  purchaseOrders?: any[]
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
