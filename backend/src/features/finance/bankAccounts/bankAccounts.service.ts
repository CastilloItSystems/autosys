// backend/src/features/finance/bankAccounts/bankAccounts.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'

function paginate<T>(data: T[], total: number, page: number, limit: number) {
  return { data, total, page, limit }
}
import { NotFoundError, ConflictError, BadRequestError } from '../../../shared/utils/apiError.js'
import {
  ICreateBankAccountInput,
  IUpdateBankAccountInput,
  IBankAccountFilters,
} from './bankAccounts.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

class BankAccountService {
  private db: PrismaClientType

  constructor(db: PrismaClientType) {
    this.db = db
  }

  async findAll(empresaId: string, filters: IBankAccountFilters = {}) {
    const { isActive, currency, type, search, page = 1, limit = 20 } = filters
    const where: Prisma.BankAccountWhereInput = { empresaId }

    if (isActive !== undefined) where.isActive = isActive
    if (currency) where.currency = currency as any
    if (type) where.type = type as any
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { bankName: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    const db = this.db as PrismaClient
    const [total, data] = await Promise.all([
      db.bankAccount.count({ where }),
      db.bankAccount.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return paginate(data, total, page, limit)
  }

  async findById(empresaId: string, id: string) {
    const db = this.db as PrismaClient
    const account = await db.bankAccount.findFirst({ where: { id, empresaId } })
    if (!account) throw new NotFoundError('Cuenta bancaria no encontrada')
    return account
  }

  async create(empresaId: string, input: ICreateBankAccountInput) {
    const db = this.db as PrismaClient

    const existing = await db.bankAccount.findUnique({
      where: { empresaId_name: { empresaId, name: input.name } },
    })
    if (existing) throw new ConflictError(`Ya existe una cuenta con el nombre "${input.name}"`)

    return db.bankAccount.create({
      data: {
        ...input,
        currency: input.currency as any,
        type: input.type as any,
        initialBalance: input.initialBalance ?? 0,
        currentBalance: input.initialBalance ?? 0,
        empresaId,
      },
    })
  }

  async update(empresaId: string, id: string, input: IUpdateBankAccountInput) {
    await this.findById(empresaId, id)
    const db = this.db as PrismaClient

    if (input.name) {
      const conflict = await db.bankAccount.findFirst({
        where: { empresaId, name: input.name, id: { not: id } },
      })
      if (conflict) throw new ConflictError(`Ya existe una cuenta con el nombre "${input.name}"`)
    }

    return db.bankAccount.update({
      where: { id },
      data: input as any,
    })
  }

  async syncAllBalances(empresaId: string): Promise<number> {
    const db = this.db as PrismaClient
    const accounts = await db.bankAccount.findMany({
      where: { empresaId },
      select: { id: true, initialBalance: true, currency: true },
    })

    for (const account of accounts) {
      const agg = await db.cashTransaction.aggregate({
        where: { bankAccountId: account.id, empresaId, currency: account.currency as any },
        _sum: { amount: true },
      })
      const newBalance = Number(account.initialBalance) + Number(agg._sum.amount ?? 0)
      await db.bankAccount.update({
        where: { id: account.id },
        data: { currentBalance: newBalance },
      })
    }

    return accounts.length
  }

  async getBalance(empresaId: string, id: string) {
    const account = await this.findById(empresaId, id)
    const db = this.db as PrismaClient

    const [income, outcome] = await Promise.all([
      db.cashTransaction.aggregate({
        where: { bankAccountId: id, empresaId, type: 'INCOME', currency: account.currency as any },
        _sum: { amount: true },
      }),
      db.cashTransaction.aggregate({
        where: { bankAccountId: id, empresaId, type: { in: ['OUTCOME', 'TRANSFER_OUT'] }, currency: account.currency as any },
        _sum: { amount: true },
      }),
    ])

    const totalIn = Number(income._sum.amount ?? 0)
    const totalOut = Number(outcome._sum.amount ?? 0) // stored as negative values
    const balance = Number(account.initialBalance) + totalIn + totalOut

    return { account, balance, totalIn, totalOut }
  }
}

export default BankAccountService
