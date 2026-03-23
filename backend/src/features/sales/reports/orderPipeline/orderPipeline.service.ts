/**
 * Order Pipeline Report Service
 */

import prisma from '../../../../services/prisma.service.js'

export async function getOrderPipelineReport(empresaId?: string, prismaClient?: any) {
  const db = prismaClient || prisma
  const where: any = {}
  if (empresaId) where.empresaId = empresaId

  const [byStatus, approvedOrders, oldestPending] = await Promise.all([
    db.order.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
      _sum: { total: true },
      _avg: { total: true },
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

  const statusData = byStatus.map((s: any) => ({
    status: s.status,
    count: s._count.id,
    totalValue: Number(s._sum.total ?? 0),
    avgValue: Number(s._avg.total ?? 0),
  }))

  const totalOrders = statusData.reduce((acc, s) => acc + s.count, 0)
  const totalValue = statusData.reduce((acc, s) => acc + s.totalValue, 0)
  const approvedCount = statusData.find((s) => s.status === 'APPROVED')?.count ?? 0
  const cancelledCount = statusData.find((s) => s.status === 'CANCELLED')?.count ?? 0

  return {
    byStatus: statusData,
    avgApprovalHours: Math.round(avgApprovalHours * 10) / 10,
    pendingOldestDays: Math.round(pendingOldestDays),
    summary: {
      totalOrders,
      totalValue,
      approvedRate: totalOrders > 0 ? (approvedCount / totalOrders) * 100 : 0,
      cancelledRate: totalOrders > 0 ? (cancelledCount / totalOrders) * 100 : 0,
    },
  }
}

export default { getOrderPipelineReport }
