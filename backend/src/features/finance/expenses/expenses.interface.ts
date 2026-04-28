// backend/src/features/finance/expenses/expenses.interface.ts

export type ExpenseCategory =
  | 'UTILITIES' | 'RENT' | 'PAYROLL' | 'SERVICES' | 'MAINTENANCE'
  | 'SUPPLIES' | 'MARKETING' | 'TAXES' | 'BANK_FEES' | 'TRANSPORT' | 'OTHER'

export type ExpenseStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED'
export type RecurringFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'

export interface IExpense {
  id: string
  expenseNumber: string
  category: ExpenseCategory
  status: ExpenseStatus
  description: string
  supplierId?: string | null
  bankAccountId?: string | null
  currency: string
  exchangeRate?: number | null
  amount: number
  taxAmount: number
  total: number
  paidAmount: number
  pendingAmount: number
  expenseDate: Date
  attachmentUrl?: string | null
  isRecurring: boolean
  recurringRuleId?: string | null
  notes?: string | null
  empresaId: string
  createdAt: Date
  updatedAt: Date
}

export interface ICreateExpenseInput {
  category: ExpenseCategory
  description: string
  supplierId?: string
  bankAccountId?: string
  currency: string
  exchangeRate?: number
  amount: number
  taxAmount?: number
  expenseDate: Date | string
  attachmentUrl?: string
  isRecurring?: boolean
  recurringRuleId?: string
  notes?: string
}

export interface IUpdateExpenseInput {
  category?: ExpenseCategory
  description?: string
  supplierId?: string
  currency?: string
  exchangeRate?: number
  amount?: number
  taxAmount?: number
  expenseDate?: Date | string
  attachmentUrl?: string
  notes?: string
}

export interface IExpenseFilters {
  status?: ExpenseStatus
  category?: ExpenseCategory
  supplierId?: string
  isRecurring?: boolean
  from?: string
  to?: string
  search?: string
  page?: number
  limit?: number
}

export interface ICreateRecurringRuleInput {
  name: string
  category: ExpenseCategory
  description: string
  supplierId?: string
  amount: number
  currency: string
  frequency: RecurringFrequency
  dayOfMonth?: number
  startDate: Date | string
  endDate?: Date | string
}
