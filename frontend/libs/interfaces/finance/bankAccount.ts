// frontend/libs/interfaces/finance/bankAccount.ts

export type BankAccountType = 'CHECKING' | 'SAVINGS' | 'CASH' | 'CRYPTO'
export type BankAccountCurrency = 'USD' | 'VES' | 'EUR'

export interface BankAccount {
  id: string
  name: string
  type: BankAccountType
  bankName: string | null
  accountNumber: string | null
  currency: BankAccountCurrency
  initialBalance: number
  currentBalance: number
  isActive: boolean
  notes: string | null
  empresaId: string
  createdAt: string
  updatedAt: string
}

export interface BankAccountBalance {
  account: BankAccount
  balance: number
  totalIn: number
  totalOut: number
}

export interface CreateBankAccountData {
  name: string
  type: BankAccountType
  bankName?: string
  accountNumber?: string
  currency: BankAccountCurrency
  initialBalance?: number
  notes?: string
}

export interface UpdateBankAccountData {
  name?: string
  type?: BankAccountType
  bankName?: string
  accountNumber?: string
  isActive?: boolean
  notes?: string
}
