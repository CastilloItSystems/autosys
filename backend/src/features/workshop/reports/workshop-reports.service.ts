// backend/src/features/workshop/reports/workshop-reports.service.ts
// OPCIÓN C: Workshop Reports & Analytics

import type { PrismaClient } from '../../../generated/prisma/client.js'

/**
 * REPORTE 1: Service Orders Report
 * Órdenes de trabajo por estado, técnico, fechas
 */
export async function getServiceOrdersReport(
  prisma: PrismaClient,
  empresaId: string,
  filters?: { startDate?: Date; endDate?: Date }
) {
  try {
    const where: any = { empresaId }
    if (filters?.startDate && filters?.endDate) {
      where.createdAt = { gte: filters.startDate, lte: filters.endDate }
    }

    const orders = await prisma.serviceOrder.findMany({
      where,
      select: {
        folio: true,
        status: true,
        createdAt: true,
        estimatedDelivery: true,
        deliveredAt: true,
        total: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const stats = {
      total: orders.length,
      byStatus: {} as Record<string, number>,
      totalRevenue: 0,
    }

    for (const order of orders) {
      stats.byStatus[order.status] = (stats.byStatus[order.status] || 0) + 1
      stats.totalRevenue += Number(order.total) || 0
    }

    return {
      reportName: 'Reporte de Órdenes de Trabajo',
      generatedAt: new Date(),
      period: filters,
      statistics: stats,
      count: orders.length,
    }
  } catch (error) {
    console.error('Error generating service orders report:', error)
    return { reportName: 'Reporte de Órdenes de Trabajo', error: String(error) }
  }
}

/**
 * REPORTE 2: Technician Productivity
 * Productividad por técnico: horas trabajadas
 */
export async function getTechnicianProductivityReport(
  prisma: PrismaClient,
  empresaId: string,
  filters?: { startDate?: Date; endDate?: Date }
) {
  try {
    const where: any = { serviceOrder: { empresaId } }
    if (filters?.startDate && filters?.endDate) {
      where.createdAt = { gte: filters.startDate, lte: filters.endDate }
    }

    const laborTimes = await prisma.laborTime.findMany({
      where,
      select: {
        technicianId: true,
        standardMinutes: true,
        realMinutes: true,
      },
      take: 1000,
    })

    const techMetrics = new Map<string, any>()
    for (const labor of laborTimes) {
      const tid = labor.technicianId || 'unassigned'
      if (!techMetrics.has(tid)) {
        techMetrics.set(tid, { totalHours: 0, count: 0 })
      }
      const m = techMetrics.get(tid)!
      m.totalHours += (labor.realMinutes || 0) / 60
      m.count += 1
    }

    return {
      reportName: 'Reporte de Productividad Técnicos',
      generatedAt: new Date(),
      period: filters,
      technicianCount: techMetrics.size,
      totalLaborHours: Array.from(techMetrics.values()).reduce(
        (s, m) => s + m.totalHours,
        0
      ),
    }
  } catch (error) {
    console.error('Error generating productivity report:', error)
    return { reportName: 'Reporte de Productividad', error: String(error) }
  }
}

/**
 * REPORTE 3: Operational Efficiency
 * Eficiencia operativa: cumplimiento de fechas
 */
export async function getOperationalEfficiencyReport(
  prisma: PrismaClient,
  empresaId: string,
  filters?: { startDate?: Date; endDate?: Date }
) {
  try {
    const where: any = {
      empresaId,
      status: { in: ['DELIVERED', 'INVOICED', 'CLOSED'] },
    }
    if (filters?.startDate && filters?.endDate) {
      where.createdAt = { gte: filters.startDate, lte: filters.endDate }
    }

    const orders = await prisma.serviceOrder.findMany({
      where,
      select: {
        deliveredAt: true,
        estimatedDelivery: true,
        receivedAt: true,
      },
      take: 500,
    })

    const delayed = orders.filter(
      (o) =>
        o.deliveredAt &&
        o.estimatedDelivery &&
        o.deliveredAt > o.estimatedDelivery
    )

    const onTimeRate =
      orders.length > 0
        ? (((orders.length - delayed.length) / orders.length) * 100).toFixed(1)
        : 0

    return {
      reportName: 'Reporte de Eficiencia Operativa',
      generatedAt: new Date(),
      period: filters,
      totalOrders: orders.length,
      delayedOrders: delayed.length,
      onTimePercentage: onTimeRate,
    }
  } catch (error) {
    console.error('Error generating efficiency report:', error)
    return { reportName: 'Reporte de Eficiencia', error: String(error) }
  }
}

/**
 * REPORTE 4: Materials Used Report
 */
export async function getMaterialsUsedReport(
  prisma: PrismaClient,
  empresaId: string,
  filters?: { startDate?: Date; endDate?: Date }
) {
  try {
    const where: any = { empresaId }
    if (filters?.startDate && filters?.endDate) {
      where.createdAt = { gte: filters.startDate, lte: filters.endDate }
    }

    const materials = await prisma.serviceOrderMaterial.findMany({
      where,
      select: {
        description: true,
        quantityConsumed: true,
        unitCost: true,
        unitPrice: true,
      },
      take: 500,
    })

    let totalCost = 0
    let totalPrice = 0
    for (const m of materials) {
      const qty = Number(m.quantityConsumed) || 0
      totalCost += (Number(m.unitCost) || 0) * qty
      totalPrice += (Number(m.unitPrice) || 0) * qty
    }

    return {
      reportName: 'Reporte de Materiales Utilizados',
      generatedAt: new Date(),
      period: filters,
      materialCount: materials.length,
      totalCost: totalCost.toFixed(2),
      totalPrice: totalPrice.toFixed(2),
      margin:
        totalPrice > 0
          ? (((totalPrice - totalCost) / totalPrice) * 100).toFixed(2)
          : '0',
    }
  } catch (error) {
    console.error('Error generating materials report:', error)
    return { reportName: 'Reporte de Materiales', error: String(error) }
  }
}

/**
 * REPORTE 5: Warranty Claims Report
 */
export async function getWarrantyClaimsReport(
  prisma: PrismaClient,
  empresaId: string,
  filters?: { startDate?: Date; endDate?: Date }
) {
  try {
    const where: any = { empresaId }
    if (filters?.startDate && filters?.endDate) {
      where.createdAt = { gte: filters.startDate, lte: filters.endDate }
    }

    const warranties = await prisma.workshopWarranty.findMany({
      where,
      select: {
        warrantyNumber: true,
        status: true,
        type: true,
        rootCause: true,
      },
      take: 500,
    })

    const byStatus: Record<string, number> = {}
    for (const w of warranties) {
      byStatus[w.status] = (byStatus[w.status] || 0) + 1
    }

    return {
      reportName: 'Reporte de Garantías y Retrabajos',
      generatedAt: new Date(),
      period: filters,
      total: warranties.length,
      byStatus,
    }
  } catch (error) {
    console.error('Error generating warranty report:', error)
    return { reportName: 'Reporte de Garantías', error: String(error) }
  }
}

/**
 * REPORTE 6: Financial Summary
 */
export async function getFinancialSummaryReport(
  prisma: PrismaClient,
  empresaId: string,
  filters?: { startDate?: Date; endDate?: Date }
) {
  try {
    const where: any = { empresaId }
    if (filters?.startDate && filters?.endDate) {
      where.createdAt = { gte: filters.startDate, lte: filters.endDate }
    }

    const orders = await prisma.serviceOrder.findMany({
      where,
      select: {
        total: true,
        laborTotal: true,
        partsTotal: true,
      },
      take: 1000,
    })

    let totalRevenue = 0
    let totalLaborCost = 0
    let totalPartsCost = 0

    for (const order of orders) {
      totalRevenue += Number(order.total) || 0
      totalLaborCost += Number(order.laborTotal) || 0
      totalPartsCost += Number(order.partsTotal) || 0
    }

    const totalCost = totalLaborCost + totalPartsCost
    const margin = totalRevenue - totalCost

    return {
      reportName: 'Reporte Financiero del Taller',
      generatedAt: new Date(),
      period: filters,
      totalRevenue: totalRevenue.toFixed(2),
      totalLaborCost: totalLaborCost.toFixed(2),
      totalPartsCost: totalPartsCost.toFixed(2),
      totalCost: totalCost.toFixed(2),
      margin: margin.toFixed(2),
      ordersCount: orders.length,
    }
  } catch (error) {
    console.error('Error generating financial report:', error)
    return { reportName: 'Reporte Financiero', error: String(error) }
  }
}

/**
 * Execute all reports in parallel
 */
export async function getAllReports(
  prisma: PrismaClient,
  empresaId: string,
  filters?: { startDate?: Date; endDate?: Date }
) {
  try {
    const [
      serviceOrders,
      productivity,
      efficiency,
      materials,
      warranty,
      financial,
    ] = await Promise.all([
      getServiceOrdersReport(prisma, empresaId, filters),
      getTechnicianProductivityReport(prisma, empresaId, filters),
      getOperationalEfficiencyReport(prisma, empresaId, filters),
      getMaterialsUsedReport(prisma, empresaId, filters),
      getWarrantyClaimsReport(prisma, empresaId, filters),
      getFinancialSummaryReport(prisma, empresaId, filters),
    ])

    return {
      generatedAt: new Date(),
      period: filters || { note: 'All time' },
      reports: {
        serviceOrders,
        productivity,
        efficiency,
        materials,
        warranty,
        financial,
      },
    }
  } catch (error) {
    console.error('Error generating all reports:', error)
    return { error: String(error) }
  }
}
