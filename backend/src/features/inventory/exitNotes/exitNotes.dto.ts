// backend/src/features/inventory/exitNotes/exitNotes.dto.ts

import {
  ExitNoteStatus,
  ExitNoteType,
  IExitNoteItem,
  IExitNoteResponse,
} from './exitNotes.interface.js'

export class CreateExitNoteItemDTO {
  itemId: string
  itemName?: string
  quantity: number
  pickedFromLocation?: string
  batchId?: string
  serialNumberId?: string
  notes?: string

  constructor(data: Record<string, unknown>) {
    this.itemId = String(data.itemId)
    this.quantity = Number(data.quantity)
    if (data.itemName != null && data.itemName !== '')
      this.itemName = String(data.itemName)
    if (data.pickedFromLocation != null && data.pickedFromLocation !== '')
      this.pickedFromLocation = String(data.pickedFromLocation)
    if (data.batchId != null && data.batchId !== '')
      this.batchId = String(data.batchId)
    if (data.serialNumberId != null && data.serialNumberId !== '')
      this.serialNumberId = String(data.serialNumberId)
    if (data.notes != null && data.notes !== '') this.notes = String(data.notes)
  }
}

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

  constructor(data: Record<string, unknown>) {
    this.type = data.type as ExitNoteType
    this.warehouseId = String(data.warehouseId)
    if (data.preInvoiceId !== undefined)
      this.preInvoiceId = String(data.preInvoiceId)
    if (data.recipientName !== undefined)
      this.recipientName = String(data.recipientName)
    if (data.recipientId !== undefined)
      this.recipientId = String(data.recipientId)
    if (data.recipientPhone !== undefined)
      this.recipientPhone = String(data.recipientPhone)
    if (data.reason !== undefined) this.reason = String(data.reason)
    if (data.reference !== undefined) this.reference = String(data.reference)
    if (data.expectedReturnDate !== undefined)
      this.expectedReturnDate = new Date(data.expectedReturnDate as string)
    if (data.notes !== undefined) this.notes = String(data.notes)
    if (data.authorizedBy !== undefined)
      this.authorizedBy = String(data.authorizedBy)
    this.items = Array.isArray(data.items)
      ? (data.items as Record<string, unknown>[]).map(
          (i) => new CreateExitNoteItemDTO(i)
        )
      : []
  }
}

export class UpdateExitNoteDTO {
  recipientName?: string
  recipientId?: string
  recipientPhone?: string
  reason?: string
  reference?: string
  notes?: string
  expectedReturnDate?: Date
  items?: CreateExitNoteItemDTO[]

  constructor(data: Record<string, unknown>) {
    if (data.recipientName !== undefined)
      this.recipientName = String(data.recipientName)
    if (data.recipientId !== undefined)
      this.recipientId = String(data.recipientId)
    if (data.recipientPhone !== undefined)
      this.recipientPhone = String(data.recipientPhone)
    if (data.reason !== undefined) this.reason = String(data.reason)
    if (data.reference !== undefined) this.reference = String(data.reference)
    if (data.notes !== undefined) this.notes = String(data.notes)
    if (data.expectedReturnDate !== undefined)
      this.expectedReturnDate = new Date(data.expectedReturnDate as string)
    if (Array.isArray(data.items)) {
      this.items = (data.items as Record<string, unknown>[]).map(
        (i) => new CreateExitNoteItemDTO(i)
      )
    }
  }
}

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
    this.items = data.items ?? []
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    // Optional fields — only assign if present to satisfy exactOptionalPropertyTypes
    if (data.preInvoiceId !== undefined) this.preInvoiceId = data.preInvoiceId
    if (data.recipientName !== undefined)
      this.recipientName = data.recipientName
    if (data.recipientId !== undefined) this.recipientId = data.recipientId
    if (data.recipientPhone !== undefined)
      this.recipientPhone = data.recipientPhone
    if (data.reason !== undefined) this.reason = data.reason
    if (data.reference !== undefined) this.reference = data.reference
    if (data.expectedReturnDate !== undefined)
      this.expectedReturnDate = data.expectedReturnDate
    if (data.returnedAt !== undefined) this.returnedAt = data.returnedAt
    if (data.notes !== undefined) this.notes = data.notes
    if (data.reservedAt !== undefined) this.reservedAt = data.reservedAt
    if (data.preparedAt !== undefined) this.preparedAt = data.preparedAt
    if (data.deliveredAt !== undefined) this.deliveredAt = data.deliveredAt
    if (data.preparedBy !== undefined) this.preparedBy = data.preparedBy
    if (data.deliveredBy !== undefined) this.deliveredBy = data.deliveredBy
    if (data.authorizedBy !== undefined) this.authorizedBy = data.authorizedBy
  }
}
