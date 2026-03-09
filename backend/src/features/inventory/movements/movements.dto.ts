// backend/src/features/inventory/movements/movements.dto.ts

import { IMovement, MovementType } from './movements.interface'

export class CreateMovementDTO {
  type: MovementType
  itemId: string
  quantity: number
  unitCost?: number | undefined
  totalCost?: number | undefined
  warehouseFromId?: string
  warehouseToId?: string
  batchId?: string
  reference?: string
  purchaseOrderId?: string
  workOrderId?: string
  reservationId?: string
  exitNoteId?: string
  invoiceId?: string
  exitType?: string
  notes?: string
  createdBy?: string
  snapshotQuantity?: number
  variance?: number
  movementDate?: Date | undefined

  constructor(data: any) {
    this.type = data.type
    this.itemId = data.itemId
    this.quantity = Number(data.quantity)
    this.unitCost = data.unitCost ? Number(data.unitCost) : undefined
    this.totalCost = data.totalCost ? Number(data.totalCost) : undefined
    this.warehouseFromId = data.warehouseFromId
    this.warehouseToId = data.warehouseToId
    this.batchId = data.batchId
    this.reference = data.reference
    this.purchaseOrderId = data.purchaseOrderId
    this.workOrderId = data.workOrderId
    this.reservationId = data.reservationId
    this.exitNoteId = data.exitNoteId
    this.invoiceId = data.invoiceId
    this.exitType = data.exitType
    this.notes = data.notes
    this.createdBy = data.createdBy
    this.snapshotQuantity = data.snapshotQuantity
    this.variance = data.variance
    this.movementDate = data.movementDate
      ? new Date(data.movementDate)
      : undefined
  }
}

export class UpdateMovementDTO {
  type?: MovementType
  quantity?: number
  unitCost?: number | undefined
  totalCost?: number | undefined
  warehouseFromId?: string | null
  warehouseToId?: string | null
  batchId?: string | null
  reference?: string | null
  purchaseOrderId?: string | null
  workOrderId?: string | null
  reservationId?: string | null
  exitNoteId?: string | null
  invoiceId?: string | null
  exitType?: string | null
  notes?: string | null
  approvedBy?: string | null
  approvedAt?: Date | null | undefined
  snapshotQuantity?: number | null
  variance?: number | null

  constructor(data: any) {
    if (data.type !== undefined) this.type = data.type
    if (data.quantity !== undefined) this.quantity = Number(data.quantity)
    if (data.unitCost !== undefined)
      this.unitCost = data.unitCost ? Number(data.unitCost) : undefined
    if (data.totalCost !== undefined)
      this.totalCost = data.totalCost ? Number(data.totalCost) : undefined
    if (data.warehouseFromId !== undefined)
      this.warehouseFromId = data.warehouseFromId
    if (data.warehouseToId !== undefined)
      this.warehouseToId = data.warehouseToId
    if (data.batchId !== undefined) this.batchId = data.batchId
    if (data.reference !== undefined) this.reference = data.reference
    if (data.purchaseOrderId !== undefined)
      this.purchaseOrderId = data.purchaseOrderId
    if (data.workOrderId !== undefined) this.workOrderId = data.workOrderId
    if (data.reservationId !== undefined)
      this.reservationId = data.reservationId
    if (data.exitNoteId !== undefined) this.exitNoteId = data.exitNoteId
    if (data.invoiceId !== undefined) this.invoiceId = data.invoiceId
    if (data.exitType !== undefined) this.exitType = data.exitType
    if (data.notes !== undefined) this.notes = data.notes
    if (data.approvedBy !== undefined) this.approvedBy = data.approvedBy
    if (data.approvedAt !== undefined)
      this.approvedAt = data.approvedAt ? new Date(data.approvedAt) : undefined
    if (data.snapshotQuantity !== undefined)
      this.snapshotQuantity = data.snapshotQuantity
    if (data.variance !== undefined) this.variance = data.variance
  }
}

export class MovementResponseDTO {
  id: string
  movementNumber: string
  type: MovementType
  itemId: string
  warehouseFromId?: string | null
  warehouseToId?: string | null
  quantity: number
  unitCost?: number | null
  totalCost?: number | null
  batchId?: string | null
  reference?: string | null
  purchaseOrderId?: string | null
  workOrderId?: string | null
  reservationId?: string | null
  exitNoteId?: string | null
  invoiceId?: string | null
  exitType?: string | null
  notes?: string | null
  createdBy?: string | null
  approvedBy?: string | null
  approvedAt?: Date | null
  snapshotQuantity?: number | null
  variance?: number | null
  movementDate: Date
  createdAt: Date
  updatedAt: Date
  item?: any
  warehouseFrom?: any
  warehouseTo?: any
  batch?: any

  constructor(
    movement: IMovement,
    options: {
      includeRelations?: boolean
    } = {}
  ) {
    this.id = movement.id
    this.movementNumber = movement.movementNumber
    this.type = movement.type
    this.itemId = movement.itemId
    this.warehouseFromId = movement.warehouseFromId ?? null
    this.warehouseToId = movement.warehouseToId ?? null
    this.quantity = movement.quantity
    this.unitCost = movement.unitCost ?? null
    this.totalCost = movement.totalCost ?? null
    this.batchId = movement.batchId ?? null
    this.reference = movement.reference ?? null
    this.purchaseOrderId = movement.purchaseOrderId ?? null
    this.workOrderId = movement.workOrderId ?? null
    this.reservationId = movement.reservationId ?? null
    this.exitNoteId = movement.exitNoteId ?? null
    this.invoiceId = movement.invoiceId ?? null
    this.exitType = movement.exitType ?? null
    this.notes = movement.notes ?? null
    this.createdBy = movement.createdBy ?? null
    this.approvedBy = movement.approvedBy ?? null
    this.approvedAt = movement.approvedAt ?? null
    this.snapshotQuantity = movement.snapshotQuantity ?? null
    this.variance = movement.variance ?? null
    this.movementDate = movement.movementDate
    this.createdAt = movement.createdAt
    this.updatedAt = movement.updatedAt

    if (options.includeRelations && movement) {
      const relations = movement as any
      if (relations.item) this.item = relations.item
      if (relations.warehouseFrom) this.warehouseFrom = relations.warehouseFrom
      if (relations.warehouseTo) this.warehouseTo = relations.warehouseTo
      if (relations.batch) this.batch = relations.batch
    }
  }
}
