// backend/src/features/sales/payments/payments.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import { CreatePaymentDTO } from './payments.dto.js'
import {
  IPayment,
  PaymentStatus,
  PaymentMethod,
  IPaymentFilters,
} from './payments.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAYMENT_INCLUDE = {
  preInvoice: {
    select: {
      id: true,
      preInvoiceNumber: true,
      status: true,
      total: true,
      orderId: true,
      serviceOrderId: true,
      order: { select: { id: true, orderNumber: true } },
      serviceOrder: { select: { id: true, folio: true } },
    },
  },
  customer: {
    select: { id: true, name: true, code: true, taxId: true },
  },
} as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generatePaymentNumber(): string {
  const year = new Date().getFullYear()
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `PAG-${year}-${ts}${rnd}`
}

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `FAC-${year}-${ts}${rnd}`
}

function generateFiscalNumber(empresaId: string): string {
  const ts = Date.now().toString().slice(-8)
  return `00-${ts}`
}

function generateExitNoteNumber(): string {
  const year = new Date().getFullYear()
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `NS-${year}-${ts}${rnd}`
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class PaymentsService {
  // -------------------------------------------------------------------------
  // CREATE — processes payment + marks PreInvoice as PAID
  // -------------------------------------------------------------------------

  async create(
    data: CreatePaymentDTO,
    empresaId: string,
    userId?: string,
    db: PrismaClientType = {} as PrismaClient
  ): Promise<IPayment> {
    // Validate PreInvoice exists and is payable
    const preInvoice = await (db as PrismaClient).preInvoice.findFirst({
      where: { id: data.preInvoiceId, empresaId },
      include: { items: true, customer: { select: { name: true } } },
    })
    if (!preInvoice) throw new NotFoundError('Pre-factura no encontrada')

    if (
      preInvoice.status !== 'READY_FOR_PAYMENT' &&
      preInvoice.status !== 'PAID' // allow additional partial payments
    ) {
      throw new BadRequestError(
        `La pre-factura debe estar en estado READY_FOR_PAYMENT. Estado actual: ${preInvoice.status}`
      )
    }

    // Calculate how much has been paid already
    const existingPayments = await (db as PrismaClient).payment.findMany({
      where: {
        preInvoiceId: data.preInvoiceId,
        status: PaymentStatus.COMPLETED,
      },
      select: { amount: true },
    })
    const totalPaidSoFar = round2(
      existingPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    )
    const expectedAmount = Number(preInvoice.total)
    const remainingAmount = round2(expectedAmount - totalPaidSoFar)

    if (remainingAmount <= 0) {
      throw new BadRequestError('Esta pre-factura ya está totalmente pagada')
    }

    if (round2(data.amount) > remainingAmount) {
      throw new BadRequestError(
        `El monto ($${data.amount}) excede el saldo pendiente ($${remainingAmount})`
      )
    }

    // Validate mixed payment details sum
    if (data.method === PaymentMethod.MIXED) {
      if (!data.details || data.details.length < 2) {
        throw new BadRequestError(
          'Pago mixto requiere al menos 2 métodos de pago'
        )
      }
      const detailsSum = round2(
        data.details.reduce((sum, d) => sum + Number(d.amount), 0)
      )
      if (detailsSum !== round2(data.amount)) {
        throw new BadRequestError(
          `La suma de los detalles ($${detailsSum}) no coincide con el monto total ($${data.amount})`
        )
      }
    }

    // Calculate IGTF
    const igtfApplies = data.igtfApplies ?? false
    let igtfAmount = 0
    if (igtfApplies) {
      // IGTF applies on the portion paid in foreign currency
      if (data.method === PaymentMethod.MIXED && data.details) {
        // Only on non-VES portions
        const foreignAmount = data.details
          .filter((d) => (d.currency ?? data.currency ?? 'USD') !== 'VES')
          .reduce((sum, d) => sum + Number(d.amount), 0)
        igtfAmount = round2(foreignAmount * 0.03)
      } else {
        igtfAmount = round2(data.amount * 0.03)
      }
    }
    const totalWithIgtf = round2(data.amount + igtfAmount)

    const paymentNumber = generatePaymentNumber()

    const payment = await (db as PrismaClient).$transaction(async (tx) => {
      // 1. Create Payment
      const created = await tx.payment.create({
        data: {
          paymentNumber,
          status: PaymentStatus.COMPLETED,
          empresaId,
          preInvoiceId: data.preInvoiceId,
          customerId: preInvoice.customerId,
          method: data.method as any,
          amount: data.amount,
          currency: (data.currency as any) ?? 'USD',
          exchangeRate: data.exchangeRate ?? null,
          igtfApplies,
          igtfAmount,
          totalWithIgtf,
          details: data.details
            ? JSON.parse(JSON.stringify(data.details))
            : null,
          reference: data.reference ?? null,
          notes: data.notes ?? null,
          processedBy: userId ?? null,
          processedAt: new Date(),
        },
        include: PAYMENT_INCLUDE,
      })

      // 2. Check if PreInvoice is now fully paid
      const newTotalPaid = round2(totalPaidSoFar + data.amount)
      const isFullyPaid = newTotalPaid >= round2(expectedAmount)

      if (isFullyPaid) {
        await tx.preInvoice.update({
          where: { id: data.preInvoiceId },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
        })

        // 3. Generate Invoice (factura fiscal)
        const invoiceNumber = generateInvoiceNumber()
        const fiscalNumber = generateFiscalNumber(empresaId)

        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            fiscalNumber,
            status: 'ACTIVE',
            empresaId,
            preInvoiceId: data.preInvoiceId,
            paymentId: created.id,
            customerId: preInvoice.customerId,
            currency: (preInvoice as any).currency ?? 'USD',
            exchangeRate: (preInvoice as any).exchangeRate ?? null,
            discountAmount: (preInvoice as any).discountAmount ?? 0,
            subtotalBruto: (preInvoice as any).subtotalBruto ?? 0,
            baseImponible: (preInvoice as any).baseImponible ?? 0,
            baseExenta: (preInvoice as any).baseExenta ?? 0,
            taxAmount: (preInvoice as any).taxAmount ?? 0,
            taxRate: (preInvoice as any).taxRate ?? 16,
            igtfApplies: igtfApplies,
            igtfRate: (preInvoice as any).igtfRate ?? 3,
            igtfAmount: igtfAmount,
            total: Number(preInvoice.total),
            notes: preInvoice.notes ?? null,
            issuedBy: userId ?? null,
          },
        })

        // Copy PreInvoice items to Invoice items
        const piItems = preInvoice.items as any[]
        for (const item of piItems) {
          await tx.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              itemId: item.itemId,
              itemName: item.itemName ?? null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountPercent: item.discountPercent ?? 0,
              discountAmount: item.discountAmount ?? 0,
              taxType: (item.taxType as 'IVA' | 'EXEMPT' | 'REDUCED') ?? 'IVA',
              taxRate: item.taxRate ?? 16,
              taxAmount: item.taxAmount ?? 0,
              subtotal: item.subtotal ?? 0,
              totalLine: item.totalLine ?? 0,
            },
          })
        }

        const isWorkshopPreInvoice =
          Boolean((preInvoice as any).serviceOrderId) ||
          !(preInvoice as any).warehouseId

        if (!isWorkshopPreInvoice) {
          // 4. Generate ExitNote tipo SALE (despacho — PENDING, no descuenta stock)
          const exitNoteNumber = generateExitNoteNumber()

          const exitNote = await tx.exitNote.create({
            data: {
              exitNoteNumber,
              type: 'SALE',
              status: 'PENDING',
              warehouseId: (preInvoice as any).warehouseId,
              preInvoiceId: data.preInvoiceId,
              recipientName: (preInvoice as any).customer?.name ?? null,
              reference: invoiceNumber,
              notes: `Despacho automático — Factura ${invoiceNumber}`,
              authorizedBy: userId ?? null,
            },
          })

          // Copy items to ExitNote items and reserve stock
          for (const item of piItems) {
            await tx.exitNoteItem.create({
              data: {
                exitNoteId: exitNote.id,
                itemId: item.itemId,
                itemName: item.itemName ?? null,
                quantity: item.quantity,
              },
            })

            // Reserve stock: product already sold, lock immediately
            const stock = await tx.stock.findUnique({
              where: {
                itemId_warehouseId: {
                  itemId: item.itemId,
                  warehouseId: (preInvoice as any).warehouseId,
                },
              },
            })

            if (!stock) {
              logger.warn(
                `Sin registro de stock para item ${item.itemId} en almacén ${(preInvoice as any).warehouseId}. No se reservó stock.`,
                { preInvoiceId: data.preInvoiceId }
              )
              continue
            }

            await tx.stock.update({
              where: { id: stock.id },
              data: {
                quantityReserved: { increment: item.quantity },
                quantityAvailable: { decrement: item.quantity },
                lastMovementAt: new Date(),
              },
            })
          }

          logger.info(
            `Factura y despacho generados para PreInvoice ${data.preInvoiceId}`,
            {
              invoiceNumber,
              fiscalNumber,
              exitNoteNumber,
              empresaId,
            }
          )
        } else {
          logger.info(
            `Factura generada sin despacho de inventario para PreInvoice de taller ${data.preInvoiceId}`,
            {
              invoiceNumber,
              fiscalNumber,
              empresaId,
            }
          )
        }

      }

      return created
    })

    logger.info(`Pago procesado: ${payment.id}`, {
      paymentNumber,
      method: data.method,
      amount: data.amount,
      igtfAmount,
      empresaId,
      userId,
    })

    return payment as unknown as IPayment
  }

  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------

  async findById(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IPayment> {
    const payment = await (db as PrismaClient).payment.findFirst({
      where: { id, empresaId },
      include: PAYMENT_INCLUDE,
    })
    if (!payment) throw new NotFoundError('Pago no encontrado')
    return payment as unknown as IPayment
  }

  async findAll(
    filters: IPaymentFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: IPayment[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.PaymentWhereInput = { empresaId }
    if (filters.status) where.status = filters.status as any
    if (filters.method) where.method = filters.method as any
    if (filters.customerId) where.customerId = filters.customerId
    if (filters.preInvoiceId) where.preInvoiceId = filters.preInvoiceId
    if (filters.search) {
      const search = filters.search.trim()
      where.OR = [
        { paymentNumber: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const validSortFields = new Set([
      'createdAt',
      'paymentNumber',
      'status',
      'amount',
      'processedAt',
    ])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'createdAt'

    const [data, total] = await Promise.all([
      (db as PrismaClient).payment.findMany({
        where,
        include: PAYMENT_INCLUDE,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).payment.count({ where }),
    ])

    return { data: data as unknown as IPayment[], total }
  }

  // -------------------------------------------------------------------------
  // CANCEL
  // -------------------------------------------------------------------------

  async cancel(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IPayment> {
    const payment = await (db as PrismaClient).payment.findFirst({
      where: { id, empresaId },
    })
    if (!payment) throw new NotFoundError('Pago no encontrado')

    if (payment.status === PaymentStatus.CANCELLED) {
      throw new BadRequestError('El pago ya está cancelado')
    }
    if (payment.status === PaymentStatus.REFUNDED) {
      throw new BadRequestError('El pago ya fue reembolsado')
    }

    const updated = await (db as PrismaClient).$transaction(async (tx) => {
      // Cancel payment
      const cancelled = await tx.payment.update({
        where: { id },
        data: { status: PaymentStatus.CANCELLED },
        include: PAYMENT_INCLUDE,
      })

      // Check remaining completed payments for this PreInvoice
      const remainingPayments = await tx.payment.findMany({
        where: {
          preInvoiceId: payment.preInvoiceId,
          status: PaymentStatus.COMPLETED,
        },
        select: { amount: true },
      })
      const remainingTotal = round2(
        remainingPayments.reduce((sum, p) => sum + Number(p.amount), 0)
      )

      // Get PreInvoice total
      const pi = await tx.preInvoice.findUnique({
        where: { id: payment.preInvoiceId },
        select: { total: true, status: true },
      })

      // If PreInvoice was PAID but now underpaid, revert to READY_FOR_PAYMENT
      if (pi && pi.status === 'PAID' && remainingTotal < Number(pi.total)) {
        await tx.preInvoice.update({
          where: { id: payment.preInvoiceId },
          data: {
            status: 'READY_FOR_PAYMENT',
            paidAt: null,
          },
        })
      }

      return cancelled
    })

    logger.info(`Pago cancelado: ${id}`, { empresaId })
    return updated as unknown as IPayment
  }
}

export default new PaymentsService()
