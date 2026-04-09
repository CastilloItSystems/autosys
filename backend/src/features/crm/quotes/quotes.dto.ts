// backend/src/features/crm/quotes/quotes.dto.ts

export class CreateQuoteItemDTO {
  description: string = ''
  quantity: number = 1
  unitPrice: number = 0
  discountPct?: number
  taxPct?: number
  itemId?: string
  notes?: string
}

export class CreateQuoteDTO {
  title: string = ''
  type: string = ''
  customerId: string = ''
  leadId?: string
  description?: string
  currency?: string
  discountPct?: number
  taxPct?: number
  validUntil?: string
  paymentTerms?: string
  deliveryTerms?: string
  notes?: string
  assignedTo?: string
  items?: CreateQuoteItemDTO[]

  constructor(body: any) {
    Object.assign(this, body)
  }
}

export class UpdateQuoteDTO {
  title?: string
  leadId?: string
  description?: string
  currency?: string
  discountPct?: number
  taxPct?: number
  validUntil?: string
  paymentTerms?: string
  deliveryTerms?: string
  notes?: string
  assignedTo?: string
  items?: CreateQuoteItemDTO[]

  constructor(body: any) {
    Object.assign(this, body)
  }
}

export class UpdateQuoteStatusDTO {
  status: string = ''
  notes?: string

  constructor(body: any) {
    Object.assign(this, body)
  }
}
