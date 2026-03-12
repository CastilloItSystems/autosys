// backend/src/features/inventory/serialNumbers/serialNumbers.dto.ts

import { ISerialNumber, SerialStatus } from './serialNumbers.interface.js'

export class CreateSerialNumberDTO {
  serialNumber: string
  itemId: string
  warehouseId?: string | null
  status?: SerialStatus
  notes?: string | null

  constructor(data: any) {
    this.serialNumber = data.serialNumber
    this.itemId = data.itemId
    this.warehouseId = data.warehouseId ?? null
    this.status = data.status ?? SerialStatus.IN_STOCK
    this.notes = data.notes ?? null
  }
}

export class UpdateSerialNumberDTO {
  status?: SerialStatus
  warehouseId?: string | null
  notes?: string | null

  constructor(data: any) {
    const updateData: any = {}
    if (data.status !== undefined) updateData.status = data.status
    if (data.warehouseId !== undefined)
      updateData.warehouseId = data.warehouseId ?? null
    if (data.notes !== undefined) updateData.notes = data.notes ?? null

    if (updateData.status !== undefined) this.status = updateData.status
    if (updateData.warehouseId !== undefined)
      this.warehouseId = updateData.warehouseId
    if (updateData.notes !== undefined) this.notes = updateData.notes
  }
}

export class AssignSerialDTO {
  warehouseId: string

  constructor(data: any) {
    this.warehouseId = data.warehouseId
  }
}

export class SerialNumberResponseDTO {
  id: string
  serialNumber: string
  itemId: string
  warehouseId?: string | null
  status: SerialStatus
  workOrderId?: string | null
  soldAt?: Date | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  item?: any
  warehouse?: any

  constructor(data: ISerialNumber & { item?: any; warehouse?: any }) {
    this.id = data.id
    this.serialNumber = data.serialNumber
    this.itemId = data.itemId
    this.warehouseId = data.warehouseId ?? null
    this.status = data.status
    this.workOrderId = data.workOrderId ?? null
    this.soldAt = data.soldAt ?? null
    this.notes = data.notes ?? null
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    if (data.item) this.item = data.item
    if (data.warehouse) this.warehouse = data.warehouse
  }
}

export class SerialNumberListResponseDTO {
  id: string
  serialNumber: string
  itemId: string
  itemName?: string
  warehouseId?: string | null
  warehouseName?: string
  status: SerialStatus
  createdAt: Date

  constructor(data: any) {
    this.id = data.id
    this.serialNumber = data.serialNumber
    this.itemId = data.itemId
    this.itemName = data.item?.name
    this.warehouseId = data.warehouseId
    this.warehouseName = data.warehouse?.name
    this.status = data.status
    this.createdAt = data.createdAt
  }
}
