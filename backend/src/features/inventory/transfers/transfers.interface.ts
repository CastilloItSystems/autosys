// backend/src/features/inventory/transfers/transfers.interface.ts

export enum TransferStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface ITransfer {
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
  exitNoteId?: string | null
  entryNoteId?: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ITransferNoteInfo {
  id: string
  exitNoteNumber?: string
  entryNoteNumber?: string
  status: string
}

export interface ITransferWithRelations extends ITransfer {
  items?: ITransferItem[]
  fromWarehouse?: any
  toWarehouse?: any
  exitNote?: ITransferNoteInfo | null
  entryNote?: ITransferNoteInfo | null
}

export interface ITransferItem {
  id: string
  transferId: string
  itemId: string
  quantity: number
  unitCost?: number | null
  notes?: string | null
}

export interface ICreateTransferInput {
  fromWarehouseId: string
  toWarehouseId: string
  items: ICreateTransferItemInput[]
  notes?: string | null
}

export interface IUpdateTransferInput {
  notes?: string | null
}

export interface IRejectTransferInput {
  rejectionReason: string
}

export interface ITransferFilters {
  fromWarehouseId?: string
  toWarehouseId?: string
  status?: TransferStatus
  search?: string
  createdFrom?: Date
  createdTo?: Date
}

export interface ICreateTransferItemInput {
  itemId: string
  quantity: number
  unitCost?: number | null
  notes?: string | null
}
