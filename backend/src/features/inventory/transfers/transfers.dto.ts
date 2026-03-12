// backend/src/features/inventory/transfers/transfers.dto.ts

import {
  ITransfer,
  ITransferNoteInfo,
  TransferStatus,
} from './transfers.interface.js'

export class CreateTransferDTO {
  fromWarehouseId: string
  toWarehouseId: string
  items: CreateTransferItemDTO[]
  notes?: string | null

  constructor(data: any) {
    this.fromWarehouseId = data.fromWarehouseId
    this.toWarehouseId = data.toWarehouseId
    this.items = (data.items ?? []).map(
      (item: any) => new CreateTransferItemDTO(item)
    )
    if (data.notes !== undefined) this.notes = data.notes ?? null
  }
}

export class CreateTransferItemDTO {
  itemId: string
  quantity: number
  unitCost?: number | null
  notes?: string | null

  constructor(data: any) {
    this.itemId = data.itemId
    this.quantity = data.quantity
    if (data.unitCost !== undefined) this.unitCost = data.unitCost ?? null
    if (data.notes !== undefined) this.notes = data.notes ?? null
  }
}

export class UpdateTransferDTO {
  notes?: string | null

  constructor(data: any) {
    if (data.notes !== undefined) this.notes = data.notes ?? null
  }
}

export class RejectTransferDTO {
  rejectionReason: string

  constructor(data: any) {
    this.rejectionReason = data.rejectionReason
  }
}

export class TransferResponseDTO {
  id: string
  transferNumber: string
  fromWarehouseId: string
  toWarehouseId: string
  status: TransferStatus
  quantity: number
  notes?: string | null
  approvedBy?: string | null
  approvedAt?: Date | null
  rejectedBy?: string | null
  rejectedAt?: Date | null
  rejectionReason?: string | null
  sentAt?: Date | null
  receivedAt?: Date | null
  exitNoteId?: string | null
  entryNoteId?: string | null
  exitNote?: ITransferNoteInfo | null
  entryNote?: ITransferNoteInfo | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
  items?: any[]
  fromWarehouse?: any
  toWarehouse?: any

  constructor(
    data: ITransfer & {
      items?: any[]
      fromWarehouse?: any
      toWarehouse?: any
      exitNote?: any
      entryNote?: any
    }
  ) {
    this.id = data.id
    this.transferNumber = data.transferNumber
    this.fromWarehouseId = data.fromWarehouseId
    this.toWarehouseId = data.toWarehouseId
    this.status = data.status
    this.quantity = data.quantity
    this.notes = data.notes ?? null
    this.approvedBy = data.approvedBy ?? null
    this.approvedAt = data.approvedAt ?? null
    this.rejectedBy = data.rejectedBy ?? null
    this.rejectedAt = data.rejectedAt ?? null
    this.rejectionReason = data.rejectionReason ?? null
    this.sentAt = data.sentAt ?? null
    this.receivedAt = data.receivedAt ?? null
    this.exitNoteId = data.exitNoteId ?? null
    this.entryNoteId = data.entryNoteId ?? null
    this.exitNote = data.exitNote ?? null
    this.entryNote = data.entryNote ?? null
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    if (data.items !== undefined) this.items = data.items
    if (data.fromWarehouse !== undefined)
      this.fromWarehouse = data.fromWarehouse
    if (data.toWarehouse !== undefined) this.toWarehouse = data.toWarehouse
  }
}

export class TransferListResponseDTO {
  id: string
  transferNumber: string
  fromWarehouse?: string
  toWarehouse?: string
  status: TransferStatus
  quantity: number
  sentAt?: Date | null
  receivedAt?: Date | null
  exitNote?: ITransferNoteInfo | null
  entryNote?: ITransferNoteInfo | null
  createdAt: Date

  constructor(data: any) {
    this.id = data.id
    this.transferNumber = data.transferNumber
    this.fromWarehouse = data.fromWarehouse?.name
    this.toWarehouse = data.toWarehouse?.name
    this.status = data.status
    this.quantity = data.quantity
    this.sentAt = data.sentAt ?? null
    this.receivedAt = data.receivedAt ?? null
    this.exitNote = data.exitNote ?? null
    this.entryNote = data.entryNote ?? null
    this.createdAt = data.createdAt
  }
}
