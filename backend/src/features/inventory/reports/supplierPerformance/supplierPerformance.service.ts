/**
 * Supplier Performance Report Service
 * GET /api/inventory/reports/supplier-performance
 */

import prisma from '../../../../services/prisma.service.js'

export interface SupplierPerformanceRow {
  supplierId: string
  supplierName: string
  supplierCode: string
  contactName: string | null
  email: string | null
  totalOrders: number
  completedOrders: number
  cancelledOrders: number
  totalAmount: number
  avgOrderAmount: number
  itemCount: number
  lastOrderDate: string | null
  avgDeliveryDays: number | null
  onTimeRate: number | null
}

export interface SupplierPerformanceSummary {
  totalSuppliers: number
  activeSuppliers: number
  totalOrdersAllTime: number
  totalAmountAllTime: number
  avgOnTimeRate: number | null
}

export interface SupplierPerformanceResult {
  data: SupplierPerformanceRow[]
  summary: SupplierPerformanceSummary
  page: number
  limit: number
  total: number
  totalPages: number
}

export async function getSupplierPerformanceReport(
  page = 1,
  limit = 50,
  empresaId?: string,
  prismaClient?: any
): Promise<SupplierPerformanceResult> {
  const db = prismaClient ?? prisma

  // Fetch all active suppliers for the empresa
  const suppliers = await db.supplier.findMany({
    where: {
      ...(empresaId ? { empresaId } : {}),
      isActive: true,
    },
    orderBy: { name: 'asc' },
  })

  // Fetch all purchase orders grouped with supplier data
  const purchaseOrders = await db.purchaseOrder.findMany({
    where: {
      ...(empresaId ? { supplier: { empresaId } } : {}),
    },
    select: {
      id: true,
      supplierId: true,
      status: true,
      total: true,
      orderDate: true,
      expectedDate: true,
      updatedAt: true,
      items: {
        select: { itemId: true },
      },
      entryNotes: {
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
  })

  // Group orders by supplierId
  const ordersBySupplier = new Map<string, typeof purchaseOrders>()
  for (const po of purchaseOrders) {
    if (!ordersBySupplier.has(po.supplierId)) {
      ordersBySupplier.set(po.supplierId, [])
    }
    ordersBySupplier.get(po.supplierId)!.push(po)
  }

  // Build performance rows
  const rows: SupplierPerformanceRow[] = suppliers.map((supplier: any) => {
    const orders = ordersBySupplier.get(supplier.id) ?? []
    const completedOrders = orders.filter((o: any) => o.status === 'COMPLETED')
    const cancelledOrders = orders.filter((o: any) => o.status === 'CANCELLED')

    const totalAmount = completedOrders.reduce((sum: number, o: any) => sum + Number(o.total ?? 0), 0)
    const avgOrderAmount = completedOrders.length > 0 ? totalAmount / completedOrders.length : 0

    // Unique items ordered across all orders
    const itemIds = new Set<string>()
    for (const o of orders) {
      for (const item of o.items ?? []) {
        itemIds.add(item.itemId)
      }
    }

    // Last order date
    const orderDates = orders
      .map((o: any) => o.orderDate)
      .filter(Boolean)
      .sort((a: Date, b: Date) => b.getTime() - a.getTime())
    const lastOrderDate = orderDates.length > 0 ? orderDates[0].toISOString() : null

    // Avg delivery days: difference between first entry note and order date for completed orders
    const deliveryDays: number[] = []
    for (const o of completedOrders) {
      if (o.entryNotes?.length > 0 && o.orderDate) {
        const entryDate = new Date(o.entryNotes[0].createdAt)
        const ordDate = new Date(o.orderDate)
        const days = Math.round((entryDate.getTime() - ordDate.getTime()) / (1000 * 60 * 60 * 24))
        if (days >= 0) deliveryDays.push(days)
      }
    }
    const avgDeliveryDays =
      deliveryDays.length > 0
        ? Math.round(deliveryDays.reduce((a, b) => a + b, 0) / deliveryDays.length)
        : null

    // On-time rate: orders received on or before expectedDate
    const ordersWithExpected = completedOrders.filter(
      (o: any) => o.expectedDate && o.entryNotes?.length > 0
    )
    let onTimeCount = 0
    for (const o of ordersWithExpected) {
      const entryDate = new Date(o.entryNotes[0].createdAt)
      const expected = new Date(o.expectedDate)
      if (entryDate <= expected) onTimeCount++
    }
    const onTimeRate =
      ordersWithExpected.length > 0
        ? Math.round((onTimeCount / ordersWithExpected.length) * 100)
        : null

    return {
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierCode: supplier.code,
      contactName: supplier.contactName ?? null,
      email: supplier.email ?? null,
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      totalAmount,
      avgOrderAmount,
      itemCount: itemIds.size,
      lastOrderDate,
      avgDeliveryDays,
      onTimeRate,
    }
  })

  // Summary
  const totalAmountAllTime = rows.reduce((sum, r) => sum + r.totalAmount, 0)
  const totalOrdersAllTime = rows.reduce((sum, r) => sum + r.totalOrders, 0)
  const ratesWithData = rows.filter((r) => r.onTimeRate !== null)
  const avgOnTimeRate =
    ratesWithData.length > 0
      ? Math.round(ratesWithData.reduce((sum, r) => sum + r.onTimeRate!, 0) / ratesWithData.length)
      : null

  const summary: SupplierPerformanceSummary = {
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter((s: any) => s.isActive).length,
    totalOrdersAllTime,
    totalAmountAllTime,
    avgOnTimeRate,
  }

  // Paginate
  const total = rows.length
  const totalPages = Math.ceil(total / limit)
  const paginated = rows.slice((page - 1) * limit, page * limit)

  return {
    data: paginated,
    summary,
    page,
    limit,
    total,
    totalPages,
  }
}
