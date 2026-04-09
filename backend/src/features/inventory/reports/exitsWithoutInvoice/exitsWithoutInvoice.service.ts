/**
 * Exits Without Invoice Report Service
 */

import prisma from '../../../../services/prisma.service.js'

export async function getExitsWithoutInvoiceReport(
  page = 1,
  limit = 50,
  empresaId?: string,
  prismaClient?: any
) {
  const db = prismaClient || prisma
  try {
    const baseWhere: any = {
      type: 'SALE',
      preInvoiceId: null,
      ...(empresaId ? { warehouse: { empresaId } } : {}),
    }

    const now = new Date()
    const ago7  = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000)
    const ago30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [exitNotes, total, criticalCount, warningCount, normalCount] = await Promise.all([
      db.exitNote.findMany({
        include: { items: true, warehouse: true },
        where: baseWhere,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.exitNote.count({ where: baseWhere }),
      // >30 days
      db.exitNote.count({ where: { ...baseWhere, createdAt: { lt: ago30 } } }),
      // 8-30 days
      db.exitNote.count({ where: { ...baseWhere, createdAt: { gte: ago30, lt: ago7 } } }),
      // ≤7 days
      db.exitNote.count({ where: { ...baseWhere, createdAt: { gte: ago7 } } }),
    ])

    const exitsWithoutInvoice = exitNotes.map((en) => {
      const totalQuantity = en.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      )
      return {
        exitNoteId: en.id,
        exitNoteNumber: en.exitNoteNumber,
        type: en.type,
        status: en.status,
        recipientName: en.recipientName,
        warehouseId: en.warehouseId,
        warehouseName: en.warehouse?.name,
        itemCount: en.items.length,
        totalQuantity,
        createdDate: en.createdAt,
        daysWithoutInvoice: Math.floor(
          (now.getTime() - en.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        ),
        notes: en.notes,
      }
    })

    return {
      data: exitsWithoutInvoice,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: { criticalCount, warningCount, normalCount },
    }
  } catch (error) {
    console.error('Error generating exits without invoice report:', error)
    throw error
  }
}

export default { getExitsWithoutInvoiceReport }
