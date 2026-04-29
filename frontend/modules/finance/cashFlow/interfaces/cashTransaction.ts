// frontend/libs/interfaces/finance/cashTransaction.ts

export type CashTransactionType = 'INCOME' | 'OUTCOME' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT'
export type CashTransactionSource = 'SALES_PAYMENT' | 'SUPPLIER_PAYMENT' | 'EXPENSE' | 'MANUAL' | 'TRANSFER'

export interface CashTransaction {
  id: string
  bankAccountId: string
  bankAccount?: { id: string; name: string; currency: string }
  type: CashTransactionType
  source: CashTransactionSource
  sourceId: string | null
  amount: number
  currency: string
  exchangeRate: number | null
  description: string
  transactionDate: string
  runningBalance?: number
  empresaId: string
  createdAt: string
}

export interface CashFlowCurrencySummary {
  currency: string
  totalIncome: number
  totalOutcome: number
  netFlow: number
}

export interface CashFlowSummary {
  perCurrency: (CashFlowCurrencySummary & { avgRate: number })[]
  unified: CashFlowCurrencySummary | null
  bySource: Array<{
    source: CashTransactionSource
    _sum: { amount: number | null }
    _count: number
  }>
}
