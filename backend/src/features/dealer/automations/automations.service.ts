import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

type DealerAutomationAlert = {
  key: string
  severity: 'info' | 'warning' | 'danger'
  message: string
  count: number
}

class DealerAutomationsService {
  async getAlerts(empresaId: string, db: PrismaClientType): Promise<DealerAutomationAlert[]> {
    const prisma = db as PrismaClient
    const now = new Date()
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    const [expiringReservations, expiringQuotes, todayTestDrives, documentsExpiring] = await Promise.all([
      prisma.dealerReservation.count({
        where: {
          empresaId,
          isActive: true,
          status: { in: ['PENDING', 'CONFIRMED'] },
          expiresAt: { gte: now, lte: in48h },
        },
      }),
      prisma.dealerQuote.count({
        where: {
          empresaId,
          isActive: true,
          status: { in: ['DRAFT', 'SENT', 'NEGOTIATING', 'APPROVED'] },
          validUntil: { gte: now, lte: in48h },
        },
      }),
      prisma.dealerTestDrive.count({
        where: {
          empresaId,
          isActive: true,
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          scheduledAt: { gte: new Date(now.toDateString()), lte: new Date(in48h.toDateString()) },
        },
      }),
      prisma.dealerDocument.count({
        where: {
          empresaId,
          isActive: true,
          status: { in: ['PENDING', 'VALID'] },
          expiresAt: { gte: now, lte: in48h },
        },
      }),
    ])

    return [
      {
        key: 'reservations_expiring_48h',
        severity: expiringReservations > 0 ? 'warning' : 'info',
        message: 'Reservas por vencer en las próximas 48h',
        count: expiringReservations,
      },
      {
        key: 'quotes_expiring_48h',
        severity: expiringQuotes > 0 ? 'warning' : 'info',
        message: 'Cotizaciones por vencer en las próximas 48h',
        count: expiringQuotes,
      },
      {
        key: 'test_drives_upcoming',
        severity: todayTestDrives > 0 ? 'info' : 'info',
        message: 'Pruebas de manejo agendadas (hoy y próximas 48h)',
        count: todayTestDrives,
      },
      {
        key: 'documents_expiring_48h',
        severity: documentsExpiring > 0 ? 'danger' : 'info',
        message: 'Documentos próximos a vencer en 48h',
        count: documentsExpiring,
      },
    ]
  }

  async runChecks(empresaId: string, db: PrismaClientType) {
    const alerts = await this.getAlerts(empresaId, db)
    const summary = {
      generatedAt: new Date().toISOString(),
      totalAlerts: alerts.reduce((acc, a) => acc + a.count, 0),
      alerts,
    }
    logger.info('Dealer automations checks executed', { empresaId, totalAlerts: summary.totalAlerts })
    return summary
  }
}

export default new DealerAutomationsService()
