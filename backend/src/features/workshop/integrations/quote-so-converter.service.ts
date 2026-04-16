/**
 * Quote to ServiceOrder Converter Service
 * FASE 1.2: Convert CRM quotes (type=SERVICE) to Workshop ServiceOrders
 *
 * Bridge between CRM quotation system and Workshop order fulfillment
 */

import type {
  PrismaClient,
  Quote,
  ServiceOrder,
} from '../../../generated/prisma/client.js'
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '../../../shared/utils/apiError.js'
import { generateFolio } from '../serviceOrders/serviceOrders.service.js'

type PrismaClientType =
  | PrismaClient
  | Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >

/**
 * Convert a CRM Quote (type=SERVICE) to a Workshop ServiceOrder
 *
 * @param prisma - Prisma client
 * @param quoteId - ID of the quote to convert
 * @param userId - User ID performing the conversion (for audit)
 * @returns Created ServiceOrder
 */
export async function convertQuoteToServiceOrder(
  prisma: PrismaClientType,
  quoteId: string,
  userId: string
): Promise<ServiceOrder> {
  // 1. Fetch the quote
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      items: true,
      customer: true,
      empresa: true,
      serviceOrders: true, // Check if already converted
    },
  })

  if (!quote) {
    throw new NotFoundError(`Quote ${quoteId} not found`)
  }

  // 2. Validate quote for conversion
  if (quote.type !== 'SERVICE') {
    throw new BadRequestError(
      `Quote type must be SERVICE, got ${quote.type}. Only SERVICE quotes can be converted to ServiceOrders.`
    )
  }

  if (quote.status !== 'APPROVED') {
    throw new BadRequestError(
      `Quote must be APPROVED to convert, current status: ${quote.status}`
    )
  }

  if (quote.serviceOrders.length > 0) {
    throw new ConflictError(
      `Quote ${quoteId} already converted to ServiceOrder: ${quote.serviceOrders.map((so) => so.id).join(', ')}. Only one conversion per quote allowed.`
    )
  }

  if (!quote.items || quote.items.length === 0) {
    throw new BadRequestError(
      'Quote must have at least one item to convert to ServiceOrder'
    )
  }

  // 3. Generate folio for new SO
  const folio = await generateFolio(prisma, quote.empresaId)

  // 4. Create ServiceOrder from Quote
  const serviceOrder = await prisma.serviceOrder.create({
    data: {
      folio,
      empresaId: quote.empresaId,
      createdBy: userId,

      // Link to quote
      workshopQuoteId: quoteId,

      // Customer from quote
      customerId: quote.customerId,

      // Status starts at DRAFT (can immediately open or keep draft for review)
      status: 'DRAFT',
      priority: 'NORMAL',

      // Pre-populate from quote fields if available
      diagnosisNotes: quote.vehicleReceptionNotes || undefined,
      internalNotes: quote.notes || undefined,

      // Estimated delivery from quote validUntil or use default
      estimatedDelivery: quote.validUntil || undefined,

      // Create items from quote items
      items: {
        create: quote.items.map((qItem) => ({
          description: qItem.description,
          quantity: Number(qItem.quantity),
          unitPrice: Number(qItem.unitPrice),
          discountPct: Number(qItem.discountPct || 0),
          // Tax from quote
          taxType: 'IVA', // Default, can be customized per item
          taxRate: Number(qItem.taxPct || 0.16),
          taxAmount:
            Math.round(
              Number(qItem.quantity) *
                Number(qItem.unitPrice) *
                Number(qItem.taxPct || 0.16) *
                100
            ) / 100,
          notes: qItem.notes || undefined,
          type: 'LABOR', // Default type for quote items; can be refined by customer
          total: Number(qItem.total),
        })),
      },
    },
    include: {
      items: true,
      workshopQuote: true,
    },
  })

  // 5. Update Quote conversion metadata
  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      status: 'CONVERTED',
      convertedAt: new Date(),
      convertedTo: 'service_order',
      convertedRefId: serviceOrder.id, // Keep old field for backwards compatibility
      convertedToSOId: serviceOrder.id, // New field for explicit SO reference
    },
  })

  return serviceOrder
}

/**
 * Get the Quote associated with a ServiceOrder
 * Useful for audit trail and workflow tracking
 *
 * @param prisma - Prisma client
 * @param serviceOrderId - ID of the service order
 * @returns Associated Quote if exists, null otherwise
 */
export async function getServiceOrderQuote(
  prisma: PrismaClientType,
  serviceOrderId: string
): Promise<Quote | null> {
  const serviceOrder = await prisma.serviceOrder.findUnique({
    where: { id: serviceOrderId },
    include: { workshopQuote: true },
  })

  if (!serviceOrder) {
    throw new NotFoundError(`ServiceOrder ${serviceOrderId} not found`)
  }

  return serviceOrder.workshopQuote
}

/**
 * Validate that a ServiceOrder cannot advance past certain statuses
 * unless the originating Quote was approved
 *
 * This enforces business rule: SO cannot execute work without quote approval
 *
 * @param prisma - Prisma client
 * @param serviceOrderId - ID of the service order
 * @param proposedStatus - Status the SO is trying to transition to
 * @throws Error if quote not approved and trying to execute work
 */
export async function validateSOQuoteApproval(
  prisma: PrismaClientType,
  serviceOrderId: string,
  proposedStatus: string
): Promise<void> {
  // These statuses require quote approval
  const REQUIRES_QUOTE_APPROVAL = [
    'APPROVED',
    'IN_PROGRESS',
    'QUALITY_CHECK',
    'READY',
    'DELIVERED',
    'INVOICED',
    'CLOSED',
  ]

  if (!REQUIRES_QUOTE_APPROVAL.includes(proposedStatus)) {
    // Transaction phases (DIAGNOSING, PENDING_APPROVAL) don't require quote yet
    return
  }

  const serviceOrder = await prisma.serviceOrder.findUnique({
    where: { id: serviceOrderId },
    include: {
      quotations: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  })

  if (!serviceOrder) {
    throw new NotFoundError(`ServiceOrder ${serviceOrderId} not found`)
  }

  // Si no hay cotizaciones de taller asociadas, se permite flujo interno.
  if (!serviceOrder.quotations.length) {
    return
  }

  const hasApprovedWorkshopQuotation = serviceOrder.quotations.some((q) =>
    ['APPROVED_TOTAL', 'APPROVED_PARTIAL', 'CONVERTED'].includes(q.status)
  )

  if (!hasApprovedWorkshopQuotation) {
    throw new BadRequestError(
      `ServiceOrder ${serviceOrderId} cannot transition to ${proposedStatus}. It requires an approved WorkshopQuotation (APPROVED_TOTAL, APPROVED_PARTIAL, or CONVERTED).`
    )
  }
}
