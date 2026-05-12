/**
 * Order Pipeline Report Service
 */

import prisma from '../../../../services/prisma.service.js'
import {
  buildFallbackRateMap,
  toUSD,
} from '../../../../shared/utils/currency.js'

export async function getOrderPipelineReport(empresaId?: string, prismaClient?: any) {
  const db = prismaClient || prisma
  const where: any = {}
  if (empresaId) where.empresaId = empresaId

  const fallback = await buildFallbackRateMap(db, empresaId)

  const [orderRows, approvedOrders, oldestPending] = await Promise.all([
    db.order.findMany({
      where,
      select: {
        status: true,
        currency: true,
        exchangeRate: true,
        total: true,
      },
    }),
    db.order.findMany({
      where: { ...where, status: 'APPROVED', approvedAt: { not: null } },
      select: { createdAt: true, approvedAt: true },
    }),
    db.order.findMany({
      where: { ...where, status: 'PENDING_APPROVAL' },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: 1,
    }),
  ])

  let avgApprovalHours = 0
  if (approvedOrders.length > 0) {
    const totalMs = approvedOrders.reduce((acc: number, o: any) => {
      return acc + (new Date(o.approvedAt).getTime() - new Date(o.createdAt).getTime())
    }, 0)
    avgApprovalHours = totalMs / approvedOrders.length / (1000 * 60 * 60)
  }

  let pendingOldestDays = 0
  if (oldestPending.length > 0) {
    pendingOldestDays =
      (Date.now() - new Date(oldestPending[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)
  }

  type Agg = {
    status: string
    count: number
    totalValue: Record<string, number>
    totalValueUSD: number
  }
  const statusMap = new Map<string, Agg>()
  for (const o of orderRows) {
    const agg =
      statusMap.get(o.status) ?? {
        status: o.status,
        count: 0,
        totalValue: {},
        totalValueUSD: 0,
      }
    const cur = o.currency
    const rate = o.exchangeRate != null ? Number(o.exchangeRate) : null
    const tot = Number(o.total ?? 0)
    agg.count += 1
    agg.totalValue[cur] = (agg.totalValue[cur] ?? 0) + tot
    agg.totalValueUSD += toUSD(tot, cur, rate, fallback) ?? 0
    statusMap.set(o.status, agg)
  }

  const statusData = Array.from(statusMap.values()).map((s) => ({
    status: s.status,
    count: s.count,
    totalValue: s.totalValue,
    totalValueUSD: s.totalValueUSD,
    avgValueUSD: s.count > 0 ? s.totalValueUSD / s.count : 0,
  }))

  const totalOrders = statusData.reduce((acc, s) => acc + s.count, 0)
  const totalValueUSD = statusData.reduce((acc, s) => acc + s.totalValueUSD, 0)
  const approvedCount = statusData.find((s) => s.status === 'APPROVED')?.count ?? 0
  const cancelledCount = statusData.find((s) => s.status === 'CANCELLED')?.count ?? 0

  return {
    byStatus: statusData,
    avgApprovalHours: Math.round(avgApprovalHours * 10) / 10,
    pendingOldestDays: Math.round(pendingOldestDays),
    fxRates: fallback,
    summary: {
      totalOrders,
      totalValueUSD,
      approvedRate: totalOrders > 0 ? (approvedCount / totalOrders) * 100 : 0,
      cancelledRate: totalOrders > 0 ? (cancelledCount / totalOrders) * 100 : 0,
    },
  }
}

export default { getOrderPipelineReport }
