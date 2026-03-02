// backend/src/features/inventory/receives/receives.dto.ts

import { IReceive, IReceiveItem } from './receives.interface'

export class CreateReceiveDTO {
  purchaseOrderId: string
  warehouseId: string
  notes?: string | null
  receivedBy?: string | null

  constructor(data: any) {
    this.purchaseOrderId = data.purchaseOrderId
    this.warehouseId = data.warehouseId
    this.notes = data.notes ?? null
    this.receivedBy = data.receivedBy ?? null
  }
}

export class UpdateReceiveDTO {
  notes?: string | null
  receivedBy?: string | null

  constructor(data: any) {
    const updateData: any = {}
    if (data.notes !== undefined) updateData.notes = data.notes ?? null
    if (data.receivedBy !== undefined)
      updateData.receivedBy = data.receivedBy ?? null

    if (updateData.notes !== undefined) this.notes = updateData.notes
    if (updateData.receivedBy !== undefined)
      this.receivedBy = updateData.receivedBy
  }
}

export class ReceiveResponseDTO {
  id: string
  receiveNumber: string
  purchaseOrderId: string
  warehouseId: string
  notes?: string | null
  receivedBy?: string | null
  receivedByName?: string | null
  receivedAt: Date
  createdAt: Date
  updatedAt: Date
  purchaseOrder?: any
  warehouse?: any
  items?: any[]

  constructor(
    data: IReceive & {
      purchaseOrder?: any
      warehouse?: any
      items?: any[]
      receivedByName?: string | null
    }
  ) {
    this.id = data.id
    this.receiveNumber = data.receiveNumber
    this.purchaseOrderId = data.purchaseOrderId
    this.warehouseId = data.warehouseId
    this.notes = data.notes ?? null
    this.receivedBy = data.receivedBy ?? null
    this.receivedByName = data.receivedByName ?? null
    this.receivedAt = data.receivedAt
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    if (data.purchaseOrder) this.purchaseOrder = data.purchaseOrder
    if (data.warehouse) this.warehouse = data.warehouse
    if (data.items) {
      this.items = data.items.map((item) => new ReceiveItemResponseDTO(item))
    }
  }
}

export class CreateReceiveItemDTO {
  itemId: string
  quantityReceived: number
  unitCost: number
  batchNumber?: string | null
  expiryDate?: Date | null

  constructor(data: any) {
    this.itemId = data.itemId
    this.quantityReceived = Number(data.quantityReceived)
    this.unitCost = Number(data.unitCost)
    this.batchNumber = data.batchNumber ?? null
    this.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null
  }
}

export class ReceiveItemResponseDTO {
  id: string
  receiveId: string
  itemId: string
  quantityReceived: number
  unitCost: number | string
  batchNumber?: string | null
  expiryDate?: Date | null
  createdAt: Date
  updatedAt?: Date
  item?: { id: string; sku: string; name: string } | null

  constructor(data: IReceiveItem & { item?: any }) {
    this.id = data.id
    this.receiveId = data.receiveId
    this.itemId = data.itemId
    this.quantityReceived = data.quantityReceived
    this.unitCost = data.unitCost
    this.batchNumber = data.batchNumber ?? null
    this.expiryDate = data.expiryDate ?? null
    this.createdAt = data.createdAt
    if (data.updatedAt) this.updatedAt = data.updatedAt
    if (data.item) this.item = data.item
  }
}
