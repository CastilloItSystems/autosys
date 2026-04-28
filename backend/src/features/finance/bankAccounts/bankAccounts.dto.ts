// backend/src/features/finance/bankAccounts/bankAccounts.dto.ts

import { IBankAccount, ICreateBankAccountInput, IUpdateBankAccountInput } from './bankAccounts.interface.js'

type AnyRecord = Record<string, unknown>
const asRecord = (value: unknown): AnyRecord =>
  value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as AnyRecord)
    : {}

export class CreateBankAccountDTO implements ICreateBankAccountInput {
  name: string
  type: any
  bankName?: string
  accountNumber?: string
  currency: any
  initialBalance?: number
  notes?: string

  constructor(data: unknown) {
    const r = asRecord(data)
    this.name = String(r.name ?? '')
    this.type = r.type
    this.bankName = r.bankName != null ? String(r.bankName) : undefined
    this.accountNumber = r.accountNumber != null ? String(r.accountNumber) : undefined
    this.currency = r.currency
    this.initialBalance = r.initialBalance != null ? Number(r.initialBalance) : 0
    this.notes = r.notes != null ? String(r.notes) : undefined
  }
}

export class UpdateBankAccountDTO implements IUpdateBankAccountInput {
  name?: string
  type?: any
  bankName?: string
  accountNumber?: string
  currency?: any
  isActive?: boolean
  notes?: string

  constructor(data: unknown) {
    const r = asRecord(data)
    if (r.name != null) this.name = String(r.name)
    if (r.type != null) this.type = r.type
    if ('bankName' in r) this.bankName = r.bankName != null ? String(r.bankName) : undefined
    if ('accountNumber' in r) this.accountNumber = r.accountNumber != null ? String(r.accountNumber) : undefined
    if (r.currency != null) this.currency = r.currency
    if (r.isActive != null) this.isActive = Boolean(r.isActive)
    if ('notes' in r) this.notes = r.notes != null ? String(r.notes) : undefined
  }
}

export class BankAccountResponseDTO {
  id: string
  name: string
  type: string
  bankName: string | null
  accountNumber: string | null
  currency: string
  initialBalance: number
  currentBalance: number
  isActive: boolean
  notes: string | null
  empresaId: string
  createdAt: Date
  updatedAt: Date

  constructor(data: IBankAccount) {
    this.id = data.id
    this.name = data.name
    this.type = data.type
    this.bankName = data.bankName ?? null
    this.accountNumber = data.accountNumber ?? null
    this.currency = data.currency
    this.initialBalance = Number(data.initialBalance)
    this.currentBalance = Number(data.currentBalance)
    this.isActive = data.isActive
    this.notes = data.notes ?? null
    this.empresaId = data.empresaId
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
