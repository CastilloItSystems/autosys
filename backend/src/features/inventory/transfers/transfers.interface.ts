// backend/src/features/inventory/transfers/transfers.interface.ts

export enum TransferStatus {
  DRAFT = 'DRAFT',
  IN_TRANSIT = 'IN_TRANSIT',
  RECEIVED = 'RECEIVED',
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
  sentAt?: Date | null
  receivedAt?: Date | null
  sentBy?: string | null
  receivedBy?: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ITransferWithRelations extends ITransfer {
  items?: ITransferItem[]
  fromWarehouse?: any
  toWarehouse?: any
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

export interface ISendTransferInput {
  sentBy: string
}

export interface IReceiveTransferInput {
  receivedBy: string
}

export interface ITransferFilters {
  fromWarehouseId?: string
  toWarehouseId?: string
  status?: TransferStatus
  createdFrom?: Date
  createdTo?: Date
}

export interface ICreateTransferItemInput {
  itemId: string
  quantity: number
  unitCost?: number | null
  notes?: string | null
}
