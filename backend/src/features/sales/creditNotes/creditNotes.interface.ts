// backend/src/features/sales/creditNotes/creditNotes.interface.ts

export enum CreditNoteStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
}

export interface ICreditNoteItem {
  id: string
  creditNoteId: string
  itemId?: string | null
  itemName?: string | null
  quantity: number
  unitPrice: number
  discountPercent: number
  discountAmount: number
  taxType: string
  taxRate: number
  taxAmount: number
  subtotal: number
  totalLine: number
  item?: { id: string; name: string; code: string } | null
  createdAt: Date
}

export interface ICreditNote {
  id: string
  creditNoteNumber: string
  status: CreditNoteStatus
  empresaId: string
  invoiceId: string
  customerId: string
  reason: string
  currency: string
  exchangeRate?: number | null
  discountAmount: number
  subtotalBruto: number
  baseImponible: number
  baseExenta: number
  taxAmount: number
  taxRate: number
  igtfApplies: boolean
  igtfRate: number
  igtfAmount: number
  total: number
  notes?: string | null
  issuedBy?: string | null
  issuedAt?: Date | null
  cancelledAt?: Date | null
  cancelledBy?: string | null
  cancellationReason?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ICreditNoteWithRelations extends ICreditNote {
  items?: ICreditNoteItem[]
  invoice?: unknown
  customer?: unknown
}

export interface ICreateCreditNoteItemInput {
  itemId?: string
  itemName?: string
  quantity: number
  unitPrice: number
  discountPercent?: number
  discountAmount?: number
  taxType?: 'IVA' | 'EXEMPT' | 'REDUCED'
  taxRate?: number
  taxAmount: number
  subtotal: number
  totalLine: number
}

export interface ICreateCreditNoteInput {
  invoiceId: string
  reason: string
  currency?: string
  exchangeRate?: number
  discountAmount?: number
  subtotalBruto: number
  baseImponible?: number
  baseExenta?: number
  taxAmount: number
  taxRate?: number
  igtfApplies?: boolean
  igtfRate?: number
  igtfAmount?: number
  total: number
  notes?: string
  items: ICreateCreditNoteItemInput[]
}

export interface ICreditNoteFilters {
  status?: CreditNoteStatus
  invoiceId?: string
  customerId?: string
  from?: string
  to?: string
}
