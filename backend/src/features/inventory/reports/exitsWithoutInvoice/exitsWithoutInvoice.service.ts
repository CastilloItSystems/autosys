/**
 * Exits Without Invoice Report Service
 */

import prisma from '../../../../services/prisma.service'


export async function getExitsWithoutInvoiceReport(page = 1, limit = 50, prismaClient?: any) {
  const db = prismaClient || prisma
  try {
    const exitNotes = await db.exitNote.findMany({
      include: { items: true, warehouse: true },
      where: {
        type: 'SALE',
        preInvoiceId: null,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

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
          (new Date().getTime() - en.createdAt.getTime()) /
            (1000 * 60 * 60 * 24)
        ),
        notes: en.notes,
      }
    })

    const total = await db.exitNote.count({
      where: {
        type: 'SALE',
        preInvoiceId: null,
      },
    })

    return {
      data: exitsWithoutInvoice,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  } catch (error) {
    console.error('Error generating exits without invoice report:', error)
    throw error
  }
}

export default { getExitsWithoutInvoiceReport }
