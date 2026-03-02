// backend/src/features/inventory/transfers/transfers.dto.ts

import { ITransfer, TransferStatus } from './transfers.interface'

export class CreateTransferDTO {
  fromWarehouseId: string
  toWarehouseId: string
  items: CreateTransferItemDTO[]
  notes?: string | null

  constructor(data: any) {
    this.fromWarehouseId = data.fromWarehouseId
    this.toWarehouseId = data.toWarehouseId
    this.items = (data.items || []).map(
      (item: any) => new CreateTransferItemDTO(item)
    )
    this.notes = data.notes ?? null
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
    this.unitCost = data.unitCost ?? null
    this.notes = data.notes ?? null
  }
}

export class UpdateTransferDTO {
  notes?: string | null

  constructor(data: any) {
    if (data.notes !== undefined) this.notes = data.notes ?? null
  }
}

export class SendTransferDTO {
  sentBy: string

  constructor(data: any) {
    this.sentBy = data.sentBy
  }
}

export class ReceiveTransferDTO {
  receivedBy: string

  constructor(data: any) {
    this.receivedBy = data.receivedBy
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
  sentAt?: Date | null
  receivedAt?: Date | null
  sentBy?: string | null
  receivedBy?: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
  items?: any[]
  fromWarehouse?: any
  toWarehouse?: any

  constructor(
    data: ITransfer & { items?: any[]; fromWarehouse?: any; toWarehouse?: any }
  ) {
    this.id = data.id
    this.transferNumber = data.transferNumber
    this.fromWarehouseId = data.fromWarehouseId
    this.toWarehouseId = data.toWarehouseId
    this.status = data.status
    this.quantity = data.quantity
    this.notes = data.notes
    this.sentAt = data.sentAt
    this.receivedAt = data.receivedAt
    this.sentBy = data.sentBy
    this.receivedBy = data.receivedBy
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    if (data.items) this.items = data.items
    if (data.fromWarehouse) this.fromWarehouse = data.fromWarehouse
    if (data.toWarehouse) this.toWarehouse = data.toWarehouse
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
  createdAt: Date

  constructor(data: any) {
    this.id = data.id
    this.transferNumber = data.transferNumber
    this.fromWarehouse = data.fromWarehouse?.name
    this.toWarehouse = data.toWarehouse?.name
    this.status = data.status
    this.quantity = data.quantity
    this.sentAt = data.sentAt
    this.receivedAt = data.receivedAt
    this.createdAt = data.createdAt
  }
}
