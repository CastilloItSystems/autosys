// backend/src/features/finance/supplierPayments/supplierPayments.dto.ts

import { ICreateSupplierPaymentInput } from './supplierPayments.interface.js'

type AnyRecord = Record<string, unknown>
const asRecord = (value: unknown): AnyRecord =>
  value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as AnyRecord)
    : {}

export class CreateSupplierPaymentDTO implements ICreateSupplierPaymentInput {
  supplierId?: string
  supplierBillId?: string
  expenseId?: string
  bankAccountId: string
  method: any
  amount: number
  currency: string
  exchangeRate?: number
  igtfApplies?: boolean
  details?: any
  reference?: string
  notes?: string
  processedByName?: string | null

  constructor(data: unknown) {
    const r = asRecord(data)
    if (r.supplierId) this.supplierId = String(r.supplierId)
    if (r.supplierBillId) this.supplierBillId = String(r.supplierBillId)
    if (r.expenseId) this.expenseId = String(r.expenseId)
    this.bankAccountId = String(r.bankAccountId ?? '')
    this.method = r.method
    this.amount = Number(r.amount ?? 0)
    this.currency = String(r.currency ?? 'USD')
    if (r.exchangeRate != null) this.exchangeRate = Number(r.exchangeRate)
    this.igtfApplies = Boolean(r.igtfApplies ?? false)
    if (r.details) this.details = r.details
    if (r.reference) this.reference = String(r.reference)
    if (r.notes) this.notes = String(r.notes)
  }
}
