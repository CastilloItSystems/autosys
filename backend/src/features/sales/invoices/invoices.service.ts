// backend/src/features/sales/invoices/invoices.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import { IInvoice, InvoiceStatus, IInvoiceFilters } from './invoices.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const INVOICE_INCLUDE = {
  items: {
    include: {
      item: { select: { id: true, sku: true, name: true } },
    },
  },
  customer: true,
  preInvoice: {
    select: {
      id: true,
      preInvoiceNumber: true,
      orderId: true,
      order: { select: { id: true, orderNumber: true } },
    },
  },
  payment: {
    select: { id: true, paymentNumber: true, method: true, amount: true },
  },
} as const

class InvoicesService {
  // No create — invoices are generated automatically by payments.service

  async findById(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IInvoice> {
    const invoice = await (db as PrismaClient).invoice.findFirst({
      where: { id, empresaId },
      include: INVOICE_INCLUDE,
    })
    if (!invoice) throw new NotFoundError('Factura no encontrada')
    return invoice as unknown as IInvoice
  }

  async findAll(
    filters: IInvoiceFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: IInvoice[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.InvoiceWhereInput = { empresaId }
    if (filters.status) where.status = filters.status as any
    if (filters.customerId) where.customerId = filters.customerId
    if (filters.preInvoiceId) where.preInvoiceId = filters.preInvoiceId
    if (filters.search) {
      const s = filters.search.trim()
      where.OR = [
        { invoiceNumber: { contains: s, mode: 'insensitive' } },
        { fiscalNumber: { contains: s, mode: 'insensitive' } },
        { customer: { name: { contains: s, mode: 'insensitive' } } },
        { customer: { taxId: { contains: s, mode: 'insensitive' } } },
      ]
    }

    const validSortFields = new Set([
      'createdAt', 'invoiceNumber', 'fiscalNumber', 'status', 'total', 'invoiceDate',
    ])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'createdAt'

    const [data, total] = await Promise.all([
      (db as PrismaClient).invoice.findMany({
        where,
        include: INVOICE_INCLUDE,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).invoice.count({ where }),
    ])

    return { data: data as unknown as IInvoice[], total }
  }

  /**
   * Anular factura — requiere motivo obligatorio.
   * No elimina la factura (SENIAT no permite gaps en numeración).
   */
  async cancel(
    id: string,
    empresaId: string,
    cancelledBy: string,
    cancellationReason: string,
    db: PrismaClientType
  ): Promise<IInvoice> {
    const invoice = await (db as PrismaClient).invoice.findFirst({
      where: { id, empresaId },
    })
    if (!invoice) throw new NotFoundError('Factura no encontrada')

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestError('La factura ya está anulada')
    }

    const updated = await (db as PrismaClient).invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy,
        cancellationReason,
      },
      include: INVOICE_INCLUDE,
    })

    logger.info(`Factura anulada: ${id}`, {
      invoiceNumber: invoice.invoiceNumber,
      reason: cancellationReason,
      empresaId,
    })

    return updated as unknown as IInvoice
  }
}

export default new InvoicesService()
