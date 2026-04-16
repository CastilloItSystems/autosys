import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

type HistoryItem = {
  id: string
  type: 'RESERVATION' | 'QUOTE' | 'TEST_DRIVE' | 'TRADE_IN' | 'FINANCING' | 'DELIVERY'
  number: string
  status: string
  customerName: string
  unitRef: string
  occurredAt: Date
}

class DealerHistoryService {
  async getHistory(
    empresaId: string,
    db: PrismaClientType,
    options: { page: number; limit: number; search?: string }
  ): Promise<{ data: HistoryItem[]; total: number }> {
    const prisma = db as PrismaClient
    const { page, limit, search } = options
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const searchWhere =
      search && search.trim()
        ? {
            OR: [
              { customerName: { contains: search.trim(), mode: 'insensitive' as const } },
              { customerDocument: { contains: search.trim(), mode: 'insensitive' as const } },
              { customerPhone: { contains: search.trim(), mode: 'insensitive' as const } },
            ],
          }
        : {}

    const [reservations, quotes, testDrives, tradeIns, financing, deliveries] = await Promise.all([
      prisma.dealerReservation.findMany({
        where: { empresaId, isActive: true, ...searchWhere },
        include: { dealerUnit: { select: { code: true, vin: true } } },
        take: 300,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.dealerQuote.findMany({
        where: { empresaId, isActive: true, ...searchWhere },
        include: { dealerUnit: { select: { code: true, vin: true } } },
        take: 300,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.dealerTestDrive.findMany({
        where: { empresaId, isActive: true, ...searchWhere },
        include: { dealerUnit: { select: { code: true, vin: true } } },
        take: 300,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.dealerTradeIn.findMany({
        where: { empresaId, isActive: true, ...searchWhere },
        include: { targetDealerUnit: { select: { code: true, vin: true } } },
        take: 300,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.dealerFinancing.findMany({
        where: { empresaId, isActive: true, ...searchWhere },
        include: { dealerUnit: { select: { code: true, vin: true } } },
        take: 300,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.dealerDelivery.findMany({
        where: { empresaId, isActive: true, ...searchWhere },
        include: { dealerUnit: { select: { code: true, vin: true } } },
        take: 300,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const merged: HistoryItem[] = [
      ...reservations.map((item) => ({
        id: item.id,
        type: 'RESERVATION' as const,
        number: item.reservationNumber,
        status: item.status,
        customerName: item.customerName,
        unitRef: item.dealerUnit.code || item.dealerUnit.vin || item.dealerUnitId,
        occurredAt: item.createdAt,
      })),
      ...quotes.map((item) => ({
        id: item.id,
        type: 'QUOTE' as const,
        number: item.quoteNumber,
        status: item.status,
        customerName: item.customerName,
        unitRef: item.dealerUnit.code || item.dealerUnit.vin || item.dealerUnitId,
        occurredAt: item.createdAt,
      })),
      ...testDrives.map((item) => ({
        id: item.id,
        type: 'TEST_DRIVE' as const,
        number: item.testDriveNumber,
        status: item.status,
        customerName: item.customerName,
        unitRef: item.dealerUnit.code || item.dealerUnit.vin || item.dealerUnitId,
        occurredAt: item.createdAt,
      })),
      ...tradeIns.map((item) => ({
        id: item.id,
        type: 'TRADE_IN' as const,
        number: item.tradeInNumber,
        status: item.status,
        customerName: item.customerName,
        unitRef: item.targetDealerUnit?.code || item.targetDealerUnit?.vin || item.targetDealerUnitId || '-',
        occurredAt: item.createdAt,
      })),
      ...financing.map((item) => ({
        id: item.id,
        type: 'FINANCING' as const,
        number: item.financingNumber,
        status: item.status,
        customerName: item.customerName,
        unitRef: item.dealerUnit.code || item.dealerUnit.vin || item.dealerUnitId,
        occurredAt: item.createdAt,
      })),
      ...deliveries.map((item) => ({
        id: item.id,
        type: 'DELIVERY' as const,
        number: item.deliveryNumber,
        status: item.status,
        customerName: item.customerName,
        unitRef: item.dealerUnit.code || item.dealerUnit.vin || item.dealerUnitId,
        occurredAt: item.createdAt,
      })),
    ].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())

    const total = merged.length
    const data = merged.slice(skip, skip + take)
    return { data, total }
  }
}

export default new DealerHistoryService()
