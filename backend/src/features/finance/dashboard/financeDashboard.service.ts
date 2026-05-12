// backend/src/features/finance/dashboard/financeDashboard.service.ts

import { PrismaClient } from '../../../generated/prisma/client.js'
import {
  buildFallbackRateMap,
  toUSD,
  type FallbackRateMap,
} from '../../../shared/utils/currency.js'

type Breakdown = Record<string, number>

function addBucket(b: Breakdown, cur: string, amt: number) {
  b[cur] = (b[cur] ?? 0) + amt
}

class FinanceDashboardService {
  private db: PrismaClient

  constructor(db: PrismaClient) {
    this.db = db
  }

  async getDashboard(empresaId: string) {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const in7Days = new Date(now)
    in7Days.setDate(in7Days.getDate() + 7)

    const sixMonthsAgo = new Date(now)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const fxRates = await buildFallbackRateMap(this.db, empresaId)

    const [
      bankAccounts,
      billsForStatus,
      overdueCount,
      dueSoonCount,
      monthExpenses,
      monthPayments,
      recentPayments,
      recentBills,
      arPendingPreInvoices,
      monthCollections,
      monthlyCashFlowRaw,
    ] = await Promise.all([
      this.db.bankAccount.findMany({
        where: { empresaId, isActive: true },
        select: { id: true, name: true, type: true, currency: true, currentBalance: true },
        orderBy: { currency: 'asc' },
      }),

      this.db.supplierBill.findMany({
        where: { empresaId },
        select: {
          status: true,
          currency: true,
          exchangeRate: true,
          total: true,
          pendingAmount: true,
        },
      }),

      this.db.supplierBill.count({
        where: {
          empresaId,
          status: { in: ['PENDING', 'PARTIAL'] },
          dueDate: { lt: now },
        },
      }),

      this.db.supplierBill.count({
        where: {
          empresaId,
          status: { in: ['PENDING', 'PARTIAL'] },
          dueDate: { gte: now, lte: in7Days },
        },
      }),

      this.db.expense.findMany({
        where: {
          empresaId,
          expenseDate: { gte: startOfMonth, lte: endOfMonth },
          status: { not: 'CANCELLED' },
        },
        select: {
          category: true,
          currency: true,
          exchangeRate: true,
          total: true,
          paidAmount: true,
        },
      }),

      this.db.supplierPayment.findMany({
        where: {
          empresaId,
          status: 'COMPLETED',
          processedAt: { gte: startOfMonth, lte: endOfMonth },
        },
        select: { currency: true, exchangeRate: true, amount: true },
      }),

      this.db.supplierPayment.findMany({
        where: { empresaId, status: 'COMPLETED' },
        include: {
          supplier: { select: { name: true } },
          supplierBill: { select: { internalNumber: true, billNumber: true } },
          expense: { select: { expenseNumber: true, description: true } },
        },
        orderBy: { processedAt: 'desc' },
        take: 5,
      }),

      this.db.supplierBill.findMany({
        where: { empresaId, status: { in: ['PENDING', 'PARTIAL'] } },
        include: { supplier: { select: { name: true } } },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),

      this.db.preInvoice.findMany({
        where: { empresaId, status: 'READY_FOR_PAYMENT' },
        include: {
          customer: { select: { id: true, name: true } },
          payments: {
            where: { status: 'COMPLETED' },
            select: { amount: true, currency: true, exchangeRate: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),

      this.db.payment.findMany({
        where: {
          empresaId,
          status: 'COMPLETED',
          processedAt: { gte: startOfMonth, lte: endOfMonth },
        },
        select: { currency: true, exchangeRate: true, amount: true },
      }),

      this.db.$queryRaw<{ month: Date; currency: string; income: number; outcome: number }[]>`
        SELECT
          DATE_TRUNC('month', "transactionDate") AS month,
          currency::text,
          SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END)::float8 AS income,
          SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END)::float8 AS outcome
        FROM cash_transactions
        WHERE "empresaId" = ${empresaId}
          AND "transactionDate" >= ${sixMonthsAgo}
        GROUP BY 1, 2
        ORDER BY 1 ASC
      `,
    ])

    // ── Saldos bancarios ──────────────────────────────────────────────────────
    const balancesByCurrency: Breakdown = {}
    let totalBalanceUSD = 0
    for (const acct of bankAccounts) {
      const cur = acct.currency
      const bal = Number(acct.currentBalance)
      addBucket(balancesByCurrency, cur, bal)
      totalBalanceUSD += toUSD(bal, cur, null, fxRates) ?? 0
    }

    // ── AP por status ─────────────────────────────────────────────────────────
    const ap = {
      totalPending: 0, // USD eq (back-compat)
      totalPartial: 0, // USD eq (back-compat)
      totalPaid: 0,    // USD eq (back-compat)
      countPending: 0,
      countPartial: 0,
      pendingByCurrency: {} as Breakdown,
      partialByCurrency: {} as Breakdown,
      paidByCurrency: {} as Breakdown,
      overdueCount,
      dueSoonCount,
    }
    for (const b of billsForStatus as any[]) {
      const cur = b.currency
      const rate = b.exchangeRate != null ? Number(b.exchangeRate) : null
      const pending = Number(b.pendingAmount ?? 0)
      const total = Number(b.total ?? 0)
      if (b.status === 'PENDING') {
        addBucket(ap.pendingByCurrency, cur, pending)
        ap.totalPending += toUSD(pending, cur, rate, fxRates) ?? 0
        ap.countPending += 1
      } else if (b.status === 'PARTIAL') {
        addBucket(ap.partialByCurrency, cur, pending)
        ap.totalPartial += toUSD(pending, cur, rate, fxRates) ?? 0
        ap.countPartial += 1
      } else if (b.status === 'PAID') {
        addBucket(ap.paidByCurrency, cur, total)
        ap.totalPaid += toUSD(total, cur, rate, fxRates) ?? 0
      }
    }

    // ── Gastos del mes ────────────────────────────────────────────────────────
    const expensesTotalByCurrency: Breakdown = {}
    const expensesPaidByCurrency: Breakdown = {}
    let expensesTotalUSD = 0
    let expensesPaidUSD = 0
    const expensesByCategoryMap = new Map<
      string,
      { category: string; totalUSD: number; byCurrency: Breakdown; count: number }
    >()
    for (const e of monthExpenses) {
      const cur = e.currency
      const rate = e.exchangeRate != null ? Number(e.exchangeRate) : null
      const tot = Number(e.total ?? 0)
      const paid = Number(e.paidAmount ?? 0)
      addBucket(expensesTotalByCurrency, cur, tot)
      addBucket(expensesPaidByCurrency, cur, paid)
      expensesTotalUSD += toUSD(tot, cur, rate, fxRates) ?? 0
      expensesPaidUSD += toUSD(paid, cur, rate, fxRates) ?? 0
      const cat = e.category as string
      const agg =
        expensesByCategoryMap.get(cat) ??
        { category: cat, totalUSD: 0, byCurrency: {} as Breakdown, count: 0 }
      addBucket(agg.byCurrency, cur, tot)
      agg.totalUSD += toUSD(tot, cur, rate, fxRates) ?? 0
      agg.count += 1
      expensesByCategoryMap.set(cat, agg)
    }

    // ── Pagos proveedor del mes ───────────────────────────────────────────────
    const paymentsByCurrency: Breakdown = {}
    let paymentsTotalUSD = 0
    for (const p of monthPayments) {
      const cur = p.currency
      const rate = p.exchangeRate != null ? Number(p.exchangeRate) : null
      const amt = Number(p.amount ?? 0)
      addBucket(paymentsByCurrency, cur, amt)
      paymentsTotalUSD += toUSD(amt, cur, rate, fxRates) ?? 0
    }

    // ── AR (pre-facturas pendientes) ──────────────────────────────────────────
    const ar = this._buildArSummary(arPendingPreInvoices, monthCollections, now, fxRates)

    // ── Top 5 deudores ────────────────────────────────────────────────────────
    const debtorMap = new Map<
      string,
      {
        customerId: string
        customerName: string
        pendingAmount: number // USD eq
        pendingByCurrency: Breakdown
        count: number
      }
    >()
    for (const pi of arPendingPreInvoices) {
      const cur = (pi as any).currency
      const rate = (pi as any).exchangeRate != null ? Number((pi as any).exchangeRate) : null
      const paid = (pi.payments as any[]).reduce(
        (s: number, p: any) => s + Number(p.amount),
        0,
      )
      const pendingRaw = Number((pi as any).total) - paid
      if (pendingRaw <= 0 || !pi.customer) continue
      const pendingUSD = toUSD(pendingRaw, cur, rate, fxRates) ?? 0
      const cid = pi.customer.id
      const agg =
        debtorMap.get(cid) ??
        {
          customerId: cid,
          customerName: pi.customer.name,
          pendingAmount: 0,
          pendingByCurrency: {},
          count: 0,
        }
      agg.pendingAmount += pendingUSD
      addBucket(agg.pendingByCurrency, cur, pendingRaw)
      agg.count += 1
      debtorMap.set(cid, agg)
    }
    const topDebtors = Array.from(debtorMap.values())
      .sort((a, b) => b.pendingAmount - a.pendingAmount)
      .slice(0, 5)

    // ── Flujo mensual ─────────────────────────────────────────────────────────
    const monthlyFlowMap = new Map<
      string,
      {
        month: string
        USD_income: number
        USD_outcome: number
        VES_income: number
        VES_outcome: number
        incomeUSD_eq: number
        outcomeUSD_eq: number
      }
    >()
    for (const row of monthlyCashFlowRaw) {
      const d = new Date(row.month)
      const label = d.toLocaleDateString('es-VE', { month: 'short', year: '2-digit' })
      const entry =
        monthlyFlowMap.get(label) ??
        {
          month: label,
          USD_income: 0,
          USD_outcome: 0,
          VES_income: 0,
          VES_outcome: 0,
          incomeUSD_eq: 0,
          outcomeUSD_eq: 0,
        }
      const cur = row.currency as string
      const income = Number(row.income)
      const outcome = Number(row.outcome)
      if (cur === 'USD') {
        entry.USD_income += income
        entry.USD_outcome += outcome
      } else if (cur === 'VES') {
        entry.VES_income += income
        entry.VES_outcome += outcome
      }
      entry.incomeUSD_eq += toUSD(income, cur, null, fxRates) ?? 0
      entry.outcomeUSD_eq += toUSD(outcome, cur, null, fxRates) ?? 0
      monthlyFlowMap.set(label, entry)
    }
    const monthlyCashFlow = Array.from(monthlyFlowMap.values())

    return {
      bankAccounts: bankAccounts.map((a) => ({
        ...a,
        currentBalance: Number(a.currentBalance),
      })),
      balancesByCurrency,
      totalBalanceUSD,
      topDebtors,
      monthlyCashFlow,
      fxRates,
      ap,
      expenses: {
        total: expensesTotalUSD,
        paid: expensesPaidUSD,
        count: monthExpenses.length,
        totalByCurrency: expensesTotalByCurrency,
        paidByCurrency: expensesPaidByCurrency,
        byCategory: Array.from(expensesByCategoryMap.values()).map((c) => ({
          category: c.category,
          total: c.totalUSD,
          byCurrency: c.byCurrency,
          count: c.count,
        })),
      },
      paymentsThisMonth: {
        total: paymentsTotalUSD,
        count: monthPayments.length,
        byCurrency: paymentsByCurrency,
      },
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        paymentNumber: p.paymentNumber,
        amount: Number(p.amount),
        amountUSD: toUSD(
          Number(p.amount),
          p.currency,
          p.exchangeRate != null ? Number(p.exchangeRate) : null,
          fxRates,
        ),
        currency: p.currency,
        method: p.method,
        processedAt: p.processedAt,
        supplierName: p.supplier?.name ?? null,
        reference:
          p.supplierBill?.billNumber ??
          p.supplierBill?.internalNumber ??
          p.expense?.expenseNumber ??
          null,
        isExpense: !!p.expenseId,
      })),
      recentBills: recentBills.map((b) => ({
        id: b.id,
        internalNumber: b.internalNumber,
        billNumber: b.billNumber,
        supplierName: b.supplier.name,
        total: Number(b.total),
        totalUSD: toUSD(
          Number(b.total),
          b.currency,
          b.exchangeRate != null ? Number(b.exchangeRate) : null,
          fxRates,
        ),
        pendingAmount: Number(b.pendingAmount),
        pendingAmountUSD: toUSD(
          Number(b.pendingAmount),
          b.currency,
          b.exchangeRate != null ? Number(b.exchangeRate) : null,
          fxRates,
        ),
        currency: b.currency,
        status: b.status,
        dueDate: b.dueDate,
      })),
      ar,
    }
  }

  async getReceivables(empresaId: string) {
    const now = new Date()
    const fxRates = await buildFallbackRateMap(this.db, empresaId)

    const preInvoices = await this.db.preInvoice.findMany({
      where: { empresaId, status: 'READY_FOR_PAYMENT' },
      include: {
        customer: { select: { id: true, name: true, code: true, taxId: true } },
        payments: {
          where: { status: 'COMPLETED' },
          select: { amount: true, processedAt: true, currency: true, exchangeRate: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const items = preInvoices
      .map((pi) => {
        const cur = (pi as any).currency
        const rate = (pi as any).exchangeRate != null ? Number((pi as any).exchangeRate) : null
        const paid = (pi.payments as any[]).reduce(
          (s: number, p: any) => s + Number(p.amount),
          0,
        )
        const pendingAmount = Number((pi as any).total) - paid
        if (pendingAmount <= 0) return null
        const dueDate = (pi as any).dueDate ? new Date((pi as any).dueDate) : null
        const daysOverdue = dueDate
          ? Math.floor((now.getTime() - dueDate.getTime()) / 86400000)
          : null
        const isOverdue = daysOverdue !== null && daysOverdue > 0
        let agingBucket: '0-30' | '31-60' | '61-90' | '+90' | 'sin-vencimiento' =
          'sin-vencimiento'
        if (daysOverdue !== null) {
          if (daysOverdue <= 30) agingBucket = '0-30'
          else if (daysOverdue <= 60) agingBucket = '31-60'
          else if (daysOverdue <= 90) agingBucket = '61-90'
          else agingBucket = '+90'
        }
        return {
          id: pi.id,
          preInvoiceNumber: pi.preInvoiceNumber,
          customer: pi.customer,
          total: Number((pi as any).total),
          totalUSD: toUSD(Number((pi as any).total), cur, rate, fxRates),
          paidAmount: paid,
          pendingAmount,
          pendingAmountUSD: toUSD(pendingAmount, cur, rate, fxRates) ?? 0,
          currency: cur,
          dueDate: (pi as any).dueDate,
          daysOverdue,
          isOverdue,
          agingBucket,
          createdAt: pi.createdAt,
        }
      })
      .filter(Boolean) as any[]

    const aging: Record<string, number> = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '+90': 0,
      'sin-vencimiento': 0,
    }
    const agingByCurrency: Record<string, Breakdown> = {
      '0-30': {},
      '31-60': {},
      '61-90': {},
      '+90': {},
      'sin-vencimiento': {},
    }
    for (const r of items) {
      aging[r.agingBucket] += r.pendingAmountUSD
      addBucket(agingByCurrency[r.agingBucket], r.currency, r.pendingAmount)
    }

    return {
      total: items.reduce((s, r) => s + r.pendingAmountUSD, 0),
      count: items.length,
      overdueCount: items.filter((r) => r.isOverdue).length,
      aging,
      agingByCurrency,
      fxRates,
      items,
    }
  }

  private _buildArSummary(
    pendingPreInvoices: any[],
    monthCollections: any[],
    now: Date,
    fxRates: FallbackRateMap,
  ) {
    let totalPendingUSD = 0
    const pendingByCurrency: Breakdown = {}
    let countPending = 0
    let overdueCount = 0
    const recentPending: any[] = []

    for (const pi of pendingPreInvoices) {
      const cur = pi.currency
      const rate = pi.exchangeRate != null ? Number(pi.exchangeRate) : null
      const paid = (pi.payments as any[]).reduce(
        (s: number, p: any) => s + Number(p.amount),
        0,
      )
      const pending = Number(pi.total) - paid
      if (pending <= 0) continue
      const pendingUSD = toUSD(pending, cur, rate, fxRates) ?? 0
      totalPendingUSD += pendingUSD
      addBucket(pendingByCurrency, cur, pending)
      countPending++
      const isOverdue = pi.dueDate && new Date(pi.dueDate) < now
      if (isOverdue) overdueCount++
      if (recentPending.length < 5) {
        recentPending.push({
          id: pi.id,
          preInvoiceNumber: pi.preInvoiceNumber,
          customerName: pi.customer?.name ?? null,
          total: Number(pi.total),
          pendingAmount: pending,
          pendingAmountUSD: pendingUSD,
          currency: cur,
          dueDate: pi.dueDate,
          isOverdue: !!isOverdue,
          createdAt: pi.createdAt,
        })
      }
    }

    const collectedByCurrency: Breakdown = {}
    let collectedUSD = 0
    for (const p of monthCollections) {
      const cur = p.currency
      const rate = p.exchangeRate != null ? Number(p.exchangeRate) : null
      const amt = Number(p.amount ?? 0)
      addBucket(collectedByCurrency, cur, amt)
      collectedUSD += toUSD(amt, cur, rate, fxRates) ?? 0
    }

    return {
      totalPending: totalPendingUSD,
      pendingByCurrency,
      countPending,
      overdueCount,
      collectedThisMonth: collectedUSD,
      collectedByCurrency,
      countCollectedThisMonth: monthCollections.length,
      recentPending,
    }
  }
}

export default FinanceDashboardService
