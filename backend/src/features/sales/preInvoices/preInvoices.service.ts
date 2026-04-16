// backend/src/features/sales/preInvoices/preInvoices.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import {
  IPreInvoice,
  PreInvoiceStatus,
  IPreInvoiceFilters,
} from './preInvoices.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PI_INCLUDE = {
  items: {
    include: {
      item: { select: { id: true, sku: true, name: true } },
    },
  },
  order: { select: { id: true, orderNumber: true, status: true } },
  serviceOrder: { select: { id: true, folio: true, status: true } },
  consolidatedServiceOrders: {
    select: { id: true, folio: true, status: true },
  },
  customer: true,
  warehouse: { select: { id: true, name: true, code: true } },
} as const

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class PreInvoicesService {
  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------

  async findById(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IPreInvoice> {
    const pi = await (db as PrismaClient).preInvoice.findFirst({
      where: { id, empresaId },
      include: PI_INCLUDE,
    })
    if (!pi) throw new NotFoundError('Pre-factura no encontrada')
    return pi as unknown as IPreInvoice
  }

  async findAll(
    filters: IPreInvoiceFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: IPreInvoice[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.PreInvoiceWhereInput = { empresaId }
    const andConditions: Prisma.PreInvoiceWhereInput[] = []

    if (filters.status) where.status = filters.status as any
    if (filters.customerId) where.customerId = filters.customerId
    if (filters.orderId) where.orderId = filters.orderId
    if (filters.serviceOrderId) where.serviceOrderId = filters.serviceOrderId

    if (filters.hasServiceOrder === true) {
      andConditions.push({
        OR: [
          { serviceOrderId: { not: null } },
          { consolidatedServiceOrders: { some: {} } },
        ],
      })
    } else if (filters.hasServiceOrder === false) {
      andConditions.push({
        serviceOrderId: null,
        consolidatedServiceOrders: { none: {} },
      })
    }

    if (filters.origin === 'WORKSHOP') {
      andConditions.push({
        OR: [
          { serviceOrderId: { not: null } },
          { consolidatedServiceOrders: { some: {} } },
        ],
      })
    } else if (filters.origin === 'ORDER') {
      andConditions.push({ orderId: { not: null } })
    }

    if (filters.search) {
      const search = filters.search.trim()
      andConditions.push({
        OR: [
          { preInvoiceNumber: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
          { serviceOrder: { folio: { contains: search, mode: 'insensitive' } } },
          {
            consolidatedServiceOrders: {
              some: { folio: { contains: search, mode: 'insensitive' } },
            },
          },
        ],
      })
    }

    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    const validSortFields = new Set([
      'createdAt',
      'preInvoiceNumber',
      'status',
      'total',
    ])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'createdAt'

    const [data, total] = await Promise.all([
      (db as PrismaClient).preInvoice.findMany({
        where,
        include: PI_INCLUDE,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).preInvoice.count({ where }),
    ])

    return { data: data as unknown as IPreInvoice[], total }
  }

  // -------------------------------------------------------------------------
  // STATUS TRANSITIONS
  // -------------------------------------------------------------------------

  /**
   * PENDING_PREPARATION → IN_PREPARATION
   */
  async startPreparation(
    id: string,
    empresaId: string,
    preparedBy: string,
    db: PrismaClientType
  ): Promise<IPreInvoice> {
    const pi = await (db as PrismaClient).preInvoice.findFirst({
      where: { id, empresaId },
    })
    if (!pi) throw new NotFoundError('Pre-factura no encontrada')

    if (pi.status !== PreInvoiceStatus.PENDING_PREPARATION) {
      throw new BadRequestError(
        `No se puede iniciar preparación desde estado ${pi.status}`
      )
    }

    const updated = await (db as PrismaClient).preInvoice.update({
      where: { id },
      data: {
        status: PreInvoiceStatus.IN_PREPARATION,
        preparedBy,
      },
      include: PI_INCLUDE,
    })

    logger.info(`Pre-factura en preparación: ${id}`, { empresaId })
    return updated as unknown as IPreInvoice
  }

  /**
   * IN_PREPARATION → READY_FOR_PAYMENT
   */
  async markReady(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IPreInvoice> {
    const pi = await (db as PrismaClient).preInvoice.findFirst({
      where: { id, empresaId },
    })
    if (!pi) throw new NotFoundError('Pre-factura no encontrada')

    if (pi.status !== PreInvoiceStatus.IN_PREPARATION) {
      throw new BadRequestError(
        `No se puede marcar como lista desde estado ${pi.status}`
      )
    }

    const updated = await (db as PrismaClient).preInvoice.update({
      where: { id },
      data: {
        status: PreInvoiceStatus.READY_FOR_PAYMENT,
        preparedAt: new Date(),
      },
      include: PI_INCLUDE,
    })

    logger.info(`Pre-factura lista para pago: ${id}`, { empresaId })
    return updated as unknown as IPreInvoice
  }

  /**
   * READY_FOR_PAYMENT → PAID
   * This is the BIG one — generates Invoice + ExitNote + stock deduction
   */
  async markPaid(
    id: string,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IPreInvoice> {
    const pi = await (db as PrismaClient).preInvoice.findFirst({
      where: { id, empresaId },
      include: { items: true, order: true, warehouse: true },
    })
    if (!pi) throw new NotFoundError('Pre-factura no encontrada')

    if (pi.status !== PreInvoiceStatus.READY_FOR_PAYMENT) {
      throw new BadRequestError(
        `No se puede marcar como pagada desde estado ${pi.status}`
      )
    }

    // For now, just mark as PAID
    // TODO: In future phases, this will generate:
    //   1. Invoice (factura fiscal con numeración SENIAT)
    //   2. ExitNote tipo SALE (despacho que descuenta stock)
    //   3. Movement records
    //   4. Stock deduction

    const updated = await (db as PrismaClient).preInvoice.update({
      where: { id },
      data: {
        status: PreInvoiceStatus.PAID,
        paidAt: new Date(),
      },
      include: PI_INCLUDE,
    })

    logger.info(`Pre-factura pagada: ${id}`, { empresaId, userId })
    return updated as unknown as IPreInvoice
  }

  /**
   * Cancel — from any status except PAID
   */
  async cancel(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IPreInvoice> {
    const pi = await (db as PrismaClient).preInvoice.findFirst({
      where: { id, empresaId },
    })
    if (!pi) throw new NotFoundError('Pre-factura no encontrada')

    if (pi.status === PreInvoiceStatus.PAID) {
      throw new BadRequestError(
        'No se puede cancelar una pre-factura pagada'
      )
    }
    if (pi.status === PreInvoiceStatus.CANCELLED) {
      throw new BadRequestError('La pre-factura ya está cancelada')
    }

    const updated = await (db as PrismaClient).preInvoice.update({
      where: { id },
      data: { status: PreInvoiceStatus.CANCELLED },
      include: PI_INCLUDE,
    })

    logger.info(`Pre-factura cancelada: ${id}`, { empresaId })
    return updated as unknown as IPreInvoice
  }
}

export default new PreInvoicesService()
