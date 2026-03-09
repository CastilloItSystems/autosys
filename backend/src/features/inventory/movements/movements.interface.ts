// backend/src/features/inventory/movements/movements.interface.ts

export enum MovementType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  ADJUSTMENT_IN = 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT = 'ADJUSTMENT_OUT',
  TRANSFER = 'TRANSFER',
  SUPPLIER_RETURN = 'SUPPLIER_RETURN',
  WORKSHOP_RETURN = 'WORKSHOP_RETURN',
  RESERVATION_RELEASE = 'RESERVATION_RELEASE',
  LOAN_OUT = 'LOAN_OUT',
  LOAN_RETURN = 'LOAN_RETURN',
}

export interface IMovement {
  id: string
  movementNumber: string
  type: MovementType
  itemId: string
  warehouseFromId?: string | null
  warehouseToId?: string | null
  quantity: number
  unitCost?: number | null
  totalCost?: number | null
  batchId?: string | null
  reference?: string | null
  purchaseOrderId?: string | null
  workOrderId?: string | null
  reservationId?: string | null
  exitNoteId?: string | null
  invoiceId?: string | null
  exitType?: string | null
  notes?: string | null
  createdBy?: string | null
  approvedBy?: string | null
  approvedAt?: Date | null
  snapshotQuantity?: number | null
  variance?: number | null
  movementDate: Date
  createdAt: Date
  updatedAt: Date
}

export interface IMovementWithRelations extends IMovement {
  item?: any
  warehouseFrom?: any
  warehouseTo?: any
  batch?: any
}

export interface ICreateMovementInput {
  type: MovementType
  itemId: string
  quantity: number
  unitCost?: number | undefined
  totalCost?: number | undefined
  warehouseFromId?: string
  warehouseToId?: string
  batchId?: string
  reference?: string
  purchaseOrderId?: string
  workOrderId?: string
  reservationId?: string
  exitNoteId?: string
  invoiceId?: string
  exitType?: string
  notes?: string
  createdBy?: string
  snapshotQuantity?: number
  variance?: number
  movementDate?: Date | undefined
}

export interface IUpdateMovementInput {
  type?: MovementType
  quantity?: number
  unitCost?: number | undefined
  totalCost?: number | undefined
  warehouseFromId?: string | null
  warehouseToId?: string | null
  batchId?: string | null
  reference?: string | null
  purchaseOrderId?: string | null
  workOrderId?: string | null
  reservationId?: string | null
  exitNoteId?: string | null
  invoiceId?: string | null
  exitType?: string | null
  notes?: string | null
  approvedBy?: string | null
  approvedAt?: Date | null | undefined
}

export interface IMovementFilters {
  type?: MovementType
  itemId?: string
  warehouseFromId?: string
  warehouseToId?: string
  createdBy?: string
  dateFrom?: Date
  dateTo?: Date
  reference?: string
}
