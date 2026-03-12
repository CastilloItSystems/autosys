// backend/src/features/inventory/batches/batches.dto.ts

import { IBatch, BatchStatus } from './batches.interface.js'

export class CreateBatchDTO {
  batchNumber: string
  itemId: string
  manufacturingDate?: Date | null
  expiryDate?: Date | null
  initialQuantity: number
  notes?: string | null

  constructor(data: any) {
    this.batchNumber = data.batchNumber
    this.itemId = data.itemId
    this.manufacturingDate = data.manufacturingDate ?? null
    this.expiryDate = data.expiryDate ?? null
    this.initialQuantity = data.initialQuantity
    this.notes = data.notes ?? null
  }
}

export class UpdateBatchDTO {
  currentQuantity?: number
  notes?: string | null
  isActive?: boolean

  constructor(data: any) {
    const updateData: any = {}
    if (data.currentQuantity !== undefined)
      updateData.currentQuantity = data.currentQuantity
    if (data.notes !== undefined) updateData.notes = data.notes ?? null
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    if (updateData.currentQuantity !== undefined)
      this.currentQuantity = updateData.currentQuantity
    if (updateData.notes !== undefined) this.notes = updateData.notes
    if (updateData.isActive !== undefined) this.isActive = updateData.isActive
  }
}

export class BatchResponseDTO {
  id: string
  batchNumber: string
  itemId: string
  manufacturingDate?: Date | null
  expiryDate?: Date | null
  initialQuantity: number
  currentQuantity: number
  isActive: boolean
  notes?: string | null
  status?: BatchStatus
  createdAt: Date
  updatedAt: Date
  item?: any

  constructor(data: IBatch & { item?: any; status?: BatchStatus }) {
    this.id = data.id
    this.batchNumber = data.batchNumber
    this.itemId = data.itemId
    this.manufacturingDate = data.manufacturingDate ?? null
    this.expiryDate = data.expiryDate ?? null
    this.initialQuantity = data.initialQuantity
    this.currentQuantity = data.currentQuantity
    this.isActive = data.isActive
    this.notes = data.notes ?? null
    this.status = data.status
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    if (data.item) this.item = data.item
  }
}

export class BatchListResponseDTO {
  id: string
  batchNumber: string
  itemId: string
  itemName?: string
  manufacturingDate?: Date | null
  expiryDate?: Date | null
  currentQuantity: number
  initialQuantity: number
  isActive: boolean
  status?: BatchStatus

  constructor(data: any) {
    this.id = data.id
    this.batchNumber = data.batchNumber
    this.itemId = data.itemId
    this.itemName = data.item?.name || data.itemName
    this.manufacturingDate = data.manufacturingDate ?? null
    this.expiryDate = data.expiryDate ?? null
    this.currentQuantity = data.currentQuantity
    this.initialQuantity = data.initialQuantity
    this.isActive = data.isActive
    this.status = data.status
  }
}
