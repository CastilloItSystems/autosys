import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import dealerConfigService from '../config/config.service.js'

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
    const policy = await dealerConfigService.resolve(empresaId, db)
    const now = new Date()
    const window = new Date(now.getTime() + policy.alertWindowHours * 60 * 60 * 1000)
    const slaThreshold = new Date(now.getTime() - policy.leadFollowUpSlaHours * 60 * 60 * 1000)

    const [
      expiringReservations,
      expiringQuotes,
      upcomingTestDrives,
      documentsExpiring,
      staleOpportunities,
      financingUnderReview,
      upcomingDeliveries,
      pendingAfterSales,
    ] = await Promise.all([
      prisma.dealerReservation.count({
        where: {
          empresaId,
          isActive: true,
          status: { in: ['PENDING', 'CONFIRMED'] },
          expiresAt: { gte: now, lte: window },
        },
      }),
      prisma.dealerQuote.count({
        where: {
          empresaId,
          isActive: true,
          status: { in: ['DRAFT', 'SENT', 'NEGOTIATING', 'APPROVED'] },
          validUntil: { gte: now, lte: window },
        },
      }),
      prisma.dealerTestDrive.count({
        where: {
          empresaId,
          isActive: true,
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          scheduledAt: { gte: now, lte: window },
        },
      }),
      prisma.dealerDocument.count({
        where: {
          empresaId,
          isActive: true,
          status: { in: ['PENDING', 'VALID'] },
          expiresAt: { gte: now, lte: window },
        },
      }),
      // Oportunidad estancada: abierta del canal VEHICULOS sin movimiento sobre el SLA
      prisma.opportunity.count({
        where: {
          empresaId,
          channel: 'VEHICULOS',
          status: 'OPEN',
          updatedAt: { lt: slaThreshold },
        },
      }),
      // Financiamientos esperando decisión del banco
      prisma.dealerFinancing.count({
        where: { empresaId, isActive: true, status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
      }),
      // Entregas programadas próximas
      prisma.dealerDelivery.count({
        where: {
          empresaId,
          isActive: true,
          status: { in: ['SCHEDULED', 'READY'] },
          scheduledAt: { gte: now, lte: window },
        },
      }),
      // Postventa abierta sin resolver
      prisma.dealerAfterSale.count({
        where: { empresaId, isActive: true, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
    ])

    const win = policy.alertWindowHours
    return [
      {
        key: 'reservations_expiring',
        severity: expiringReservations > 0 ? 'warning' : 'info',
        message: `Reservas por vencer en las próximas ${win}h`,
        count: expiringReservations,
      },
      {
        key: 'quotes_expiring',
        severity: expiringQuotes > 0 ? 'warning' : 'info',
        message: `Cotizaciones por vencer en las próximas ${win}h`,
        count: expiringQuotes,
      },
      {
        key: 'test_drives_upcoming',
        severity: 'info',
        message: `Pruebas de manejo agendadas (próximas ${win}h)`,
        count: upcomingTestDrives,
      },
      {
        key: 'documents_expiring',
        severity: documentsExpiring > 0 ? 'danger' : 'info',
        message: `Documentos próximos a vencer en ${win}h`,
        count: documentsExpiring,
      },
      {
        key: 'stale_opportunities',
        severity: staleOpportunities > 0 ? 'warning' : 'info',
        message: `Oportunidades VEHICULOS estancadas (sin gestión > ${policy.leadFollowUpSlaHours}h)`,
        count: staleOpportunities,
      },
      {
        key: 'financing_under_review',
        severity: financingUnderReview > 0 ? 'info' : 'info',
        message: 'Financiamientos en análisis bancario',
        count: financingUnderReview,
      },
      {
        key: 'deliveries_upcoming',
        severity: upcomingDeliveries > 0 ? 'info' : 'info',
        message: `Entregas programadas (próximas ${win}h)`,
        count: upcomingDeliveries,
      },
      {
        key: 'after_sales_open',
        severity: pendingAfterSales > 0 ? 'warning' : 'info',
        message: 'Casos de postventa abiertos sin resolver',
        count: pendingAfterSales,
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
