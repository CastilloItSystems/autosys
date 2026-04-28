// backend/src/features/finance/expenses/expenses.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'

function paginate<T>(data: T[], total: number, page: number, limit: number) {
  return { data, total, page, limit }
}
import { NotFoundError, BadRequestError } from '../../../shared/utils/apiError.js'
import {
  ICreateExpenseInput,
  IUpdateExpenseInput,
  IExpenseFilters,
  ICreateRecurringRuleInput,
} from './expenses.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const EXPENSE_INCLUDE = {
  supplier: { select: { id: true, name: true } },
  bankAccount: { select: { id: true, name: true } },
  recurringRule: { select: { id: true, name: true, frequency: true } },
} as const

function generateExpenseNumber(): string {
  const year = new Date().getFullYear()
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `EXP-${year}-${ts}${rnd}`
}

function computeNextRunDate(
  frequency: string,
  dayOfMonth: number | null | undefined,
  from: Date
): Date {
  const next = new Date(from)
  switch (frequency) {
    case 'WEEKLY':
      next.setDate(next.getDate() + 7)
      break
    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14)
      break
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1)
      if (dayOfMonth) next.setDate(Math.min(dayOfMonth, 28))
      break
    case 'QUARTERLY':
      next.setMonth(next.getMonth() + 3)
      break
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1)
      break
  }
  return next
}

class ExpenseService {
  private db: PrismaClientType

  constructor(db: PrismaClientType) {
    this.db = db
  }

  async findAll(empresaId: string, filters: IExpenseFilters = {}) {
    const { status, category, supplierId, isRecurring, from, to, search, page = 1, limit = 20 } = filters
    const where: Prisma.ExpenseWhereInput = { empresaId }

    if (status) where.status = status
    if (category) where.category = category
    if (supplierId) where.supplierId = supplierId
    if (isRecurring !== undefined) where.isRecurring = isRecurring
    if (from || to) {
      where.expenseDate = {}
      if (from) where.expenseDate.gte = new Date(from)
      if (to) where.expenseDate.lte = new Date(to)
    }
    if (search) {
      where.OR = [
        { expenseNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const db = this.db as PrismaClient
    const [total, data] = await Promise.all([
      db.expense.count({ where }),
      db.expense.findMany({
        where,
        include: EXPENSE_INCLUDE,
        orderBy: { expenseDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return paginate(data, total, page, limit)
  }

  async findById(empresaId: string, id: string) {
    const db = this.db as PrismaClient
    const expense = await db.expense.findFirst({ where: { id, empresaId }, include: EXPENSE_INCLUDE })
    if (!expense) throw new NotFoundError('Gasto no encontrado')
    return expense
  }

  async create(empresaId: string, input: ICreateExpenseInput) {
    const db = this.db as PrismaClient
    const total = Number(input.amount) + Number(input.taxAmount ?? 0)

    return db.expense.create({
      data: {
        expenseNumber: generateExpenseNumber(),
        category: input.category as any,
        status: 'PENDING',
        description: input.description,
        supplierId: input.supplierId ?? null,
        bankAccountId: input.bankAccountId ?? null,
        currency: input.currency as any,
        exchangeRate: input.exchangeRate ?? null,
        amount: input.amount,
        taxAmount: input.taxAmount ?? 0,
        total,
        paidAmount: 0,
        pendingAmount: total,
        expenseDate: new Date(input.expenseDate),
        attachmentUrl: input.attachmentUrl ?? null,
        isRecurring: input.isRecurring ?? false,
        recurringRuleId: input.recurringRuleId ?? null,
        notes: input.notes ?? null,
        empresaId,
      },
      include: EXPENSE_INCLUDE,
    })
  }

  async update(empresaId: string, id: string, input: IUpdateExpenseInput) {
    const expense = await this.findById(empresaId, id)
    if (expense.status === 'PAID') throw new BadRequestError('No se puede modificar un gasto pagado')
    if (expense.status === 'CANCELLED') throw new BadRequestError('No se puede modificar un gasto cancelado')

    const db = this.db as PrismaClient
    const newAmount = input.amount != null ? Number(input.amount) : Number(expense.amount)
    const newTax = input.taxAmount != null ? Number(input.taxAmount) : Number(expense.taxAmount)
    const newTotal = newAmount + newTax

    return db.expense.update({
      where: { id },
      data: {
        ...input,
        category: (input.category as any) ?? undefined,
        currency: (input.currency as any) ?? undefined,
        expenseDate: input.expenseDate ? new Date(input.expenseDate) : undefined,
        total: newTotal,
        pendingAmount: newTotal - Number(expense.paidAmount),
      } as any,
      include: EXPENSE_INCLUDE,
    })
  }

  async cancel(empresaId: string, id: string) {
    const expense = await this.findById(empresaId, id)
    if (expense.status === 'PAID') throw new BadRequestError('No se puede cancelar un gasto pagado')
    if (expense.status === 'CANCELLED') throw new BadRequestError('El gasto ya está cancelado')

    const db = this.db as PrismaClient
    return db.expense.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: EXPENSE_INCLUDE,
    })
  }

  // ── Reglas recurrentes ────────────────────────────────────────────────────

  async findAllRules(empresaId: string, page = 1, limit = 20) {
    const db = this.db as PrismaClient
    const where: Prisma.ExpenseRecurringRuleWhereInput = { empresaId }
    const [total, data] = await Promise.all([
      db.expenseRecurringRule.count({ where }),
      db.expenseRecurringRule.findMany({
        where,
        include: { supplier: { select: { id: true, name: true } } },
        orderBy: { nextRunDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])
    return paginate(data, total, page, limit)
  }

  async createRule(empresaId: string, input: ICreateRecurringRuleInput) {
    const db = this.db as PrismaClient
    const startDate = new Date(input.startDate)
    const nextRunDate = computeNextRunDate(input.frequency, input.dayOfMonth, startDate)

    return db.expenseRecurringRule.create({
      data: {
        name: input.name,
        category: input.category as any,
        description: input.description,
        supplierId: input.supplierId ?? null,
        amount: input.amount,
        currency: input.currency as any,
        frequency: input.frequency as any,
        dayOfMonth: input.dayOfMonth ?? null,
        startDate,
        endDate: input.endDate ? new Date(input.endDate) : null,
        nextRunDate,
        isActive: true,
        empresaId,
      },
      include: { supplier: { select: { id: true, name: true } } },
    })
  }

  async updateRule(empresaId: string, id: string, input: Partial<ICreateRecurringRuleInput> & { isActive?: boolean }) {
    const db = this.db as PrismaClient
    const rule = await db.expenseRecurringRule.findFirst({ where: { id, empresaId } })
    if (!rule) throw new NotFoundError('Regla recurrente no encontrada')

    return db.expenseRecurringRule.update({
      where: { id },
      data: {
        ...input,
        category: (input.category as any) ?? undefined,
        currency: (input.currency as any) ?? undefined,
        frequency: (input.frequency as any) ?? undefined,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      } as any,
      include: { supplier: { select: { id: true, name: true } } },
    })
  }

  async generateRecurring(empresaId?: string): Promise<number> {
    const db = this.db as PrismaClient
    const now = new Date()

    const where: Prisma.ExpenseRecurringRuleWhereInput = {
      isActive: true,
      nextRunDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    }
    if (empresaId) where.empresaId = empresaId

    const rules = await db.expenseRecurringRule.findMany({ where })
    let count = 0

    for (const rule of rules) {
      const total = Number(rule.amount)
      await db.expense.create({
        data: {
          expenseNumber: generateExpenseNumber(),
          category: rule.category,
          status: 'PENDING',
          description: rule.description,
          supplierId: rule.supplierId,
          currency: rule.currency,
          amount: Number(rule.amount),
          taxAmount: 0,
          total,
          paidAmount: 0,
          pendingAmount: total,
          expenseDate: now,
          isRecurring: true,
          recurringRuleId: rule.id,
          empresaId: rule.empresaId,
        },
      })

      const nextRunDate = computeNextRunDate(rule.frequency, rule.dayOfMonth, rule.nextRunDate)
      await db.expenseRecurringRule.update({
        where: { id: rule.id },
        data: { nextRunDate },
      })
      count++
    }

    return count
  }
}

export default ExpenseService
