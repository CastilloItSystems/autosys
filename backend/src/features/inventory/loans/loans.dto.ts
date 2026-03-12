/**
 * Loans Module DTOs
 */

import {
  ICreateLoanInput,
  IUpdateLoanInput,
  IReturnLoanInput,
  ILoanResponseDTO,
  LoanStatus,
} from './loans.interface.js'

export class CreateLoanDTO implements ICreateLoanInput {
  borrowerName: string
  borrowerId?: string
  warehouseId: string
  dueDate: Date
  purpose?: string
  notes?: string
  items: Array<{ itemId: string; quantityLoaned: number; notes?: string }>

  constructor(data: any) {
    this.borrowerName = data.borrowerName
    this.borrowerId = data.borrowerId || undefined
    this.warehouseId = data.warehouseId
    this.dueDate = new Date(data.dueDate)
    this.purpose = data.purpose || undefined
    this.notes = data.notes || undefined
    this.items = data.items || []
  }
}

export class UpdateLoanDTO implements IUpdateLoanInput {
  borrowerName?: string
  dueDate?: Date
  purpose?: string
  notes?: string

  constructor(data: any) {
    this.borrowerName = data.borrowerName || undefined
    this.dueDate = data.dueDate ? new Date(data.dueDate) : undefined
    this.purpose = data.purpose || undefined
    this.notes = data.notes || undefined
  }
}

export class ApproveLoanDTO {
  approvalNotes?: string

  constructor(data: any) {
    this.approvalNotes = data.approvalNotes || undefined
  }
}

export class ReturnLoanDTO implements IReturnLoanInput {
  items: Array<{ itemId: string; quantityReturned: number }>
  returnNotes?: string

  constructor(data: any) {
    this.items = data.items || []
    this.returnNotes = data.returnNotes || undefined
  }
}

export class LoanResponseDTO implements ILoanResponseDTO {
  id: string
  loanNumber: string
  borrowerName: string
  borrowerId?: string
  warehouseId: string
  status: LoanStatus
  items: Array<{
    itemId: string
    quantityLoaned: number
    quantityReturned: number
  }>
  startDate: Date
  dueDate: Date
  returnedAt?: Date
  daysOverdue?: number
  purpose?: string
  notes?: string
  approvedBy?: string
  approvedAt?: Date
  createdBy: string
  createdAt: Date
  updatedAt: Date

  constructor(data: any) {
    this.id = data.id
    this.loanNumber = data.loanNumber
    this.borrowerName = data.borrowerName
    this.borrowerId = data.borrowerId
    this.warehouseId = data.warehouseId
    this.status = data.status
    this.items = (data.items || []).map((item: any) => ({
      itemId: item.itemId,
      quantityLoaned: item.quantityLoaned,
      quantityReturned: item.quantityReturned,
    }))
    this.startDate = data.startDate
    this.dueDate = data.dueDate
    this.returnedAt = data.returnedAt
    this.purpose = data.purpose
    this.notes = data.notes
    this.approvedBy = data.approvedBy
    this.approvedAt = data.approvedAt
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt

    // Calculate days overdue if applicable
    if (data.status === 'OVERDUE' || data.status === 'ACTIVE') {
      const now = new Date()
      if (now > new Date(data.dueDate)) {
        this.daysOverdue = Math.floor(
          (now.getTime() - new Date(data.dueDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      }
    }
  }

  static fromEntity(data: any): LoanResponseDTO {
    return new LoanResponseDTO(data)
  }
}

export class LoanWithItemsDTO extends LoanResponseDTO {
  items: Array<{
    itemId: string
    itemName: string
    itemSku: string
    quantityLoaned: number
    quantityReturned: number
    unitCost?: number
    notes?: string
  }>

  constructor(data: any) {
    super(data)
    this.items = (data.items || []).map((item: any) => ({
      itemId: item.itemId,
      itemName: item.item?.name || 'N/A',
      itemSku: item.item?.sku || 'N/A',
      quantityLoaned: item.quantityLoaned,
      quantityReturned: item.quantityReturned,
      unitCost: item.unitCost,
      notes: item.notes,
    }))
  }

  static fromEntity(data: any): LoanWithItemsDTO {
    return new LoanWithItemsDTO(data)
  }
}
