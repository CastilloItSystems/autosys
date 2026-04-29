// frontend/libs/interfaces/finance/expense.ts

export type ExpenseCategory =
  | 'UTILITIES' | 'RENT' | 'PAYROLL' | 'SERVICES' | 'MAINTENANCE'
  | 'SUPPLIES' | 'MARKETING' | 'TAXES' | 'BANK_FEES' | 'TRANSPORT' | 'OTHER'

export type ExpenseStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED'
export type RecurringFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  UTILITIES: 'Servicios (Internet, luz, agua)',
  RENT: 'Alquiler',
  PAYROLL: 'Nómina / Honorarios',
  SERVICES: 'Servicios profesionales',
  MAINTENANCE: 'Mantenimiento',
  SUPPLIES: 'Insumos de oficina',
  MARKETING: 'Marketing',
  TAXES: 'Impuestos',
  BANK_FEES: 'Comisiones bancarias',
  TRANSPORT: 'Transporte',
  OTHER: 'Otros',
}

export interface Expense {
  id: string
  expenseNumber: string
  category: ExpenseCategory
  status: ExpenseStatus
  description: string
  supplierId: string | null
  supplier?: { id: string; name: string } | null
  bankAccountId: string | null
  bankAccount?: { id: string; name: string } | null
  currency: string
  exchangeRate: number | null
  amount: number
  taxAmount: number
  total: number
  paidAmount: number
  pendingAmount: number
  expenseDate: string
  attachmentUrl: string | null
  isRecurring: boolean
  recurringRuleId: string | null
  recurringRule?: { id: string; name: string; frequency: RecurringFrequency } | null
  notes: string | null
  empresaId: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseRecurringRule {
  id: string
  name: string
  category: ExpenseCategory
  description: string
  supplierId: string | null
  supplier?: { id: string; name: string } | null
  amount: number
  currency: string
  frequency: RecurringFrequency
  dayOfMonth: number | null
  startDate: string
  endDate: string | null
  nextRunDate: string
  isActive: boolean
  empresaId: string
  createdAt: string
  updatedAt: string
}

export interface CreateExpenseData {
  category: ExpenseCategory
  description: string
  supplierId?: string
  bankAccountId?: string
  currency: string
  exchangeRate?: number
  amount: number
  taxAmount?: number
  expenseDate: string
  notes?: string
}

export interface CreateRecurringRuleData {
  name: string
  category: ExpenseCategory
  description: string
  supplierId?: string
  amount: number
  currency: string
  frequency: RecurringFrequency
  dayOfMonth?: number
  startDate: string
  endDate?: string
}
