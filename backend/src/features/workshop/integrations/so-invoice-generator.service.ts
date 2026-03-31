/**
 * ServiceOrder to Invoice Generator Service
 * FASE 2.7: Generate invoices from completed Workshop ServiceOrders
 *
 * Bridge between Workshop order fulfillment and Sales invoicing
 * Converts SO items (labor + materials consumed) into fiscal invoice
 */

import { Decimal } from '@/generated/prisma/internal/prismaNamespace.js'
import type {
  PrismaClient,
  ServiceOrder,
  PreInvoice,
  Invoice,
} from '../../../generated/prisma/client.js'
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '../../../shared/utils/apiError.js'

type PrismaClientType =
  | PrismaClient
  | Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >

/**
 * Validate that ServiceOrder can be invoiced
 *
 * @param so - ServiceOrder to validate
 * @throws Error if SO doesn't meet invoicing criteria
 */
function validateSOReadyForInvoicing(
  so: ServiceOrder & { qualityCheck?: any }
): void {
  // SO must be at specific status (delivery complete or ready)
  const INVOICEABLE_STATUSES = ['READY', 'DELIVERED', 'INVOICED']
  if (!INVOICEABLE_STATUSES.includes(so.status)) {
    throw new BadRequestError(
      `ServiceOrder ${so.folio} status ${so.status} not ready for invoicing. Must be READY, DELIVERED, or INVOICED.`
    )
  }
}

/**
 * Generate PreInvoice from ServiceOrder
 * This is typically called by the business logic when SO transitions to READY
 *
 * @param prisma - Prisma client
 * @param serviceOrderId - ID of the ServiceOrder to invoice
 * @param userId - User ID performing the action (for audit)
 * @returns Created PreInvoice
 */
export async function generatePreInvoiceFromServiceOrder(
  prisma: PrismaClientType,
  serviceOrderId: string,
  userId: string
): Promise<PreInvoice> {
  // 1. Fetch the ServiceOrder with items
  const so = await prisma.serviceOrder.findUnique({
    where: { id: serviceOrderId },
    include: {
      items: true,
      customer: true,
      materials: true,
      additionals: true,
      qualityCheck: true,
      preInvoice: true,
    },
  })

  if (!so) {
    throw new NotFoundError(`ServiceOrder ${serviceOrderId} not found`)
  }

  // 2. Validate SO is ready
  validateSOReadyForInvoicing(so)

  // 3. Check for duplicate PreInvoice
  if (so.preInvoice) {
    throw new ConflictError(
      `ServiceOrder ${so.folio} already has PreInvoice ${so.preInvoice.id}. Cannot create duplicate.`
    )
  }

  // 4. Validate customer exists and belongs to empresa
  if (!so.customer) {
    throw new BadRequestError(`ServiceOrder customer not found`)
  }

  if (!so.items || so.items.length === 0) {
    throw new BadRequestError(
      `ServiceOrder ${so.folio} has no items to invoice`
    )
  }

  // 5. Calculate totals from SO items
  let subtotalBruto = 0
  let taxAmount = 0
  let baseImponible = 0
  let baseExenta = 0

  const preInvoiceItems = so.items.map((item) => {
    const lineSubtotal = Number(item.quantity) * Number(item.unitPrice)
    const lineDiscount = (Number(item.discountPct || 0) * lineSubtotal) / 100
    const lineBase = lineSubtotal - lineDiscount

    const lineTax =
      item.taxType === 'EXEMPT'
        ? 0
        : lineBase * (Number(item.taxRate || 0.16) / 100)

    if (item.taxType === 'EXEMPT') {
      baseExenta += lineBase
    } else {
      baseImponible += lineBase
    }

    subtotalBruto += lineSubtotal
    taxAmount += lineTax

    return {
      itemName: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discountPercent: Number(item.discountPct || 0),
      discountAmount: lineDiscount,
      taxType: item.taxType,
      taxRate: Number(item.taxRate || 0.16),
      taxAmount: lineTax,
      subtotal: lineBase,
      totalLine: lineBase + lineTax,
    }
  })

  // 6. Check if IGTF applies (if currency is not USD, typically)
  const totalDecimal = Number(so.total) || 0
  const igtfApplies = totalDecimal > 0 && totalDecimal > 10000 // Example threshold
  const igtfAmount = igtfApplies ? (baseImponible + taxAmount) * 0.03 : 0 // 3% IGTF

  const total = baseImponible + baseExenta + taxAmount + igtfAmount

  // 7. Generate PreInvoice number (format: PF-YYYYMM-{sequence})
  const now = new Date()
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastPreInvoice = await prisma.preInvoice.findFirst({
    where: {
      empresaId: so.empresaId,
      preInvoiceNumber: { startsWith: `PF-${yearMonth}` },
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
  })
  const sequence = lastPreInvoice
    ? parseInt(lastPreInvoice.preInvoiceNumber.split('-')[2] || '0') + 1
    : 1
  const preInvoiceNumber = `PF-${yearMonth}-${String(sequence).padStart(6, '0')}`

  // 8. Create PreInvoice
  const preInvoice = await prisma.preInvoice.create({
    data: {
      preInvoiceNumber,
      status: 'PENDING_PREPARATION',
      empresaId: so.empresaId,
      serviceOrderId: so.id,
      customerId: so.customerId,
      // warehouseId: null for workshop (no warehouse needed)
      currency: 'USD', // Default for workshop (can be extended)
      discountAmount: 0,
      subtotalBruto,
      baseImponible,
      baseExenta,
      taxAmount,
      taxRate: 16, // Default IVA rate
      igtfApplies,
      igtfRate: 3,
      igtfAmount,
      total,
      notes: `Pre-invoice from ServiceOrder ${so.folio}`,
      preparedBy: userId,
      preparedAt: new Date(),
      items: {
        create: preInvoiceItems.map((item) => ({
          ...item,
          discount: item.discountAmount,
          tax: item.taxAmount,
        })),
      },
    },
    include: {
      items: true,
    },
  })

  // 9. Update ServiceOrder to link PreInvoice
  await prisma.serviceOrder.update({
    where: { id: so.id },
    data: { preInvoice: { connect: { id: preInvoice.id } } },
  })

  return preInvoice
}

/**
 * Generate Invoice from PreInvoice (after payment)
 * Called when Payment.status → COMPLETED
 *
 * This is handled by the Payment service, NOT here
 * We just provide utility function for reference
 *
 * @param prisma - Prisma client
 * @param preInvoiceId - ID of the PreInvoice
 * @param userId - User ID performing the action
 * @returns Created Invoice
 */
export async function generateInvoiceFromPreInvoice(
  prisma: PrismaClientType,
  preInvoiceId: string,
  userId: string
): Promise<Invoice> {
  // 1. Fetch PreInvoice
  const preInvoice = await prisma.preInvoice.findUnique({
    where: { id: preInvoiceId },
    include: {
      serviceOrder: true,
      items: true,
      invoice: true,
    },
  })

  if (!preInvoice) {
    throw new NotFoundError(`PreInvoice ${preInvoiceId} not found`)
  }

  // 2. Check for duplicate invoice
  if (preInvoice.invoice) {
    throw new ConflictError(
      `PreInvoice ${preInvoice.preInvoiceNumber} already has Invoice ${preInvoice.invoice.id}`
    )
  }

  // 3. Generate Invoice number with SENIAT compliance
  // Format: FAC-YYYYMM-{sequence} per empresa
  const now = new Date()
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      empresaId: preInvoice.empresaId,
      invoiceNumber: { startsWith: `FAC-${yearMonth}` },
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
  })
  const sequence = lastInvoice
    ? parseInt(lastInvoice.invoiceNumber.split('-')[2] || '0') + 1
    : 1
  const invoiceNumber = `FAC-${yearMonth}-${String(sequence).padStart(6, '0')}`

  // 4. Ensure Payment exists for this PreInvoice
  let payment = await prisma.payment.findFirst({
    where: { preInvoiceId },
  })

  if (!payment) {
    // Create a default payment record for the PreInvoice
    payment = await prisma.payment.create({
      data: {
        paymentNumber: `PAY-${invoiceNumber}`,
        status: 'COMPLETED', // Assuming payment is completed when generating invoice
        preInvoiceId,
        empresaId: preInvoice.empresaId,
        customerId: preInvoice.customerId,
        method: 'TRANSFER', // Default method
        amount: preInvoice.total,
        currency: preInvoice.currency,
        exchangeRate: preInvoice.exchangeRate || undefined,
        igtfApplies: preInvoice.igtfApplies,
        igtfAmount: preInvoice.igtfAmount,
        totalWithIgtf:
          preInvoice.total.toNumber() > 0
            ? preInvoice.total.plus(preInvoice.igtfAmount)
            : preInvoice.total,
        processedBy: userId,
        processedAt: now,
      },
    })
  }

  // 5. Create Invoice from PreInvoice data
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      fiscalNumber: `SENIAT-${invoiceNumber}`, // Placeholder; actual SENIAT number from external system
      status: 'ACTIVE',
      empresaId: preInvoice.empresaId,
      preInvoiceId: preInvoice.id,
      paymentId: payment.id,
      customerId: preInvoice.customerId,
      currency: preInvoice.currency,
      exchangeRate: preInvoice.exchangeRate,
      discountAmount: preInvoice.discountAmount,
      subtotalBruto: preInvoice.subtotalBruto,
      baseImponible: preInvoice.baseImponible,
      baseExenta: preInvoice.baseExenta,
      taxAmount: preInvoice.taxAmount,
      taxRate: preInvoice.taxRate,
      igtfApplies: preInvoice.igtfApplies,
      igtfRate: preInvoice.igtfRate,
      igtfAmount: preInvoice.igtfAmount,
      total: preInvoice.total,
      notes: preInvoice.notes,
      issuedBy: userId,
      items: {
        create: preInvoice.items.map((item) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          discountAmount: item.discountAmount,
          taxType: item.taxType,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          subtotal: item.subtotal,
          totalLine: item.totalLine,
        })),
      },
    },
    include: {
      items: true,
    },
  })

  // 6. Update ServiceOrder status to INVOICED
  await prisma.serviceOrder.update({
    where: { id: preInvoice.serviceOrderId! },
    data: { status: 'INVOICED', invoiceId: invoice.id },
  })

  return invoice
}

/**
 * Bulk generate PreInvoices from multiple ServiceOrders
 * Useful for end-of-day batch processing
 *
 * @param prisma - Prisma client
 * @param serviceOrderIds - Array of SO IDs
 * @param userId - User ID performing batch action
 * @returns Results with succeeded and failed IDs
 */
export async function bulkGeneratePreInvoices(
  prisma: PrismaClientType,
  serviceOrderIds: string[],
  userId: string
): Promise<{
  succeeded: string[]
  failed: Array<{ id: string; error: string }>
}> {
  const succeeded: string[] = []
  const failed: Array<{ id: string; error: string }> = []

  for (const soId of serviceOrderIds) {
    try {
      await generatePreInvoiceFromServiceOrder(prisma, soId, userId)
      succeeded.push(soId)
    } catch (error: any) {
      failed.push({
        id: soId,
        error: error.message || 'Unknown error',
      })
    }
  }

  return { succeeded, failed }
}

/**
 * Get billing audit trail: SO → PreInvoice → Payment → Invoice
 * Useful for financial reconciliation and customer support
 *
 * @param prisma - Prisma client
 * @param serviceOrderId - ID of ServiceOrder
 * @returns Audit trail object with all linked records
 */
export async function getBillingAuditTrail(
  prisma: PrismaClientType,
  serviceOrderId: string
): Promise<{
  serviceOrder: ServiceOrder & { customer?: any }
  preInvoice?: PreInvoice | null
  invoice?: Invoice | null
  payments?: any[]
}> {
  const so = await prisma.serviceOrder.findUnique({
    where: { id: serviceOrderId },
    include: {
      customer: { select: { id: true, name: true, code: true } },
      preInvoice: true,
      invoice: {
        include: { payment: true },
      },
    },
  })

  if (!so) {
    throw new NotFoundError(`ServiceOrder ${serviceOrderId} not found`)
  }

  return {
    serviceOrder: so,
    preInvoice: so.preInvoice,
    invoice: so.invoice,
    payments: so.invoice?.payment ? [so.invoice.payment] : [],
  }
}
