import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

class DealerIntegrationsService {
  async getStatus(empresaId: string, db: PrismaClientType) {
    const prisma = db as PrismaClient

    const [
      reservationsWithoutQuote,
      approvedQuotesWithoutFinancing,
      financedWithoutDelivery,
      deliveredWithoutInvoiceHint,
      crmLeadLikeSignals,
    ] = await Promise.all([
      prisma.dealerReservation.count({
        where: {
          empresaId,
          isActive: true,
          status: { in: ['PENDING', 'CONFIRMED'] },
          dealerUnit: { quotes: { none: {} } },
        },
      }),
      prisma.dealerQuote.count({
        where: {
          empresaId,
          isActive: true,
          status: 'APPROVED',
          dealerUnit: { financing: { none: {} } },
        },
      }),
      prisma.dealerFinancing.count({
        where: {
          empresaId,
          isActive: true,
          status: { in: ['APPROVED', 'DISBURSED'] },
          dealerUnit: { deliveries: { none: {} } },
        },
      }),
      prisma.dealerDelivery.count({
        where: {
          empresaId,
          isActive: true,
          status: 'DELIVERED',
        },
      }),
      prisma.lead.count({
        where: {
          empresaId,
          channel: 'VEHICULOS',
        },
      }),
    ])

    return {
      crm: {
        leadsVehiculos: crmLeadLikeSignals,
      },
      alerts: [
        {
          key: 'reservations_without_quote',
          label: 'Reservas sin cotización asociada',
          count: reservationsWithoutQuote,
          severity: reservationsWithoutQuote > 0 ? 'warning' : 'success',
        },
        {
          key: 'approved_quotes_without_financing',
          label: 'Cotizaciones aprobadas sin caso de financiamiento',
          count: approvedQuotesWithoutFinancing,
          severity: approvedQuotesWithoutFinancing > 0 ? 'warning' : 'success',
        },
        {
          key: 'financing_without_delivery',
          label: 'Financiamientos aprobados sin entrega programada',
          count: financedWithoutDelivery,
          severity: financedWithoutDelivery > 0 ? 'warning' : 'success',
        },
        {
          key: 'delivered_units',
          label: 'Unidades entregadas (validar facturación/contabilidad)',
          count: deliveredWithoutInvoiceHint,
          severity: deliveredWithoutInvoiceHint > 0 ? 'info' : 'success',
        },
      ],
    }
  }
}

export default new DealerIntegrationsService()
