// backend/src/features/inventory/receives/receives.interface.ts

export interface IReceive {
  id: string
  receiveNumber: string
  purchaseOrderId: string
  warehouseId: string
  notes?: string | null
  receivedBy?: string | null
  receivedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface IReceiveWithRelations extends IReceive {
  purchaseOrder?: any
  items?: IReceiveItem[]
}

export interface ICreateReceiveInput {
  purchaseOrderId: string
  warehouseId: string
  notes?: string | null
  receivedBy?: string | null
}

export interface IUpdateReceiveInput {
  notes?: string | null
  receivedBy?: string | null
}

export interface IReceiveFilters {
  purchaseOrderId?: string
  warehouseId?: string
  receivedBy?: string
  receivedFrom?: Date
  receivedTo?: Date
}

export interface IReceiveItem {
  id: string
  receiveId: string
  itemId: string
  quantityReceived: number
  unitCost: number | string
  batchNumber?: string | null
  expiryDate?: Date | null
  createdAt: Date
  updatedAt?: Date
}

export interface ICreateReceiveItemInput {
  itemId: string
  quantityReceived: number
  unitCost: number
  batchNumber?: string | null
  expiryDate?: Date | null
}

export interface ICreateReceiveItemInput {
  itemId: string
  quantityReceived: number
  unitCost: number
  batchNumber?: string | null
  expiryDate?: Date | null
}
