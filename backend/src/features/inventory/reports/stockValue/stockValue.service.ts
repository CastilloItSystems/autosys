/**
 * Stock Value Report Service
 */

import prisma from '../../../../services/prisma.service.js'

export interface StockValueFilters {
  warehouseId?: string
  search?: string // filter by item name or SKU
  zeroCostOnly?: boolean // only items with no cost assigned
  sortBy?: 'value_desc' | 'value_asc' | 'quantity_desc' | 'name_asc'
}

export async function getStockValueReport(
  page = 1,
  limit = 50,
  empresaId?: string,
  filters: StockValueFilters = {},
  prismaClient?: any
) {
  const db = prismaClient || prisma
  try {
    const where: any = empresaId ? { warehouse: { empresaId } } : {}
    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId
    }

    const allStocks = await db.stock.findMany({
      where,
      include: { item: true, warehouse: true },
    })

    let allValues = allStocks.map((s: any) => {
      const unitPrice = Number(s.averageCost || s.item.costPrice || 0)
      const totalValue = s.quantityReal * unitPrice
      return {
        itemId: s.itemId,
        itemName: s.item.name,
        itemSKU: s.item.sku,
        warehouseId: s.warehouseId,
        warehouseName: s.warehouse.name,
        quantity: s.quantityReal,
        unitPrice,
        totalValue,
      }
    })

    // Apply search filter (name or SKU)
    if (filters.search) {
      const q = filters.search.toLowerCase()
      allValues = allValues.filter(
        (s: any) =>
          s.itemName.toLowerCase().includes(q) ||
          s.itemSKU.toLowerCase().includes(q)
      )
    }

    // Zero cost only
    if (filters.zeroCostOnly) {
      allValues = allValues.filter((s: any) => s.unitPrice === 0)
    }

    // Sort
    const sortBy = filters.sortBy ?? 'value_desc'
    allValues.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'value_asc':
          return a.totalValue - b.totalValue
        case 'quantity_desc':
          return b.quantity - a.quantity
        case 'name_asc':
          return a.itemName.localeCompare(b.itemName)
        case 'value_desc':
        default:
          return b.totalValue - a.totalValue
      }
    })

    // totalInventoryValue is always computed from the FULL unfiltered set
    // so the percentage column makes sense relative to total inventory
    const allStocksForTotal = allStocks.map((s: any) => {
      const unitPrice = Number(s.averageCost || s.item.costPrice || 0)
      return s.quantityReal * unitPrice
    })
    const totalInventoryValue = allStocksForTotal.reduce(
      (sum: number, v: number) => sum + v,
      0
    )

    // Filtered value (for filtered summary)
    const filteredValue = allValues.reduce(
      (sum: number, s: any) => sum + s.totalValue,
      0
    )

    // --- Summary enrichments (always from full unfiltered data) ---
    const warehouseMap = new Map<
      string,
      {
        warehouseId: string
        warehouseName: string
        totalValue: number
        itemCount: number
      }
    >()
    for (const s of allStocks) {
      const unitPrice = Number(s.averageCost || s.item.costPrice || 0)
      const tv = s.quantityReal * unitPrice
      const existing = warehouseMap.get(s.warehouseId)
      if (existing) {
        existing.totalValue += tv
        existing.itemCount += 1
      } else {
        warehouseMap.set(s.warehouseId, {
          warehouseId: s.warehouseId,
          warehouseName: s.warehouse.name,
          totalValue: tv,
          itemCount: 1,
        })
      }
    }
    const byWarehouse = Array.from(warehouseMap.values()).sort(
      (a, b) => b.totalValue - a.totalValue
    )

    const allValuesSorted = allStocks
      .map((s: any) => {
        const unitPrice = Number(s.averageCost || s.item.costPrice || 0)
        return {
          itemName: s.item.name,
          itemSKU: s.item.sku,
          warehouseName: s.warehouse.name,
          totalValue: s.quantityReal * unitPrice,
        }
      })
      .sort((a: any, b: any) => b.totalValue - a.totalValue)

    const top5Items = allValuesSorted.slice(0, 5).map((s: any) => ({
      itemName: s.itemName,
      itemSKU: s.itemSKU,
      warehouseName: s.warehouseName,
      totalValue: s.totalValue,
      percentage:
        totalInventoryValue > 0
          ? Number(((s.totalValue / totalInventoryValue) * 100).toFixed(1))
          : 0,
    }))

    const zeroCostCount = allStocks.filter(
      (s: any) => Number(s.averageCost || s.item.costPrice || 0) === 0
    ).length
    const distinctItems = new Set(allStocks.map((s: any) => s.itemId)).size

    // Paginate filtered results
    const total = allValues.length
    const paginated = allValues.slice((page - 1) * limit, page * limit)

    const enrichedValues = paginated.map((s: any) => ({
      ...s,
      percentageOfTotal:
        totalInventoryValue > 0
          ? Number(((s.totalValue / totalInventoryValue) * 100).toFixed(2))
          : 0,
    }))

    return {
      data: enrichedValues,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalInventoryValue,
        filteredValue:
          filters.search || filters.warehouseId || filters.zeroCostOnly
            ? filteredValue
            : totalInventoryValue,
        isFiltered: !!(
          filters.search ||
          filters.warehouseId ||
          filters.zeroCostOnly
        ),
        byWarehouse,
        top5Items,
        zeroCostCount,
        distinctItems,
        totalStockEntries: allStocks.length,
      },
    }
  } catch (error) {
    console.error('Error generating stock value report:', error)
    throw error
  }
}

export default { getStockValueReport }
