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

    // taxRate ya está almacenado como decimal (0.16 = 16%), no dividir entre 100
    const lineTax =
      item.taxType === 'EXEMPT' ? 0 : lineBase * Number(item.taxRate || 0.16)

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

// ─── F3-12: Budget vs Invoice Reconciliation ─────────────────────────────────

export type ReconciliationStatus =
  | 'IN_BUDGET'
  | 'OVER_BUDGET'
  | 'UNDER_BUDGET'
  | 'NO_QUOTATION'
  | 'NO_BILLING'

export interface BudgetInvoiceVariance {
  hasQuotation: boolean
  hasBilling: boolean
  quotation: {
    id: string
    quotationNumber: string
    status: string
    version: number
    approvedTotal: number
    totalItems: number
    approvedItems: number
    approvalType: string | null
    approvalChannel: string | null
    approvedAt: Date | null
    breakdown: { labor: number; parts: number; external: number; other: number }
  } | null
  billing: {
    source: 'INVOICE' | 'PRE_INVOICE'
    number: string
    status: string
    total: number
    baseImponible: number
    taxAmount: number
    igtfAmount: number
  } | null
  reconciliation: {
    status: ReconciliationStatus
    variance: number
    variancePct: number | null
    breakdown: {
      labor: { quoted: number; billed: number; variance: number }
      parts: { quoted: number; billed: number; variance: number }
      other: { quoted: number; billed: number; variance: number }
    }
  }
}

/**
 * F3-12: Compare approved WorkshopQuotation vs actual PreInvoice/Invoice
 * for a given ServiceOrder. Returns variance analysis.
 */
export async function getBudgetInvoiceVariance(
  prisma: PrismaClientType,
  serviceOrderId: string,
  empresaId: string
): Promise<BudgetInvoiceVariance> {
  const db = prisma as PrismaClient

  const so = await db.serviceOrder.findFirst({
    where: { id: serviceOrderId, empresaId },
    include: {
      quotations: {
        include: {
          items: true,
          approvals: { orderBy: { approvedAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      },
      invoice: true,
      items: true,
    },
  })

  if (!so) throw new NotFoundError(`ServiceOrder ${serviceOrderId} not found`)

  // ── Pick best quotation: approved first, then latest ──────────────────────
  const APPROVED_STATUSES = ['APPROVED_TOTAL', 'APPROVED_PARTIAL', 'CONVERTED']
  const approvedQ =
    so.quotations.find((q) => APPROVED_STATUSES.includes(q.status)) ??
    so.quotations[0] ??
    null

  // ── Quotation side ────────────────────────────────────────────────────────
  let quotationData: BudgetInvoiceVariance['quotation'] = null
  let qBreakdown = { labor: 0, parts: 0, external: 0, other: 0 }

  if (approvedQ) {
    const approvedItems = approvedQ.items.filter((i) => i.approved)
    const latestApproval = approvedQ.approvals[0] ?? null

    for (const item of approvedItems) {
      const v = Number(item.total)
      if (item.type === 'LABOR') qBreakdown.labor += v
      else if (item.type === 'PART' || item.type === 'CONSUMABLE')
        qBreakdown.parts += v
      else if (item.type === 'EXTERNAL_SERVICE') qBreakdown.external += v
      else qBreakdown.other += v
    }

    const approvedTotal =
      qBreakdown.labor +
      qBreakdown.parts +
      qBreakdown.external +
      qBreakdown.other

    quotationData = {
      id: approvedQ.id,
      quotationNumber: approvedQ.quotationNumber,
      status: approvedQ.status,
      version: approvedQ.version,
      approvedTotal,
      totalItems: approvedQ.items.length,
      approvedItems: approvedItems.length,
      approvalType: latestApproval?.type ?? null,
      approvalChannel: latestApproval?.channel ?? null,
      approvedAt: latestApproval?.approvedAt ?? null,
      breakdown: qBreakdown,
    }
  }

  // ── Billing side (invoice preferred over pre-invoice) ─────────────────────
  let billingData: BudgetInvoiceVariance['billing'] = null
  let billingTotal = 0
  let bBreakdown = { labor: 0, parts: 0, other: 0 }

  const billingSource = so.invoice ?? null

  if (billingSource) {
    const isInvoice = !!so.invoice
    billingTotal = Number(billingSource.total)
    billingData = {
      source: isInvoice ? 'INVOICE' : 'PRE_INVOICE',
      number: isInvoice ? (so.invoice as any).invoiceNumber : 'N/A',
      status: billingSource.status,
      total: billingTotal,
      baseImponible: Number((billingSource as any).baseImponible ?? 0),
      taxAmount: Number((billingSource as any).taxAmount ?? 0),
      igtfAmount: Number((billingSource as any).igtfAmount ?? 0),
    }

    // SO items breakdown for billing side
    for (const item of so.items) {
      const v = Number(item.total)
      if (item.type === 'LABOR') bBreakdown.labor += v
      else if (item.type === 'PART') bBreakdown.parts += v
      else bBreakdown.other += v
    }
  }

  // ── Reconciliation ────────────────────────────────────────────────────────
  let reconcStatus: ReconciliationStatus = 'NO_QUOTATION'
  let variance = 0
  let variancePct: number | null = null

  if (!approvedQ) {
    reconcStatus = 'NO_QUOTATION'
  } else if (!billingSource) {
    reconcStatus = 'NO_BILLING'
  } else {
    const approvedTotal = quotationData!.approvedTotal
    variance = billingTotal - approvedTotal
    variancePct = approvedTotal > 0 ? (variance / approvedTotal) * 100 : null

    if (Math.abs(variance) < 0.01) reconcStatus = 'IN_BUDGET'
    else if (variance > 0) reconcStatus = 'OVER_BUDGET'
    else reconcStatus = 'UNDER_BUDGET'
  }

  return {
    hasQuotation: !!approvedQ,
    hasBilling: !!billingSource,
    quotation: quotationData,
    billing: billingData,
    reconciliation: {
      status: reconcStatus,
      variance,
      variancePct,
      breakdown: {
        labor: {
          quoted: qBreakdown.labor,
          billed: bBreakdown.labor,
          variance: bBreakdown.labor - qBreakdown.labor,
        },
        parts: {
          quoted: qBreakdown.parts + qBreakdown.external,
          billed: bBreakdown.parts,
          variance: bBreakdown.parts - (qBreakdown.parts + qBreakdown.external),
        },
        other: {
          quoted: qBreakdown.other,
          billed: bBreakdown.other,
          variance: bBreakdown.other - qBreakdown.other,
        },
      },
    },
  }
}
