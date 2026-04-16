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
}

export default new DealerDashboardService()
