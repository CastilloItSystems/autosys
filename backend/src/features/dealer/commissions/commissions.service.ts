import { DealerCommissionStatus, Prisma, PrismaClient } from '../../../generated/prisma/client.js'
import { BadRequestError, NotFoundError } from '../../../shared/utils/apiError.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import dealerConfigService from '../config/config.service.js'
import { UpdateDealerCommissionDTO } from './commissions.dto.js'
import { IDealerCommission, IDealerCommissionFilters } from './commissions.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const COMMISSION_INCLUDE = {
  dealerQuote: { select: { id: true, quoteNumber: true, customerName: true } },
} as const

class DealerCommissionsService {
  private readonly transitions: Record<DealerCommissionStatus, DealerCommissionStatus[]> = {
    PENDING: ['APPROVED', 'CANCELLED'],
    APPROVED: ['PAID', 'CANCELLED'],
    PAID: [],
    CANCELLED: [],
  }

  /**
   * Genera (idempotente) la comisión de una venta convertida usando la comisión
   * base de DealerPolicy. Doc §23.2/§27. Se invoca al fiscalizar la cotización.
   */
  async generateForQuote(quoteId: string, empresaId: string, db: PrismaClientType): Promise<IDealerCommission | null> {
    const prisma = db as PrismaClient

    const existing = await prisma.dealerCommission.findFirst({
      where: { empresaId, dealerQuoteId: quoteId, isActive: true },
      include: COMMISSION_INCLUDE,
    })
    if (existing) return existing as unknown as IDealerCommission

    const quote = await prisma.dealerQuote.findFirst({
      where: { id: quoteId, empresaId },
      select: { id: true, salesOrderId: true, totalAmount: true, currency: true, customerId: true },
    })
    if (!quote) return null

    const policy = await dealerConfigService.resolve(empresaId, db)
    const commissionPct = policy.commissionPctDefault
    if (!commissionPct || commissionPct <= 0) return null

    const baseAmount = Number(quote.totalAmount ?? 0)
    if (baseAmount <= 0) return null

    const seller = await prisma.customer.findFirst({
      where: { id: quote.customerId, empresaId },
      select: { assignedSellerId: true },
    })

    const commissionAmount = Number(((baseAmount * commissionPct) / 100).toFixed(2))

    const created = await prisma.dealerCommission.create({
      data: {
        empresaId,
        dealerQuoteId: quote.id,
        salesOrderId: quote.salesOrderId ?? null,
        sellerId: seller?.assignedSellerId ?? null,
        baseAmount,
        commissionPct,
        commissionAmount,
        currency: quote.currency,
        status: DealerCommissionStatus.PENDING,
      },
      include: COMMISSION_INCLUDE,
    })

    logger.info('Dealer commission generada', { id: created.id, quoteId, empresaId, commissionAmount })
    return created as unknown as IDealerCommission
  }

  async findById(id: string, empresaId: string, db: PrismaClientType): Promise<IDealerCommission> {
    const item = await (db as PrismaClient).dealerCommission.findFirst({
      where: { id, empresaId },
      include: COMMISSION_INCLUDE,
    })
    if (!item) throw new NotFoundError('Comisión no encontrada')
    return item as unknown as IDealerCommission
  }

  async findAll(
    filters: IDealerCommissionFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: IDealerCommission[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })
    const where: Prisma.DealerCommissionWhereInput = { empresaId }
    if (filters.dealerQuoteId) where.dealerQuoteId = filters.dealerQuoteId
    if (filters.sellerId) where.sellerId = filters.sellerId
    if (filters.status) where.status = filters.status as DealerCommissionStatus
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.search) {
      const q = filters.search.trim()
      where.OR = [
        { sellerName: { contains: q, mode: 'insensitive' } },
        { dealerQuote: { quoteNumber: { contains: q, mode: 'insensitive' } } },
        { dealerQuote: { customerName: { contains: q, mode: 'insensitive' } } },
      ]
    }

    const validSortFields = new Set(['createdAt', 'updatedAt', 'status', 'commissionAmount'])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'createdAt'
    const [data, total] = await Promise.all([
      (db as PrismaClient).dealerCommission.findMany({
        where,
        include: COMMISSION_INCLUDE,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).dealerCommission.count({ where }),
    ])
    return { data: data as unknown as IDealerCommission[], total }
  }

  async update(
    id: string,
    data: UpdateDealerCommissionDTO,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IDealerCommission> {
    const current = await this.findById(id, empresaId, db)
    const nextStatus = data.status as DealerCommissionStatus | undefined
    if (nextStatus && nextStatus !== current.status) {
      const allowed = this.transitions[current.status] ?? []
      if (!allowed.includes(nextStatus)) {
        throw new BadRequestError(`Transición no permitida: ${current.status} -> ${nextStatus}`)
      }
    }

    let commissionAmount: number | undefined
    if (data.commissionPct !== undefined) {
      commissionAmount = Number(((Number(current.baseAmount) * data.commissionPct) / 100).toFixed(2))
    }

    const updated = await (db as PrismaClient).dealerCommission.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: nextStatus } : {}),
        ...(data.commissionPct !== undefined ? { commissionPct: data.commissionPct, commissionAmount } : {}),
        ...(data.sellerId !== undefined ? { sellerId: data.sellerId } : {}),
        ...(data.sellerName !== undefined ? { sellerName: data.sellerName } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(nextStatus === DealerCommissionStatus.PAID ? { paidAt: new Date() } : {}),
      },
      include: COMMISSION_INCLUDE,
    })

    logger.info('Dealer commission actualizada', { id, empresaId, userId })
    return updated as unknown as IDealerCommission
  }
}

export default new DealerCommissionsService()
