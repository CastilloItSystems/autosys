// backend/src/features/finance/cashTransactions/cashTransactions.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { recalculateBankBalance } from '../shared/recalculateBankBalance.js'
import { BadRequestError } from '../../../shared/utils/apiError.js'

function paginate<T>(data: T[], total: number, page: number, limit: number) {
  return { data, total, page, limit }
}

type PrismaClientType = PrismaClient | Prisma.TransactionClient

class CashTransactionService {
  private db: PrismaClientType

  constructor(db: PrismaClientType) {
    this.db = db
  }

  async findAll(empresaId: string, filters: {
    bankAccountId?: string
    from?: string
    to?: string
    source?: string
    type?: string
    page?: number
    limit?: number
  } = {}) {
    const { bankAccountId, from, to, source, type, page = 1, limit = 50 } = filters
    const where: Prisma.CashTransactionWhereInput = { empresaId }

    if (bankAccountId) where.bankAccountId = bankAccountId
    if (source) where.source = source as any
    if (type) where.type = type as any
    if (from || to) {
      where.transactionDate = {}
      if (from) where.transactionDate.gte = new Date(from + 'T00:00:00.000Z')
      if (to) where.transactionDate.lte = new Date(to + 'T23:59:59.999Z')
    }

    const db = this.db as PrismaClient
    const [total, data] = await Promise.all([
      db.cashTransaction.count({ where }),
      db.cashTransaction.findMany({
        where,
        include: { bankAccount: { select: { id: true, name: true, currency: true } } },
        orderBy: { transactionDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    // Compute opening balance for the current page
    let openingBalance = 0
    if (bankAccountId) {
      const account = await db.bankAccount.findUnique({
        where: { id: bankAccountId },
        select: { initialBalance: true, currency: true },
      })
      if (account) {
        // Sum of ALL transactions newer than those in this page (i.e., transactions we skipped)
        // + transactions before the date range, if any
        const priorWhere: Prisma.CashTransactionWhereInput = {
          bankAccountId,
          empresaId,
          currency: account.currency as any,
        }
        // Before date-range
        if (from) {
          priorWhere.transactionDate = { lt: new Date(from + 'T00:00:00.000Z') }
          const preRange = await db.cashTransaction.aggregate({
            where: priorWhere,
            _sum: { amount: true },
          })
          openingBalance = Number(account.initialBalance) + Number(preRange._sum.amount ?? 0)
        } else {
          openingBalance = Number(account.initialBalance)
        }
        // Skip offset: sum of in-range transactions AFTER current page (more recent)
        if (page > 1 && data.length > 0) {
          // The oldest transaction in this page defines the boundary
          const oldestInPage = [...data].sort(
            (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
          )[0]
          const skipWhere: Prisma.CashTransactionWhereInput = {
            bankAccountId,
            empresaId,
            currency: account.currency as any,
            transactionDate: { gt: oldestInPage.transactionDate },
          }
          if (from) {
            (skipWhere.transactionDate as any).gte = new Date(from + 'T00:00:00.000Z')
          }
          if (to) {
            (skipWhere.transactionDate as any).lte = new Date(to + 'T23:59:59.999Z')
          }
          const skippedAgg = await db.cashTransaction.aggregate({
            where: skipWhere,
            _sum: { amount: true },
          })
          openingBalance += Number(skippedAgg._sum.amount ?? 0)
        }
      }
    }

    // Build running balance from oldest to newest starting at openingBalance
    const ordered = [...data].reverse()
    let runningBalance = openingBalance
    const withBalance = ordered.map((tx) => {
      runningBalance += Number(tx.amount)
      return { ...tx, runningBalance }
    })

    return paginate(withBalance.reverse(), total, page, limit)
  }

  async createTransfer(
    empresaId: string,
    input: {
      fromAccountId: string
      toAccountId: string
      amount: number
      currency: string
      exchangeRate?: number
      description?: string
    }
  ) {
    const db = this.db as PrismaClient

    const [fromAccount, toAccount] = await Promise.all([
      db.bankAccount.findFirst({ where: { id: input.fromAccountId, empresaId }, select: { id: true, currency: true, name: true } }),
      db.bankAccount.findFirst({ where: { id: input.toAccountId, empresaId }, select: { id: true, currency: true, name: true } }),
    ])
    if (!fromAccount) throw new BadRequestError('Cuenta origen no encontrada')
    if (!toAccount) throw new BadRequestError('Cuenta destino no encontrada')
    if (fromAccount.id === toAccount.id) throw new BadRequestError('Las cuentas origen y destino deben ser diferentes')

    const description = input.description?.trim() || `Transferencia de ${fromAccount.name} a ${toAccount.name}`

    return db.$transaction(async (tx) => {
      await (tx as any).cashTransaction.create({
        data: {
          bankAccountId: input.fromAccountId,
          type: 'TRANSFER_OUT',
          source: 'TRANSFER',
          amount: -Math.abs(input.amount),
          currency: fromAccount.currency as any,
          exchangeRate: input.exchangeRate ?? null,
          description,
          empresaId,
        },
      })

      // Compute amount in destination account's currency
      let toAmount = input.amount
      if (fromAccount.currency !== toAccount.currency) {
        const rate = Number(input.exchangeRate ?? 0)
        if (!rate || rate <= 0) throw new BadRequestError(`Se requiere tasa de cambio para transferir de ${fromAccount.currency} a ${toAccount.currency}`)
        if (fromAccount.currency === 'USD' && toAccount.currency === 'VES') toAmount = input.amount * rate
        else if (fromAccount.currency === 'VES' && toAccount.currency === 'USD') toAmount = input.amount / rate
        else if (fromAccount.currency === 'EUR' && toAccount.currency === 'VES') toAmount = input.amount * rate
        else if (fromAccount.currency === 'VES' && toAccount.currency === 'EUR') toAmount = input.amount / rate
        else throw new BadRequestError(`Conversión de ${fromAccount.currency} a ${toAccount.currency} no soportada`)
      }

      await (tx as any).cashTransaction.create({
        data: {
          bankAccountId: input.toAccountId,
          type: 'TRANSFER_IN',
          source: 'TRANSFER',
          amount: Math.abs(toAmount),
          currency: toAccount.currency as any,
          exchangeRate: input.exchangeRate ?? null,
          description,
          empresaId,
        },
      })

      await recalculateBankBalance(tx, input.fromAccountId, empresaId)
      await recalculateBankBalance(tx, input.toAccountId, empresaId)

      return { fromAccountId: input.fromAccountId, toAccountId: input.toAccountId, amount: input.amount, toAmount }
    })
  }

  async createAdjustment(
    empresaId: string,
    input: {
      bankAccountId: string
      amount: number
      description: string
      exchangeRate?: number
    }
  ) {
    const db = this.db as PrismaClient
    const account = await db.bankAccount.findFirst({
      where: { id: input.bankAccountId, empresaId },
      select: { id: true, currency: true },
    })
    if (!account) throw new BadRequestError('Cuenta bancaria no encontrada')

    return db.$transaction(async (tx) => {
      const created = await (tx as any).cashTransaction.create({
        data: {
          bankAccountId: input.bankAccountId,
          type: 'ADJUSTMENT',
          source: 'MANUAL',
          amount: input.amount,
          currency: account.currency as any,
          exchangeRate: input.exchangeRate ?? null,
          description: input.description,
          empresaId,
        },
      })
      await recalculateBankBalance(tx, input.bankAccountId, empresaId)
      return created
    })
  }

  async getSummary(
    empresaId: string,
    bankAccountId?: string,
    from?: string,
    to?: string,
    convertTo?: string,
  ) {
    const db = this.db as PrismaClient
    const where: Prisma.CashTransactionWhereInput = { empresaId }
    if (bankAccountId) where.bankAccountId = bankAccountId
    if (from || to) {
      where.transactionDate = {}
      if (from) where.transactionDate.gte = new Date(from + 'T00:00:00.000Z')
      if (to) where.transactionDate.lte = new Date(to + 'T23:59:59.999Z')
    }

    const [byCurrencyRate, bySourceRaw] = await Promise.all([
      // avg exchange rate + sum per currency (for conversion)
      db.cashTransaction.groupBy({
        by: ['currency'],
        where,
        _sum: { amount: true },
        _avg: { exchangeRate: true },
      }),
      // Sumar por [source, currency] — no cruzar monedas en un mismo bucket
      db.cashTransaction.groupBy({
        by: ['source', 'currency'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ])

    // Re-agrupar bySource preservando breakdown por moneda
    const bySourceMap = new Map<
      string,
      {
        source: string
        count: number
        byCurrency: Record<string, number>
      }
    >()
    for (const r of bySourceRaw as any[]) {
      const src = r.source
      const cur = r.currency
      const agg =
        bySourceMap.get(src) ?? { source: src, count: 0, byCurrency: {} }
      agg.byCurrency[cur] = (agg.byCurrency[cur] ?? 0) + Number(r._sum.amount ?? 0)
      agg.count += r._count
      bySourceMap.set(src, agg)
    }
    const bySource = Array.from(bySourceMap.values())

    // Per-currency income/outcome
    const currencies = byCurrencyRate.map((r) => r.currency)
    const perCurrency = await Promise.all(
      currencies.map(async (currency) => {
        const currWhere = { ...where, currency }
        const avgRate = Number(byCurrencyRate.find((r) => r.currency === currency)?._avg.exchangeRate ?? 0)
        const [inc, out] = await Promise.all([
          db.cashTransaction.aggregate({ where: { ...currWhere, amount: { gt: 0 } }, _sum: { amount: true } }),
          db.cashTransaction.aggregate({ where: { ...currWhere, amount: { lt: 0 } }, _sum: { amount: true } }),
        ])
        const totalIncome = Number(inc._sum.amount ?? 0)
        const totalOutcome = Number(out._sum.amount ?? 0)
        return {
          currency,
          totalIncome,
          totalOutcome: Math.abs(totalOutcome),
          netFlow: totalIncome + totalOutcome,
          avgRate,
        }
      })
    )

    // Unified totals when convertTo is requested
    let unified: { currency: string; totalIncome: number; totalOutcome: number; netFlow: number } | null = null
    if (convertTo) {
      let unifiedIncome = 0
      let unifiedOutcome = 0
      for (const s of perCurrency) {
        const rate = s.avgRate
        const convert = (amount: number) => {
          if (s.currency === convertTo) return amount
          if (convertTo === 'USD' && s.currency === 'VES' && rate > 0) return amount / rate
          if (convertTo === 'VES' && s.currency === 'USD' && rate > 0) return amount * rate
          if (convertTo === 'USD' && s.currency === 'EUR' && rate > 0) return amount / rate
          if (convertTo === 'VES' && s.currency === 'EUR' && rate > 0) return amount * rate
          if (convertTo === 'EUR' && s.currency === 'VES' && rate > 0) return amount / rate
          // fallback: no rate available, skip conversion
          return amount
        }
        unifiedIncome += convert(s.totalIncome)
        unifiedOutcome += convert(s.totalOutcome)
      }
      unified = {
        currency: convertTo,
        totalIncome: Number(unifiedIncome.toFixed(2)),
        totalOutcome: Number(unifiedOutcome.toFixed(2)),
        netFlow: Number((unifiedIncome - unifiedOutcome).toFixed(2)),
      }
    }

    return { perCurrency, unified, bySource }
  }
}

export default CashTransactionService
