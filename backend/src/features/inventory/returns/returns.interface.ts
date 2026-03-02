// backend/src/features/inventory/returns/returns.interface.ts

export enum ReturnStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  PROCESSED = 'PROCESSED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum ReturnType {
  SUPPLIER_RETURN = 'SUPPLIER_RETURN',
  WORKSHOP_RETURN = 'WORKSHOP_RETURN',
  CUSTOMER_RETURN = 'CUSTOMER_RETURN',
}

export interface IReturn {
  id: string
  returnNumber: string
  type: ReturnType
  status: ReturnStatus
  warehouseId: string
  reason: string
  notes?: string | null
  approvedBy?: string | null
  approvedAt?: Date | null
  processedBy?: string | null
  processedAt?: Date | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface IReturnWithRelations extends IReturn {
  items?: IReturnItem[]
  warehouse?: any
}

export interface IReturnItem {
  id: string
  returnId: string
  itemId: string
  quantity: number
  unitPrice?: number | null
  notes?: string | null
}

export interface ICreateReturnInput {
  type: ReturnType
  warehouseId: string
  reason: string
  items: ICreateReturnItemInput[]
  notes?: string | null
}

export interface IUpdateReturnInput {
  reason?: string
  notes?: string | null
}

export interface IReturnFilters {
  type?: ReturnType
  status?: ReturnStatus
  warehouseId?: string
  createdFrom?: Date
  createdTo?: Date
}

export interface ICreateReturnItemInput {
  itemId: string
  quantity: number
  unitPrice?: number | null
  notes?: string | null
}
