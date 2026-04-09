// backend/src/features/inventory/stock/stock.interface.ts

export enum AlertType {
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED',
  OVERSTOCK = 'OVERSTOCK',
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface IStock {
  id: string
  itemId: string
  warehouseId: string
  quantityReal: number
  quantityReserved: number
  quantityConsumed: number
  quantityAvailable: number
  location?: string | null
  averageCost: number
  lastMovementAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface IStockWithRelations extends IStock {
  item?: any
  warehouse?: any
}

export interface ICreateStockInput {
  itemId: string
  warehouseId: string
  quantityReal?: number | undefined
  quantityReserved?: number | undefined
  quantityConsumed?: number | undefined
  location?: string | null
  averageCost?: number | undefined
}

export interface IUpdateStockInput {
  quantityReal?: number | undefined
  quantityReserved?: number | undefined
  quantityConsumed?: number | undefined
  location?: string | null
  averageCost?: number | undefined
}

export interface IStockFilters {
  itemId?: string
  warehouseId?: string
  minQuantity?: number
  maxQuantity?: number
  lowStock?: boolean
  outOfStock?: boolean
}

export interface IStockAdjustment {
  itemId: string
  warehouseId: string
  quantityChange: number
  reason: string
  movementId?: string
}

export interface IStockReservation {
  itemId: string
  warehouseId: string
  quantity: number
  reservationId?: string
}

export interface IStockRelease {
  itemId: string
  warehouseId: string
  quantity: number
  reservationId?: string
}

export interface IStockTransfer {
  itemId: string
  warehouseFromId: string
  warehouseToId: string
  quantity: number
  movementId?: string
}

export interface IStockAlert {
  id: string
  itemId: string
  warehouseId: string
  type: AlertType
  message: string
  severity: AlertSeverity
  isRead: boolean
  readBy?: string | null
  readAt?: Date | null
  createdAt: Date
}

export interface ICreateStockAlertInput {
  itemId: string
  warehouseId: string
  type: AlertType
  message: string
  severity?: AlertSeverity | undefined
}

export interface IStockAlertFilters {
  type?: AlertType
  itemId?: string
  warehouseId?: string
  isRead?: boolean
  severity?: AlertSeverity
}
