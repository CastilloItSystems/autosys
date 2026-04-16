import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

class DealerReportsService {
  async getExecutiveReport(empresaId: string, db: PrismaClientType) {
    const prisma = db as PrismaClient

    const [
      reservations,
      quotes,
      approvedQuotes,
      convertedQuotes,
      testDrives,
      completedTestDrives,
      deliveries,
      delivered,
      tradeIns,
      financing,
      approvedFinancing,
      expiredReservations,
      expiredQuotes,
    ] = await Promise.all([
      prisma.dealerReservation.count({ where: { empresaId, isActive: true } }),
      prisma.dealerQuote.count({ where: { empresaId, isActive: true } }),
      prisma.dealerQuote.count({ where: { empresaId, isActive: true, status: 'APPROVED' } }),
      prisma.dealerQuote.count({ where: { empresaId, isActive: true, status: 'CONVERTED' } }),
      prisma.dealerTestDrive.count({ where: { empresaId, isActive: true } }),
      prisma.dealerTestDrive.count({ where: { empresaId, isActive: true, status: 'COMPLETED' } }),
      prisma.dealerDelivery.count({ where: { empresaId, isActive: true } }),
      prisma.dealerDelivery.count({ where: { empresaId, isActive: true, status: 'DELIVERED' } }),
      prisma.dealerTradeIn.count({ where: { empresaId, isActive: true } }),
      prisma.dealerFinancing.count({ where: { empresaId, isActive: true } }),
      prisma.dealerFinancing.count({ where: { empresaId, isActive: true, status: 'APPROVED' } }),
      prisma.dealerReservation.count({ where: { empresaId, isActive: true, status: 'EXPIRED' } }),
      prisma.dealerQuote.count({ where: { empresaId, isActive: true, status: 'EXPIRED' } }),
    ])

    const safeRate = (num: number, den: number) => (den > 0 ? Number(((num / den) * 100).toFixed(2)) : 0)

    const conversion = {
      reservationToQuotePct: safeRate(quotes, reservations),
      quoteToApprovedPct: safeRate(approvedQuotes, quotes),
      approvedToConvertedPct: safeRate(convertedQuotes, approvedQuotes),
      testDriveCompletionPct: safeRate(completedTestDrives, testDrives),
      deliveryCompletionPct: safeRate(delivered, deliveries),
      financingApprovalPct: safeRate(approvedFinancing, financing),
    }

    return {
      totals: {
        reservations,
        quotes,
        approvedQuotes,
        convertedQuotes,
        testDrives,
        completedTestDrives,
        deliveries,
        delivered,
        tradeIns,
        financing,
        approvedFinancing,
      },
      conversion,
      risks: {
        expiredReservations,
        expiredQuotes,
      },
    }
  }

  async getPipelineBreakdown(empresaId: string, db: PrismaClientType) {
    const prisma = db as PrismaClient

    const [reservationByStatus, quoteByStatus, testDriveByStatus, financingByStatus, deliveryByStatus] = await Promise.all([
      prisma.dealerReservation.groupBy({ by: ['status'], where: { empresaId, isActive: true }, _count: { _all: true } }),
      prisma.dealerQuote.groupBy({ by: ['status'], where: { empresaId, isActive: true }, _count: { _all: true } }),
      prisma.dealerTestDrive.groupBy({ by: ['status'], where: { empresaId, isActive: true }, _count: { _all: true } }),
      prisma.dealerFinancing.groupBy({ by: ['status'], where: { empresaId, isActive: true }, _count: { _all: true } }),
      prisma.dealerDelivery.groupBy({ by: ['status'], where: { empresaId, isActive: true }, _count: { _all: true } }),
    ])

    return {
      reservations: reservationByStatus.map((x) => ({ status: x.status, count: x._count._all })),
      quotes: quoteByStatus.map((x) => ({ status: x.status, count: x._count._all })),
      testDrives: testDriveByStatus.map((x) => ({ status: x.status, count: x._count._all })),
      financing: financingByStatus.map((x) => ({ status: x.status, count: x._count._all })),
      deliveries: deliveryByStatus.map((x) => ({ status: x.status, count: x._count._all })),
    }
  }
}

export default new DealerReportsService()
