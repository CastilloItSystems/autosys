/**
 * Exit Notes Module Interfaces
 * Handles all types of inventory exits (sales, loans, returns, samples, etc.)
 */

/**
 * Exit Note Status - Workflow state
 * PENDING: Created but not yet processed
 * IN_PROGRESS: Being picked/prepared
 * READY: All items picked and prepared, waiting for delivery/confirmation
 * DELIVERED: Items delivered to recipient
 * CANCELLED: Exit was cancelled, items returned to stock
 */
export enum ExitNoteStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

/**
 * Exit Note Type - Determines handling logic and requirements
 *
 * SALE: Sale to customer (requires PreInvoice link)
 * WARRANTY: Warranty replacement (validates SerialNumber, affects warranty balance)
 * LOAN: Temporary loan (creates Loan record, expects return)
 * INTERNAL_USE: Internal consumption (no recipient, simple deduction)
 * SAMPLE: Free sample/promotional (no recipient typically)
 * DONATION: Charitable donation (requires authorization)
 * OWNER_PICKUP: Owner collecting items (requires owner ID verification)
 * DEMO: Demonstration unit (track demo duration)
 * TRANSFER: Transfer to another location/warehouse (validates destination warehouse)
 * LOAN_RETURN: Return of previously loaned items (validates against Loan record)
 * OTHER: Miscellaneous (free text reason required)
 */
export enum ExitNoteType {
  SALE = 'SALE',
  WARRANTY = 'WARRANTY',
  LOAN = 'LOAN',
  INTERNAL_USE = 'INTERNAL_USE',
  SAMPLE = 'SAMPLE',
  DONATION = 'DONATION',
  OWNER_PICKUP = 'OWNER_PICKUP',
  DEMO = 'DEMO',
  TRANSFER = 'TRANSFER',
  LOAN_RETURN = 'LOAN_RETURN',
  OTHER = 'OTHER',
}

/**
 * Exit Note Item
 * Represents individual line items in an exit note
 */
export interface IExitNoteItem {
  id: string
  exitNoteId: string
  itemId: string
  quantity: number
  pickedFromLocation?: string
  batchId?: string
  serialNumberId?: string
  notes?: string
  createdAt: Date
}

/**
 * Exit Note
 * Main entity representing any type of inventory exit
 */
export interface IExitNote {
  id: string
  exitNoteNumber: string
  type: ExitNoteType
  status: ExitNoteStatus

  // Warehouse source
  warehouseId: string

  // For SALE type: links to pre-invoice
  preInvoiceId?: string

  // Recipient information
  recipientName?: string
  recipientId?: string
  recipientPhone?: string

  // Reason and reference
  reason?: string
  reference?: string

  // For LOAN type: expected return
  expectedReturnDate?: Date
  returnedAt?: Date

  // Items in this exit
  items: IExitNoteItem[]

  // Audit trail
  notes?: string
  reservedAt?: Date
  preparedAt?: Date
  deliveredAt?: Date
  preparedBy?: string
  deliveredBy?: string
  authorizedBy?: string

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

/**
 * Exit Note Response - For API responses
 */
export interface IExitNoteResponse {
  id: string
  exitNoteNumber: string
  type: ExitNoteType
  status: ExitNoteStatus
  warehouseId: string
  preInvoiceId?: string
  recipientName?: string
  recipientId?: string
  recipientPhone?: string
  reason?: string
  reference?: string
  expectedReturnDate?: Date
  returnedAt?: Date
  items: IExitNoteItem[]
  notes?: string
  reservedAt?: Date
  preparedAt?: Date
  deliveredAt?: Date
  preparedBy?: string
  deliveredBy?: string
  authorizedBy?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Exit Note Status Info
 * Provides metadata about exit note state and constraints
 */
export interface IExitNoteStatusInfo {
  id: string
  exitNoteNumber: string
  currentStatus: ExitNoteStatus
  type: ExitNoteType
  totalItems: number
  itemsPicked: number
  isReadyForDelivery: boolean
  canBeCancelled: boolean
  canBeResumed: boolean
  lastStatusChangeAt: Date
  lastModifiedBy?: string
}

/**
 * Exit Note Summary
 * Quick overview for list views
 */
export interface IExitNoteSummary {
  id: string
  exitNoteNumber: string
  type: ExitNoteType
  status: ExitNoteStatus
  recipientName?: string
  itemCount: number
  createdAt: Date
  preparedAt?: Date
  deliveredAt?: Date
}

/**
 * Validation for type-specific fields
 */
export interface IExitNoteTypeValidation {
  type: ExitNoteType
  isValid: boolean
  missingFields: string[]
  validationErrors: string[]
}
