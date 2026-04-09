/**
 * Batch Expiry Report Service
 * Returns batches expiring within N days, ordered by urgency
 */

import prisma from '../../../../services/prisma.service.js'

export async function getBatchExpiryReport(
  page = 1,
  limit = 50,
  daysAhead = 90,
  empresaId?: string,
  prismaClient?: any
) {
  const db = prismaClient || prisma

  const now = new Date()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() + daysAhead)

  const where: any = {
    isActive: true,
    currentQuantity: { gt: 0 },
    expiryDate: { not: null, lte: cutoffDate },
    ...(empresaId ? { item: { empresaId } } : {}),
  }

  // Parallel: total count + urgency counts (from full dataset) + paginated data
  const [total, expiredCount, criticalCount, warningCount, batches] = await Promise.all([
    db.batch.count({ where }),
    db.batch.count({ where: { ...where, expiryDate: { not: null, lt: now } } }),
    db.batch.count({ where: { ...where, expiryDate: { not: null, gte: now, lt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } } }),
    db.batch.count({ where: { ...where, expiryDate: { not: null, gte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), lt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) } } }),
    db.batch.findMany({
      where,
      include: { item: true },
      orderBy: { expiryDate: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  const data = batches.map((b: any) => {
    const daysUntilExpiry = b.expiryDate
      ? Math.floor((b.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null

    let urgency: 'expired' | 'critical' | 'warning' | 'info' = 'info'
    if (daysUntilExpiry !== null) {
      if (daysUntilExpiry < 0) urgency = 'expired'
      else if (daysUntilExpiry <= 7) urgency = 'critical'
      else if (daysUntilExpiry <= 30) urgency = 'warning'
    }

    return {
      id: b.id,
      batchNumber: b.batchNumber,
      itemId: b.itemId,
      itemName: b.item.name,
      itemSKU: b.item.sku,
      expiryDate: b.expiryDate,
      manufacturingDate: b.manufacturingDate,
      currentQuantity: b.currentQuantity,
      initialQuantity: b.initialQuantity,
      daysUntilExpiry,
      urgency,
      notes: b.notes,
    }
  })

  const infoCount = total - expiredCount - criticalCount - warningCount

  return {
    data,
    summary: { expiredCount, criticalCount, warningCount, infoCount },
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export default { getBatchExpiryReport }
