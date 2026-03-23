/**
 * Pending Pre-Invoices (AR Aging) Report Service
 */

import prisma from '../../../../services/prisma.service.js'

const PENDING_STATUSES = ['PENDING_PREPARATION', 'IN_PREPARATION', 'READY_FOR_PAYMENT']

export async function getPendingInvoicesReport(
  page = 1,
  limit = 50,
  empresaId?: string,
  prismaClient?: any
) {
  const db = prismaClient || prisma
  const now = new Date()
  const ago3 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
  const ago7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const baseWhere: any = { status: { in: PENDING_STATUSES } }
  if (empresaId) baseWhere.empresaId = empresaId

  const skip = (page - 1) * limit

  const [preInvoices, total, criticalCount, warningCount] = await Promise.all([
    db.preInvoice.findMany({
      where: baseWhere,
      include: {
        customer: { select: { name: true, taxId: true } },
        warehouse: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
    db.preInvoice.count({ where: baseWhere }),
    db.preInvoice.count({ where: { ...baseWhere, createdAt: { lt: ago7 } } }),
    db.preInvoice.count({ where: { ...baseWhere, createdAt: { gte: ago7, lt: ago3 } } }),
  ])

  const normalCount = Math.max(0, total - criticalCount - warningCount)

  const data = preInvoices.map((pi: any) => {
    const daysWaiting = Math.floor(
      (now.getTime() - new Date(pi.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    return {
      id: pi.id,
      preInvoiceNumber: pi.preInvoiceNumber,
      customerName: pi.customer?.name ?? '—',
      taxId: pi.customer?.taxId ?? '—',
      warehouseName: pi.warehouse?.name ?? '—',
      total: Number(pi.total),
      currency: pi.currency,
      status: pi.status,
      createdAt: pi.createdAt,
      daysWaiting,
    }
  })

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    summary: { criticalCount, warningCount, normalCount },
  }
}

export default { getPendingInvoicesReport }
