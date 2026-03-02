// backend/src/features/inventory/serialNumbers/serialNumbers.interface.ts

export enum SerialStatus {
  IN_STOCK = 'IN_STOCK',
  SOLD = 'SOLD',
  DEFECTIVE = 'DEFECTIVE',
  WARRANTY = 'WARRANTY',
  LOANED = 'LOANED',
}

export interface ISerialNumber {
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
}

export interface ISerialNumberWithRelations extends ISerialNumber {
  item?: any
  warehouse?: any
  preInvoiceItem?: any
  exitNoteItem?: any
}

export interface ICreateSerialNumberInput {
  serialNumber: string
  itemId: string
  warehouseId?: string | null
  status?: SerialStatus
  notes?: string | null
}

export interface IUpdateSerialNumberInput {
  status?: SerialStatus
  warehouseId?: string | null
  notes?: string | null
}

export interface IAssignSerialInput {
  warehouseId: string
}

export interface ISerialNumberFilters {
  itemId?: string
  serialNumber?: string
  warehouseId?: string
  status?: SerialStatus
}

export interface ISerialNumberTracking {
  serialNumber: string
  itemId: string
  status: SerialStatus
  currentLocation?: string
  movementHistory: ISerialMovement[]
}

export interface ISerialMovement {
  date: Date
  type: string
  fromWarehouse?: string
  toWarehouse?: string
  status: SerialStatus
  reference?: string
}
