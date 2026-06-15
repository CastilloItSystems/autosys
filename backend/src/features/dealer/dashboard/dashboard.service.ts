import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

class DealerDashboardService {
  async getOverview(empresaId: string, db: PrismaClientType) {
    const prisma = db as PrismaClient

    const [
      totalUnits,
      availableUnits,
      reservedUnits,
      totalReservations,
      totalQuotes,
      approvedQuotes,
      totalTestDrives,
      completedTestDrives,
      totalTradeIns,
      totalFinancing,
      approvedFinancing,
      totalDeliveries,
      deliveredCount,
    ] = await Promise.all([
      prisma.dealerUnit.count({ where: { empresaId, isActive: true } }),
      prisma.dealerUnit.count({ where: { empresaId, isActive: true, status: 'AVAILABLE' } }),
      prisma.dealerUnit.count({ where: { empresaId, isActive: true, status: 'RESERVED' } }),
      prisma.dealerReservation.count({ where: { empresaId, isActive: true } }),
      prisma.dealerQuote.count({ where: { empresaId, isActive: true } }),
      prisma.dealerQuote.count({ where: { empresaId, isActive: true, status: 'APPROVED' } }),
      prisma.dealerTestDrive.count({ where: { empresaId, isActive: true } }),
      prisma.dealerTestDrive.count({ where: { empresaId, isActive: true, status: 'COMPLETED' } }),
      prisma.dealerTradeIn.count({ where: { empresaId, isActive: true } }),
      prisma.dealerFinancing.count({ where: { empresaId, isActive: true } }),
      prisma.dealerFinancing.count({ where: { empresaId, isActive: true, status: 'APPROVED' } }),
      prisma.dealerDelivery.count({ where: { empresaId, isActive: true } }),
      prisma.dealerDelivery.count({ where: { empresaId, isActive: true, status: 'DELIVERED' } }),
    ])

    return {
      units: { total: totalUnits, available: availableUnits, reserved: reservedUnits },
      reservations: { total: totalReservations },
      quotes: { total: totalQuotes, approved: approvedQuotes },
      testDrives: { total: totalTestDrives, completed: completedTestDrives },
      tradeIns: { total: totalTradeIns },
      financing: { total: totalFinancing, approved: approvedFinancing },
      deliveries: { total: totalDeliveries, delivered: deliveredCount },
    }
  }

  /**
   * KPIs comerciales, financieros y operativos del concesionario (Doc §23).
   * Calcula tasas de conversión del pipeline VEHICULOS, ticket promedio,
   * financiadas vs contado, comisiones y pendientes operativos.
   */
  async getKpis(empresaId: string, db: PrismaClientType) {
    const prisma = db as PrismaClient
    const ratio = (num: number, den: number) => (den > 0 ? Number(((num / den) * 100).toFixed(2)) : 0)

    const [
      leadsVehiculos,
      opportunities,
      wonOpportunities,
      convertedQuotes,
      convertedAgg,
      financedCount,
      pendingDeliveries,
      incompleteDocs,
      activeReservations,
      expiredReservations,
      commissionAgg,
    ] = await Promise.all([
      prisma.lead.count({ where: { empresaId, channel: 'VEHICULOS' } }),
      prisma.opportunity.count({ where: { empresaId, channel: 'VEHICULOS' } }),
      prisma.opportunity.count({ where: { empresaId, channel: 'VEHICULOS', status: 'WON' } }),
      prisma.dealerQuote.count({ where: { empresaId, isActive: true, status: 'CONVERTED' } }),
      prisma.dealerQuote.aggregate({
        where: { empresaId, isActive: true, status: 'CONVERTED' },
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
        _count: { _all: true },
      }),
      prisma.dealerQuote.count({ where: { empresaId, isActive: true, status: 'CONVERTED', financingRequired: true } }),
      prisma.dealerDelivery.count({ where: { empresaId, isActive: true, status: { in: ['SCHEDULED', 'READY'] } } }),
      prisma.dealerDocument.count({ where: { empresaId, isActive: true, status: 'PENDING' } }),
      prisma.dealerReservation.count({ where: { empresaId, isActive: true, status: { in: ['PENDING', 'CONFIRMED'] } } }),
      prisma.dealerReservation.count({ where: { empresaId, isActive: true, status: 'EXPIRED' } }),
      prisma.dealerCommission.aggregate({
        where: { empresaId, isActive: true, status: { in: ['PENDING', 'APPROVED', 'PAID'] } },
        _sum: { commissionAmount: true },
      }),
    ])

    const soldCount = convertedAgg._count._all
    const cashCount = Math.max(soldCount - financedCount, 0)

    return {
      conversion: {
        leadsVehiculos,
        opportunities,
        wonOpportunities,
        convertedQuotes,
        leadToOpportunityPct: ratio(opportunities, leadsVehiculos),
        opportunityToSalePct: ratio(wonOpportunities, opportunities),
      },
      financial: {
        amountSold: Number(convertedAgg._sum.totalAmount ?? 0),
        avgTicket: Number(convertedAgg._avg.totalAmount ?? 0),
        soldCount,
        financedCount,
        cashCount,
        financedVsCashPct: ratio(financedCount, soldCount),
        commissionsTotal: Number(commissionAgg._sum.commissionAmount ?? 0),
      },
      operational: {
        availableUnits: await prisma.dealerUnit.count({ where: { empresaId, isActive: true, status: 'AVAILABLE' } }),
        reservedUnits: await prisma.dealerUnit.count({ where: { empresaId, isActive: true, status: 'RESERVED' } }),
        activeReservations,
        expiredReservations,
        pendingDeliveries,
        incompleteDocuments: incompleteDocs,
      },
    }
  }
}

export default new DealerDashboardService()
