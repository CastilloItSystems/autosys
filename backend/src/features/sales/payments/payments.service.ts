// backend/src/features/sales/payments/payments.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import { domainEventBus } from '../../../shared/events/domain-event-bus.js'
import { toDomainEvent } from '../../../shared/events/domain-events.js'
import { CreatePaymentDTO } from './payments.dto.js'
import preInvoicesService from '../preInvoices/preInvoices.service.js'
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
      include: {
        items: {
          include: {
            item: {
              select: { id: true, location: true },
            },
          },
        },
        customer: { select: { name: true } },
      },
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

    let exitNoteNotifyInfo: {
      id: string
      exitNoteNumber: string
      warehouseId: string
      type: string
      itemIds: string[]
    } | null = null
    let invoiceEmitInfo: {
      id: string
      invoiceNumber: string
      preInvoiceId: string
    } | null = null

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
        const salesStockDiagnosis =
          await preInvoicesService.assertSalesWarehouseStockAvailable(
            data.preInvoiceId,
            empresaId,
            tx
          )

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
        invoiceEmitInfo = {
          id: invoice.id,
          invoiceNumber,
          preInvoiceId: data.preInvoiceId,
        }

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
          const warehouseId = salesStockDiagnosis.salesWarehouse!.id

          const exitNote = await tx.exitNote.create({
            data: {
              exitNoteNumber,
              type: 'SALE',
              status: 'PENDING',
              warehouseId,
              preInvoiceId: data.preInvoiceId,
              recipientName: (preInvoice as any).customer?.name ?? null,
              reference: invoiceNumber,
              notes: `Despacho automático — Factura ${invoiceNumber}`,
              authorizedBy: userId ?? null,
            },
          })

          // Copy items to ExitNote items and reserve stock
          for (const item of piItems) {
            const stock = await tx.stock.findUnique({
              where: {
                itemId_warehouseId: {
                  itemId: item.itemId,
                  warehouseId,
                },
              },
            })

            const pickedFromLocation =
              stock?.location ?? item.item?.location ?? null

            await tx.exitNoteItem.create({
              data: {
                exitNoteId: exitNote.id,
                itemId: item.itemId,
                itemName: item.itemName ?? null,
                quantity: item.quantity,
                pickedFromLocation,
              },
            })

            // Reserve stock: product already sold, lock immediately
            if (!stock) {
              logger.warn(
                `Sin registro de stock para item ${item.itemId} en almacén ${warehouseId}. No se reservó stock.`,
                { preInvoiceId: data.preInvoiceId }
              )
            }
            const reserveResult = await tx.stock.updateMany({
              where: {
                itemId: item.itemId,
                warehouseId,
                quantityAvailable: { gte: item.quantity },
              },
              data: {
                quantityReserved: { increment: item.quantity },
                quantityAvailable: { decrement: item.quantity },
                lastMovementAt: new Date(),
              },
            })

            if (reserveResult.count === 0) {
              const updatedDiagnosis =
                await preInvoicesService.getSalesStockDiagnosis(
                  data.preInvoiceId,
                  empresaId,
                  tx
                )
              throw new BadRequestError(
                'No hay stock suficiente en el almacén de venta para completar esta venta.',
                [
                  {
                    code: 'SALES_STOCK_SHORTAGE',
                    ...updatedDiagnosis,
                  } as any,
                ]
              )
            }
          }

          exitNoteNotifyInfo = {
            id: exitNote.id,
            exitNoteNumber,
            warehouseId,
            type: 'SALE',
            itemIds: piItems.map((item) => item.itemId as string),
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

    try {
      await domainEventBus.publish(
        toDomainEvent({
          empresaId,
          eventCode: 'sales.payment.completed',
          module: 'sales',
          title: `Pago ${payment.paymentNumber} completado`,
          message: `Se procesó un pago por ${payment.amount}.`,
          type: 'success',
          entityType: 'PAYMENT',
          entityId: payment.id,
          priority: 'MEDIUM',
          severity: 'SUCCESS',
          link: `/empresa/ventas/pagos/${payment.id}`,
          source: 'sales.payments',
          dedupKey: `sales.payment.completed:${payment.id}`,
          metadata: {
            paymentId: payment.id,
            paymentNumber: payment.paymentNumber,
            preInvoiceId: payment.preInvoiceId,
            amount: Number(payment.amount),
          },
          createdById: userId ?? 'SYSTEM',
          createdByName: 'Sistema',
        })
      )

      if (invoiceEmitInfo) {
        await domainEventBus.publish(
          toDomainEvent({
            empresaId,
            eventCode: 'sales.invoice.issued',
            module: 'sales',
            title: `Factura ${invoiceEmitInfo.invoiceNumber} emitida`,
            message: `Se emitió la factura ${invoiceEmitInfo.invoiceNumber}.`,
            type: 'success',
            entityType: 'INVOICE',
            entityId: invoiceEmitInfo.id,
            priority: 'MEDIUM',
            severity: 'SUCCESS',
            link: `/empresa/ventas/facturas/${invoiceEmitInfo.id}`,
            source: 'sales.payments',
            dedupKey: `sales.invoice.issued:${invoiceEmitInfo.id}`,
            metadata: {
              invoiceId: invoiceEmitInfo.id,
              invoiceNumber: invoiceEmitInfo.invoiceNumber,
              preInvoiceId: invoiceEmitInfo.preInvoiceId,
            },
            createdById: userId ?? 'SYSTEM',
            createdByName: 'Sistema',
          })
        )
      }

      if (exitNoteNotifyInfo) {
        await domainEventBus.publish(
          toDomainEvent({
            empresaId,
            eventCode: 'inventory.exit_note.created',
            module: 'inventory',
            title: `Nota de salida ${exitNoteNotifyInfo.exitNoteNumber} creada`,
            message: `Se generó automáticamente la nota ${exitNoteNotifyInfo.exitNoteNumber}.`,
            type: 'info',
            entityType: 'EXIT_NOTE',
            entityId: exitNoteNotifyInfo.id,
            priority: 'MEDIUM',
            severity: 'INFO',
            link: `/empresa/inventario/notas-salida?search=${encodeURIComponent(exitNoteNotifyInfo.exitNoteNumber)}`,
            source: 'sales.payments',
            dedupKey: `inventory.exit_note.created:${exitNoteNotifyInfo.id}`,
            metadata: {
              exitNoteId: exitNoteNotifyInfo.id,
              exitNoteNumber: exitNoteNotifyInfo.exitNoteNumber,
              warehouseId: exitNoteNotifyInfo.warehouseId,
              totalItems: exitNoteNotifyInfo.itemIds.length,
              generatedByPaymentId: payment.id,
            },
            createdById: userId ?? 'SYSTEM',
            createdByName: 'Sistema',
          })
        )
      }
    } catch (publishError) {
      logger.error('Error publicando eventos de dominio de pago', {
        paymentId: payment.id,
        empresaId,
        error: publishError,
      })
    }

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
