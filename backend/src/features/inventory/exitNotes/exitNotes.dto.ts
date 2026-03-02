/**
 * Exit Notes Module DTOs
 * Data Transfer Objects for API requests and responses
 */

import {
  ExitNoteStatus,
  ExitNoteType,
  IExitNoteItem,
  IExitNoteResponse,
} from './exitNotes.interface'

/**
 * Create Exit Note Item DTO
 */
export class CreateExitNoteItemDTO {
  itemId: string
  quantity: number
  pickedFromLocation?: string
  batchId?: string
  serialNumberId?: string
  notes?: string

  constructor(data: CreateExitNoteItemDTO) {
    this.itemId = data.itemId
    this.quantity = data.quantity
    this.pickedFromLocation = data.pickedFromLocation
    this.batchId = data.batchId
    this.serialNumberId = data.serialNumberId
    this.notes = data.notes
  }
}

/**
 * Create Exit Note DTO
 * Used to create new exit notes of any type
 */
export class CreateExitNoteDTO {
  type: ExitNoteType
  warehouseId: string
  preInvoiceId?: string
  recipientName?: string
  recipientId?: string
  recipientPhone?: string
  reason?: string
  reference?: string
  expectedReturnDate?: Date
  items: CreateExitNoteItemDTO[]
  notes?: string
  authorizedBy?: string

  constructor(data: CreateExitNoteDTO) {
    this.type = data.type
    this.warehouseId = data.warehouseId
    this.preInvoiceId = data.preInvoiceId
    this.recipientName = data.recipientName
    this.recipientId = data.recipientId
    this.recipientPhone = data.recipientPhone
    this.reason = data.reason
    this.reference = data.reference
    this.expectedReturnDate = data.expectedReturnDate
    this.items = data.items || []
    this.notes = data.notes
    this.authorizedBy = data.authorizedBy
  }
}

/**
 * Update Exit Note DTO
 * For modifying exit notes in PENDING or IN_PROGRESS status
 */
export class UpdateExitNoteDTO {
  recipientName?: string
  recipientId?: string
  recipientPhone?: string
  reason?: string
  reference?: string
  notes?: string
  expectedReturnDate?: Date

  constructor(data: UpdateExitNoteDTO) {
    this.recipientName = data.recipientName
    this.recipientId = data.recipientId
    this.recipientPhone = data.recipientPhone
    this.reason = data.reason
    this.reference = data.reference
    this.notes = data.notes
    this.expectedReturnDate = data.expectedReturnDate
  }
}

/**
 * Mark As Ready DTO
 * Transition from IN_PROGRESS to READY
 */
export class MarkAsReadyDTO {
  preparedBy: string
  preparedAt?: Date

  constructor(data: MarkAsReadyDTO) {
    this.preparedBy = data.preparedBy
    this.preparedAt = data.preparedAt || new Date()
  }
}

/**
 * Deliver Exit Note DTO
 * Complete delivery and mark as DELIVERED
 */
export class DeliverExitNoteDTO {
  deliveredBy: string
  deliveredAt?: Date
  reference?: string

  constructor(data: DeliverExitNoteDTO) {
    this.deliveredBy = data.deliveredBy
    this.deliveredAt = data.deliveredAt || new Date()
    this.reference = data.reference
  }
}

/**
 * Return Loan Item DTO
 * For LOAN_RETURN exits - mark items as returned
 */
export class ReturnLoanItemDTO {
  exitNoteNumber: string
  returnedAt?: Date
  returnedBy: string
  notes?: string

  constructor(data: ReturnLoanItemDTO) {
    this.exitNoteNumber = data.exitNoteNumber
    this.returnedAt = data.returnedAt || new Date()
    this.returnedBy = data.returnedBy
    this.notes = data.notes
  }
}

/**
 * Exit Note Response DTO
 * Standard response format for API endpoints
 */
export class ExitNoteResponseDTO implements IExitNoteResponse {
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

  constructor(data: IExitNoteResponse) {
    this.id = data.id
    this.exitNoteNumber = data.exitNoteNumber
    this.type = data.type
    this.status = data.status
    this.warehouseId = data.warehouseId
    this.preInvoiceId = data.preInvoiceId
    this.recipientName = data.recipientName
    this.recipientId = data.recipientId
    this.recipientPhone = data.recipientPhone
    this.reason = data.reason
    this.reference = data.reference
    this.expectedReturnDate = data.expectedReturnDate
    this.returnedAt = data.returnedAt
    this.items = data.items
    this.notes = data.notes
    this.reservedAt = data.reservedAt
    this.preparedAt = data.preparedAt
    this.deliveredAt = data.deliveredAt
    this.preparedBy = data.preparedBy
    this.deliveredBy = data.deliveredBy
    this.authorizedBy = data.authorizedBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}

/**
 * Exit Note List Response DTO
 */
export class ExitNoteListResponseDTO {
  data: ExitNoteResponseDTO[]
  total: number
  page: number
  limit: number
  hasMore: boolean

  constructor(
    data: ExitNoteResponseDTO[],
    total: number,
    page: number,
    limit: number
  ) {
    this.data = data
    this.total = total
    this.page = page
    this.limit = limit
    this.hasMore = page * limit < total
  }
}
