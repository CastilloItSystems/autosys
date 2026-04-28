// backend/src/features/finance/bankAccounts/bankAccounts.interface.ts

export type BankAccountType = 'CHECKING' | 'SAVINGS' | 'CASH' | 'CRYPTO'
export type BankAccountCurrency = 'USD' | 'VES' | 'EUR'

export interface IBankAccount {
  id: string
  name: string
  type: BankAccountType
  bankName?: string | null
  accountNumber?: string | null
  currency: BankAccountCurrency
  initialBalance: number
  currentBalance: number
  isActive: boolean
  notes?: string | null
  empresaId: string
  createdAt: Date
  updatedAt: Date
}

export interface ICreateBankAccountInput {
  name: string
  type: BankAccountType
  bankName?: string
  accountNumber?: string
  currency: BankAccountCurrency
  initialBalance?: number
  notes?: string
}

export interface IUpdateBankAccountInput {
  name?: string
  type?: BankAccountType
  bankName?: string
  accountNumber?: string
  currency?: BankAccountCurrency
  isActive?: boolean
  notes?: string
}

export interface IBankAccountFilters {
  isActive?: boolean
  currency?: BankAccountCurrency
  type?: BankAccountType
  search?: string
  page?: number
  limit?: number
}
