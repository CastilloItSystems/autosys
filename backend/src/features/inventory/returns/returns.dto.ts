// backend/src/features/inventory/returns/returns.dto.ts

import { IReturn, ReturnStatus } from './returns.interface'

export class CreateReturnDTO {
  type: string
  warehouseId: string
  reason: string
  items: any[]
  notes?: string | null

  constructor(data: any) {
    this.type = data.type
    this.warehouseId = data.warehouseId
    this.reason = data.reason
    this.items = data.items || []
    this.notes = data.notes ?? null
  }
}

export class UpdateReturnDTO {
  reason?: string
  notes?: string | null

  constructor(data: any) {
    if (data.reason !== undefined) this.reason = data.reason
    if (data.notes !== undefined) this.notes = data.notes ?? null
  }
}

export class ReturnResponseDTO {
  id: string
  returnNumber: string
  type: string
  status: ReturnStatus
  warehouseId: string
  reason: string
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  items?: any[]

  constructor(data: any) {
    this.id = data.id
    this.returnNumber = data.returnNumber
    this.type = data.type
    this.status = data.status
    this.warehouseId = data.warehouseId
    this.reason = data.reason
    this.notes = data.notes
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    if (data.items) this.items = data.items
  }
}
