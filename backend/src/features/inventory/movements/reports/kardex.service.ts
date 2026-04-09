/**
 * Kardex Report Service
 * Returns chronological movement history for an item with running balance
 */

import prisma from '../../../../services/prisma.service.js'

export interface KardexEntry {
  id: string
  movementNumber: string
  date: Date
  type: string
  reference: string
  quantityIn: number
  quantityOut: number
  balance: number
  unitCost: number
  totalCost: number
  warehouseName: string
  notes: string
}

export interface KardexReport {
  itemId: string
  itemName: string
  itemSKU: string
  warehouseId?: string
  warehouseName?: string
  dateFrom?: Date
  dateTo?: Date
  data: KardexEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
  openingBalance: number
  closingBalance: number
}

const ENTRY_TYPES = new Set(['PURCHASE', 'ADJUSTMENT_IN', 'LOAN_RETURN', 'WORKSHOP_RETURN', 'RESERVATION_RELEASE'])

export async function getKardexReport(params: {
  itemId: string
  warehouseId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
  empresaId?: string
  prismaClient?: any
}): Promise<KardexReport> {
  const {
    itemId,
    warehouseId,
    page = 1,
    limit = 50,
    empresaId,
    prismaClient,
  } = params
  const db = prismaClient || prisma

  const dateFrom = params.dateFrom ? new Date(params.dateFrom) : undefined
  const dateTo = params.dateTo ? (() => { const d = new Date(params.dateTo!); d.setDate(d.getDate() + 1); return d })() : undefined

  // Verify item belongs to empresa
  const item = await db.item.findFirst({
    where: {
      id: itemId,
      ...(empresaId ? { empresaId } : {}),
    },
    select: { id: true, name: true, sku: true },
  })

  if (!item) {
    throw new Error('Item not found')
  }

  const where: any = {
    itemId,
    ...(warehouseId
      ? { OR: [{ warehouseFromId: warehouseId }, { warehouseToId: warehouseId }] }
      : {}),
    ...(dateFrom || dateTo
      ? {
          movementDate: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lt: dateTo } : {}),
          },
        }
      : {}),
  }

  // Count for pagination
  const total = await db.movement.count({ where })

  // Fetch all movements up to this page to calculate running balance
  const allMovements = await db.movement.findMany({
    where,
    include: {
      warehouseFrom: { select: { id: true, name: true } },
      warehouseTo: { select: { id: true, name: true } },
    },
    orderBy: { movementDate: 'asc' },
  })

  // Calculate running balance across all entries, then slice for pagination
  let runningBalance = 0
  const allEntries: KardexEntry[] = allMovements.map((m: any) => {
    const isIn = ENTRY_TYPES.has(m.type) || m.type.includes('IN') || m.type === 'PURCHASE'
    const qty = Number(m.quantity)
    const quantityIn = isIn ? qty : 0
    const quantityOut = isIn ? 0 : qty
    runningBalance += quantityIn - quantityOut

    const warehouse = isIn
      ? (m.warehouseTo?.name ?? m.warehouseFrom?.name ?? 'N/A')
      : (m.warehouseFrom?.name ?? m.warehouseTo?.name ?? 'N/A')

    return {
      id: m.id,
      movementNumber: m.movementNumber,
      date: m.movementDate,
      type: m.type,
      reference: m.reference ?? '',
      quantityIn,
      quantityOut,
      balance: runningBalance,
      unitCost: Number(m.unitCost ?? 0),
      totalCost: Number(m.totalCost ?? 0),
      warehouseName: warehouse,
      notes: m.notes ?? '',
    }
  })

  const openingBalance = allEntries.length > 0 ? 0 : 0
  const closingBalance = allEntries.length > 0 ? allEntries[allEntries.length - 1].balance : 0

  // Paginate
  const start = (page - 1) * limit
  const paginatedEntries = allEntries.slice(start, start + limit)

  // Resolve warehouse name if filter applied
  let warehouseName: string | undefined
  if (warehouseId) {
    const wh = await db.warehouse.findFirst({ where: { id: warehouseId }, select: { name: true } })
    warehouseName = wh?.name
  }

  return {
    itemId: item.id,
    itemName: item.name,
    itemSKU: item.sku,
    warehouseId,
    warehouseName,
    dateFrom,
    dateTo,
    data: paginatedEntries,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    openingBalance,
    closingBalance,
  }
}

export default { getKardexReport }
