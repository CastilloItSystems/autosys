// backend/src/features/finance/dashboard/financeDashboard.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'

class FinanceDashboardService {
  private db: PrismaClient

  constructor(db: PrismaClient) {
    this.db = db
  }

  async getDashboard(empresaId: string) {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const today = new Date(now.toISOString().split('T')[0] + 'T23:59:59.999Z')
    const in7Days = new Date(now)
    in7Days.setDate(in7Days.getDate() + 7)

    const sixMonthsAgo = new Date(now)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const [
      bankAccounts,
      billsByStatus,
      overdueCount,
      dueSoonCount,
      expensesByMonth,
      paymentsThisMonth,
      recentPayments,
      expensesByCategory,
      recentBills,
      arPendingPreInvoices,
      arCollectedThisMonth,
      monthlyCashFlowRaw,
    ] = await Promise.all([
      // Saldos por cuenta activa
      this.db.bankAccount.findMany({
        where: { empresaId, isActive: true },
        select: { id: true, name: true, type: true, currency: true, currentBalance: true },
        orderBy: { currency: 'asc' },
      }),

      // Facturas agrupadas por status
      this.db.supplierBill.groupBy({
        by: ['status'],
        where: { empresaId },
        _sum: { pendingAmount: true, total: true },
        _count: true,
      }),

      // Facturas vencidas (dueDate < hoy, status pendiente/partial)
      this.db.supplierBill.count({
        where: {
          empresaId,
          status: { in: ['PENDING', 'PARTIAL'] },
          dueDate: { lt: now },
        },
      }),

      // Facturas por vencer en 7 días
      this.db.supplierBill.count({
        where: {
          empresaId,
          status: { in: ['PENDING', 'PARTIAL'] },
          dueDate: { gte: now, lte: in7Days },
        },
      }),

      // Gastos del mes
      this.db.expense.aggregate({
        where: { empresaId, expenseDate: { gte: startOfMonth, lte: endOfMonth }, status: { not: 'CANCELLED' } },
        _sum: { total: true, paidAmount: true },
        _count: true,
      }),

      // Pagos realizados este mes
      this.db.supplierPayment.aggregate({
        where: { empresaId, status: 'COMPLETED', processedAt: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),

      // Últimos 5 pagos
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

      // Gastos por categoría este mes
      this.db.expense.groupBy({
        by: ['category'],
        where: { empresaId, expenseDate: { gte: startOfMonth, lte: endOfMonth }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
        _count: true,
      }),

      // Últimas 5 facturas pendientes/parciales
      this.db.supplierBill.findMany({
        where: { empresaId, status: { in: ['PENDING', 'PARTIAL'] } },
        include: { supplier: { select: { name: true } } },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),

      // Pre-facturas pendientes de cobro (cuentas por cobrar)
      this.db.preInvoice.findMany({
        where: { empresaId, status: 'READY_FOR_PAYMENT' },
        include: {
          customer: { select: { id: true, name: true } },
          payments: {
            where: { status: 'COMPLETED' },
            select: { amount: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),

      // Cobros de ventas este mes
      this.db.payment.aggregate({
        where: { empresaId, status: 'COMPLETED', processedAt: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),

      // Flujo mensual últimos 6 meses
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

    // Saldos por moneda (suma)
    const balancesByCurrency: Record<string, number> = {}
    for (const acct of bankAccounts) {
      const cur = acct.currency
      balancesByCurrency[cur] = (balancesByCurrency[cur] ?? 0) + Number(acct.currentBalance)
    }

    // Resumen de cuentas por pagar
    const apSummary = {
      totalPending: 0,
      totalPartial: 0,
      totalPaid: 0,
      countPending: 0,
      countPartial: 0,
    }
    for (const row of billsByStatus) {
      if (row.status === 'PENDING') {
        apSummary.totalPending = Number(row._sum.pendingAmount ?? 0)
        apSummary.countPending = row._count
      } else if (row.status === 'PARTIAL') {
        apSummary.totalPartial = Number(row._sum.pendingAmount ?? 0)
        apSummary.countPartial = row._count
      } else if (row.status === 'PAID') {
        apSummary.totalPaid = Number(row._sum.total ?? 0)
      }
    }

    // Top 5 deudores (CxC)
    const debtorMap: Record<string, { customerId: string; customerName: string; pendingAmount: number; count: number }> = {}
    for (const pi of arPendingPreInvoices) {
      const paid = (pi.payments as any[]).reduce((s: number, p: any) => s + Number(p.amount), 0)
      const pending = Number((pi as any).total) - paid
      if (pending <= 0 || !pi.customer) continue
      const cid = pi.customer.id
      if (!debtorMap[cid]) debtorMap[cid] = { customerId: cid, customerName: pi.customer.name, pendingAmount: 0, count: 0 }
      debtorMap[cid].pendingAmount += pending
      debtorMap[cid].count++
    }
    const topDebtors = Object.values(debtorMap)
      .sort((a, b) => b.pendingAmount - a.pendingAmount)
      .slice(0, 5)

    // Monthly cash flow grouped by month label
    const monthlyFlowMap: Record<string, { month: string; USD_income: number; USD_outcome: number; VES_income: number; VES_outcome: number }> = {}
    for (const row of monthlyCashFlowRaw) {
      const d = new Date(row.month)
      const label = d.toLocaleDateString('es-VE', { month: 'short', year: '2-digit' })
      if (!monthlyFlowMap[label]) monthlyFlowMap[label] = { month: label, USD_income: 0, USD_outcome: 0, VES_income: 0, VES_outcome: 0 }
      const cur = row.currency as string
      if (cur === 'USD') {
        monthlyFlowMap[label].USD_income += Number(row.income)
        monthlyFlowMap[label].USD_outcome += Number(row.outcome)
      } else if (cur === 'VES') {
        monthlyFlowMap[label].VES_income += Number(row.income)
        monthlyFlowMap[label].VES_outcome += Number(row.outcome)
      }
    }
    const monthlyCashFlow = Object.values(monthlyFlowMap)

    return {
      bankAccounts: bankAccounts.map((a) => ({ ...a, currentBalance: Number(a.currentBalance) })),
      balancesByCurrency,
      topDebtors,
      monthlyCashFlow,
      ap: {
        ...apSummary,
        overdueCount,
        dueSoonCount,
      },
      expenses: {
        total: Number(expensesByMonth._sum.total ?? 0),
        paid: Number(expensesByMonth._sum.paidAmount ?? 0),
        count: expensesByMonth._count,
        byCategory: expensesByCategory.map((r) => ({
          category: r.category,
          total: Number(r._sum.total ?? 0),
          count: r._count,
        })),
      },
      paymentsThisMonth: {
        total: Number(paymentsThisMonth._sum.amount ?? 0),
        count: paymentsThisMonth._count,
      },
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        paymentNumber: p.paymentNumber,
        amount: Number(p.amount),
        currency: p.currency,
        method: p.method,
        processedAt: p.processedAt,
        supplierName: p.supplier?.name ?? null,
        reference: p.supplierBill?.billNumber ?? p.supplierBill?.internalNumber ?? p.expense?.expenseNumber ?? null,
        isExpense: !!p.expenseId,
      })),
      recentBills: recentBills.map((b) => ({
        id: b.id,
        internalNumber: b.internalNumber,
        billNumber: b.billNumber,
        supplierName: b.supplier.name,
        total: Number(b.total),
        pendingAmount: Number(b.pendingAmount),
        currency: b.currency,
        status: b.status,
        dueDate: b.dueDate,
      })),
      ar: this._buildArSummary(arPendingPreInvoices, arCollectedThisMonth, now),
    }
  }

  async getReceivables(empresaId: string) {
    const now = new Date()

    const preInvoices = await this.db.preInvoice.findMany({
      where: { empresaId, status: 'READY_FOR_PAYMENT' },
      include: {
        customer: { select: { id: true, name: true, code: true, taxId: true } },
        payments: {
          where: { status: 'COMPLETED' },
          select: { amount: true, processedAt: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const result = preInvoices
      .map((pi) => {
        const paid = (pi.payments as any[]).reduce((s: number, p: any) => s + Number(p.amount), 0)
        const pendingAmount = Number((pi as any).total) - paid
        if (pendingAmount <= 0) return null
        const dueDate = (pi as any).dueDate ? new Date((pi as any).dueDate) : null
        const daysOverdue = dueDate ? Math.floor((now.getTime() - dueDate.getTime()) / 86400000) : null
        const isOverdue = daysOverdue !== null && daysOverdue > 0
        let agingBucket: '0-30' | '31-60' | '61-90' | '+90' | 'sin-vencimiento' = 'sin-vencimiento'
        if (daysOverdue !== null) {
          if (daysOverdue <= 0) agingBucket = '0-30'
          else if (daysOverdue <= 30) agingBucket = '0-30'
          else if (daysOverdue <= 60) agingBucket = '31-60'
          else if (daysOverdue <= 90) agingBucket = '61-90'
          else agingBucket = '+90'
        }
        return {
          id: pi.id,
          preInvoiceNumber: pi.preInvoiceNumber,
          customer: pi.customer,
          total: Number((pi as any).total),
          paidAmount: paid,
          pendingAmount,
          currency: (pi as any).currency,
          dueDate: (pi as any).dueDate,
          daysOverdue,
          isOverdue,
          agingBucket,
          createdAt: pi.createdAt,
        }
      })
      .filter(Boolean)

    // Aging buckets totals
    const aging = { '0-30': 0, '31-60': 0, '61-90': 0, '+90': 0, 'sin-vencimiento': 0 }
    for (const r of result as any[]) {
      aging[r.agingBucket as keyof typeof aging] += r.pendingAmount
    }

    return {
      total: (result as any[]).reduce((s, r) => s + r!.pendingAmount, 0),
      count: result.length,
      overdueCount: (result as any[]).filter((r) => r!.isOverdue).length,
      aging,
      items: result,
    }
  }

  private _buildArSummary(
    pendingPreInvoices: any[],
    collectedThisMonth: any,
    now: Date,
  ) {
    let totalPending = 0
    let countPending = 0
    let overdueCount = 0
    const recentPending: any[] = []

    for (const pi of pendingPreInvoices) {
      const paid = (pi.payments as any[]).reduce((s: number, p: any) => s + Number(p.amount), 0)
      const pending = Number(pi.total) - paid
      if (pending <= 0) continue
      totalPending += pending
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
          currency: pi.currency,
          dueDate: pi.dueDate,
          isOverdue: !!isOverdue,
          createdAt: pi.createdAt,
        })
      }
    }

    return {
      totalPending,
      countPending,
      overdueCount,
      collectedThisMonth: Number(collectedThisMonth._sum.amount ?? 0),
      countCollectedThisMonth: collectedThisMonth._count,
      recentPending,
    }
  }
}

export default FinanceDashboardService
