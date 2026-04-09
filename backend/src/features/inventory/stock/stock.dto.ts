// backend/src/features/inventory/stock/stock.dto.ts

import {
  IStock,
  IStockWithRelations,
  AlertType,
  AlertSeverity,
  IStockAlert,
} from './stock.interface.js'

export class CreateStockDTO {
  itemId: string
  warehouseId: string
  quantityReal?: number
  quantityReserved?: number
  location?: string | null
  averageCost?: number

  constructor(data: Record<string, unknown>) {
    this.itemId = String(data.itemId)
    this.warehouseId = String(data.warehouseId)
    if (data.quantityReal !== undefined)
      this.quantityReal = Number(data.quantityReal)
    if (data.quantityReserved !== undefined)
      this.quantityReserved = Number(data.quantityReserved)
    if (data.location !== undefined)
      this.location = data.location === null ? null : String(data.location)
    if (data.averageCost !== undefined)
      this.averageCost = Number(data.averageCost)
  }
}

export class UpdateStockDTO {
  quantityReal?: number
  quantityReserved?: number
  location?: string | null
  averageCost?: number

  constructor(data: Record<string, unknown>) {
    if (data.quantityReal !== undefined)
      this.quantityReal = Number(data.quantityReal)
    if (data.quantityReserved !== undefined)
      this.quantityReserved = Number(data.quantityReserved)
    if (data.location !== undefined)
      this.location = data.location === null ? null : String(data.location)
    if (data.averageCost !== undefined)
      this.averageCost = Number(data.averageCost)
  }
}

export class AdjustStockDTO {
  itemId: string
  warehouseId: string
  quantityChange: number
  reason: string
  movementId?: string

  constructor(data: Record<string, unknown>) {
    this.itemId = String(data.itemId)
    this.warehouseId = String(data.warehouseId)
    this.quantityChange = Number(data.quantityChange)
    this.reason = String(data.reason)
    if (data.movementId !== undefined) this.movementId = String(data.movementId)
  }
}

export class ReserveStockDTO {
  itemId: string
  warehouseId: string
  quantity: number
  reservationId?: string

  constructor(data: Record<string, unknown>) {
    this.itemId = String(data.itemId)
    this.warehouseId = String(data.warehouseId)
    this.quantity = Number(data.quantity)
    if (data.reservationId !== undefined)
      this.reservationId = String(data.reservationId)
  }
}

export class ReleaseStockDTO {
  itemId: string
  warehouseId: string
  quantity: number
  reservationId?: string

  constructor(data: Record<string, unknown>) {
    this.itemId = String(data.itemId)
    this.warehouseId = String(data.warehouseId)
    this.quantity = Number(data.quantity)
    if (data.reservationId !== undefined)
      this.reservationId = String(data.reservationId)
  }
}

export class TransferStockDTO {
  itemId: string
  warehouseFromId: string
  warehouseToId: string
  quantity: number
  movementId?: string

  constructor(data: Record<string, unknown>) {
    this.itemId = String(data.itemId)
    this.warehouseFromId = String(data.warehouseFromId)
    this.warehouseToId = String(data.warehouseToId)
    this.quantity = Number(data.quantity)
    if (data.movementId !== undefined) this.movementId = String(data.movementId)
  }
}

export class CreateStockAlertDTO {
  itemId: string
  warehouseId: string
  type: AlertType
  message: string
  severity?: AlertSeverity

  constructor(data: Record<string, unknown>) {
    this.itemId = String(data.itemId)
    this.warehouseId = String(data.warehouseId)
    this.type = data.type as AlertType
    this.message = String(data.message)
    if (data.severity !== undefined)
      this.severity = data.severity as AlertSeverity
  }
}

export class StockResponseDTO {
  id: string
  itemId: string
  warehouseId: string
  quantityReal: number
  quantityReserved: number
  quantityAvailable: number
  location?: string | null
  averageCost: number
  lastMovementAt: Date | null
  createdAt: Date
  updatedAt: Date
  item?: unknown
  warehouse?: unknown

  constructor(stock: IStock, options: { includeRelations?: boolean } = {}) {
    this.id = stock.id
    this.itemId = stock.itemId
    this.warehouseId = stock.warehouseId
    this.quantityReal = stock.quantityReal
    this.quantityReserved = stock.quantityReserved
    this.quantityAvailable = stock.quantityAvailable
    this.location = stock.location ?? null
    this.averageCost = parseFloat(String(stock.averageCost))
    this.lastMovementAt = stock.lastMovementAt ?? null
    this.createdAt = stock.createdAt
    this.updatedAt = stock.updatedAt

    if (options.includeRelations) {
      const r = stock as IStockWithRelations
      if (r.item !== undefined) this.item = r.item
      if (r.warehouse !== undefined) this.warehouse = r.warehouse
    }
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
  readBy: string | null
  readAt: Date | null
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
