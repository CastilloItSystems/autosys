// backend/src/features/inventory/stock/stock.dto.ts

import {
  IStock,
  AlertType,
  AlertSeverity,
  IStockAlert,
} from './stock.interface'

export class CreateStockDTO {
  itemId: string
  warehouseId: string
  quantityReal?: number | undefined
  quantityReserved?: number | undefined
  averageCost?: number | undefined

  constructor(data: any) {
    this.itemId = data.itemId
    this.warehouseId = data.warehouseId
    this.quantityReal = data.quantityReal
      ? Number(data.quantityReal)
      : undefined
    this.quantityReserved = data.quantityReserved
      ? Number(data.quantityReserved)
      : undefined
    this.averageCost = data.averageCost ? Number(data.averageCost) : undefined
  }
}

export class UpdateStockDTO {
  quantityReal?: number | undefined
  quantityReserved?: number | undefined
  averageCost?: number | undefined

  constructor(data: any) {
    if (data.quantityReal !== undefined)
      this.quantityReal = Number(data.quantityReal)
    if (data.quantityReserved !== undefined)
      this.quantityReserved = Number(data.quantityReserved)
    if (data.averageCost !== undefined)
      this.averageCost = Number(data.averageCost)
  }
}

export class StockResponseDTO {
  id: string
  itemId: string
  warehouseId: string
  quantityReal: number
  quantityReserved: number
  quantityAvailable: number
  averageCost: number
  lastMovementAt?: Date | null
  createdAt: Date
  updatedAt: Date
  item?: any
  warehouse?: any

  constructor(
    stock: IStock,
    options: {
      includeRelations?: boolean
    } = {}
  ) {
    this.id = stock.id
    this.itemId = stock.itemId
    this.warehouseId = stock.warehouseId
    this.quantityReal = stock.quantityReal
    this.quantityReserved = stock.quantityReserved
    this.quantityAvailable = stock.quantityAvailable
    this.averageCost = parseFloat(String(stock.averageCost))
    this.lastMovementAt = stock.lastMovementAt ?? null
    this.createdAt = stock.createdAt
    this.updatedAt = stock.updatedAt

    if (options.includeRelations && stock) {
      const relations = stock as any
      if (relations.item) this.item = relations.item
      if (relations.warehouse) this.warehouse = relations.warehouse
    }
  }
}

export class AdjustStockDTO {
  itemId: string
  warehouseId: string
  quantityChange: number
  reason: string
  movementId?: string

  constructor(data: any) {
    this.itemId = data.itemId
    this.warehouseId = data.warehouseId
    this.quantityChange = Number(data.quantityChange)
    this.reason = data.reason
    this.movementId = data.movementId
  }
}

export class ReserveStockDTO {
  itemId: string
  warehouseId: string
  quantity: number
  reservationId?: string

  constructor(data: any) {
    this.itemId = data.itemId
    this.warehouseId = data.warehouseId
    this.quantity = Number(data.quantity)
    this.reservationId = data.reservationId
  }
}

export class ReleaseStockDTO {
  itemId: string
  warehouseId: string
  quantity: number
  reservationId?: string

  constructor(data: any) {
    this.itemId = data.itemId
    this.warehouseId = data.warehouseId
    this.quantity = Number(data.quantity)
    this.reservationId = data.reservationId
  }
}

export class TransferStockDTO {
  itemId: string
  warehouseFromId: string
  warehouseToId: string
  quantity: number
  movementId?: string

  constructor(data: any) {
    this.itemId = data.itemId
    this.warehouseFromId = data.warehouseFromId
    this.warehouseToId = data.warehouseToId
    this.quantity = Number(data.quantity)
    this.movementId = data.movementId
  }
}

export class CreateStockAlertDTO {
  itemId: string
  warehouseId: string
  type: AlertType
  message: string
  severity?: AlertSeverity | undefined

  constructor(data: any) {
    this.itemId = data.itemId
    this.warehouseId = data.warehouseId
    this.type = data.type
    this.message = data.message
    this.severity = data.severity ? data.severity : undefined
  }
}

export class StockAlertResponseDTO {
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

  constructor(alert: IStockAlert) {
    this.id = alert.id
    this.itemId = alert.itemId
    this.warehouseId = alert.warehouseId
    this.type = alert.type
    this.message = alert.message
    this.severity = alert.severity
    this.isRead = alert.isRead
    this.readBy = alert.readBy ?? null
    this.readAt = alert.readAt ?? null
    this.createdAt = alert.createdAt
  }
}
