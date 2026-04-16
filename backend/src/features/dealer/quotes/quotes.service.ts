import { DealerQuoteStatus, DealerUnitStatus, Prisma, PrismaClient } from '../../../generated/prisma/client.js'
import { BadRequestError, NotFoundError } from '../../../shared/utils/apiError.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { CreateDealerQuoteDTO, UpdateDealerQuoteDTO } from './quotes.dto.js'
import { IDealerQuote, IDealerQuoteFilters } from './quotes.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const QUOTE_INCLUDE = {
  dealerUnit: {
    select: {
      id: true,
      code: true,
      vin: true,
      plate: true,
      status: true,
      brand: { select: { id: true, code: true, name: true } },
      model: { select: { id: true, name: true, year: true } },
    },
  },
} as const

const STATUS_TRANSITIONS: Record<DealerQuoteStatus, DealerQuoteStatus[]> = {
  DRAFT: ['SENT', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'EXPIRED'],
  SENT: ['NEGOTIATING', 'APPROVED', 'REJECTED', 'EXPIRED'],
  NEGOTIATING: ['APPROVED', 'REJECTED', 'EXPIRED'],
  APPROVED: ['CONVERTED'],
  REJECTED: [],
  EXPIRED: [],
  CONVERTED: [],
}

class DealerQuotesService {
  private async assertUnitValid(dealerUnitId: string, empresaId: string, db: PrismaClientType) {
    const unit = await (db as PrismaClient).dealerUnit.findFirst({
      where: { id: dealerUnitId, empresaId, isActive: true },
      select: { id: true, status: true, listPrice: true },
    })
    if (!unit) throw new NotFoundError('Unidad no encontrada')
    return unit
  }

  private async generateQuoteNumber(empresaId: string, db: PrismaClientType): Promise<string> {
    const now = new Date()
    const yy = String(now.getFullYear()).slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const prefix = `COT-${yy}${mm}${dd}-`

    const countToday = await (db as PrismaClient).dealerQuote.count({
      where: {
        empresaId,
        quoteNumber: { startsWith: prefix },
      },
    })

    return `${prefix}${String(countToday + 1).padStart(4, '0')}`
  }

  private calculateTotals(input: {
    listPrice?: number | null
    discountPct?: number | null
    offeredPrice?: number | null
    taxPct?: number | null
  }) {
    const listPrice = input.listPrice != null ? Number(input.listPrice) : null
    const offeredPrice = input.offeredPrice != null ? Number(input.offeredPrice) : listPrice
    const discountPct = input.discountPct != null ? Number(input.discountPct) : 0
    const taxPct = input.taxPct != null ? Number(input.taxPct) : 0

    let discountAmount = null as number | null
    if (listPrice != null && offeredPrice != null) {
      discountAmount = Math.max(listPrice - offeredPrice, 0)
    } else if (listPrice != null && discountPct > 0) {
      discountAmount = listPrice * (discountPct / 100)
    }

    const taxable = offeredPrice ?? listPrice
    const taxAmount = taxable != null ? taxable * (taxPct / 100) : null
    const totalAmount = taxable != null ? taxable + (taxAmount ?? 0) : null

    return {
      listPrice,
      offeredPrice,
      discountPct,
      discountAmount,
      taxPct,
      taxAmount,
      totalAmount,
    }
  }

  private validateTransition(currentStatus: DealerQuoteStatus, newStatus: DealerQuoteStatus) {
    if (currentStatus === newStatus) return
    const allowed = STATUS_TRANSITIONS[currentStatus]
    if (!allowed.includes(newStatus)) {
      throw new BadRequestError(`Transición no permitida: ${currentStatus} -> ${newStatus}`)
    }
  }

  async create(data: CreateDealerQuoteDTO, empresaId: string, userId: string, db: PrismaClientType): Promise<IDealerQuote> {
    const unit = await this.assertUnitValid(data.dealerUnitId, empresaId, db)

    const status = (data.status as DealerQuoteStatus) || DealerQuoteStatus.DRAFT
    const quoteNumber = await this.generateQuoteNumber(empresaId, db)
    const totals = this.calculateTotals({
      listPrice: data.listPrice ?? (unit.listPrice as unknown as number | null),
      discountPct: data.discountPct,
      offeredPrice: data.offeredPrice,
      taxPct: data.taxPct,
    })

    const created = await (db as PrismaClient).dealerQuote.create({
      data: {
        empresaId,
        dealerUnitId: data.dealerUnitId,
        quoteNumber,
        status,
        customerName: data.customerName,
        customerDocument: data.customerDocument ?? null,
        customerPhone: data.customerPhone ?? null,
        customerEmail: data.customerEmail ?? null,
        listPrice: totals.listPrice,
        discountPct: totals.discountPct,
        discountAmount: totals.discountAmount,
        offeredPrice: totals.offeredPrice,
        taxPct: totals.taxPct,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        currency: data.currency ?? 'USD',
        validUntil: data.validUntil ?? null,
        paymentTerms: data.paymentTerms ?? null,
        financingRequired: data.financingRequired ?? false,
        notes: data.notes ?? null,
        ...(status === DealerQuoteStatus.SENT ? { sentAt: new Date() } : {}),
        ...(status === DealerQuoteStatus.APPROVED ? { approvedAt: new Date() } : {}),
        ...(status === DealerQuoteStatus.REJECTED ? { rejectedAt: new Date() } : {}),
        ...(status === DealerQuoteStatus.CONVERTED ? { convertedAt: new Date() } : {}),
      },
      include: QUOTE_INCLUDE,
    })

    if (status === DealerQuoteStatus.CONVERTED) {
      await (db as PrismaClient).dealerUnit.update({
        where: { id: data.dealerUnitId },
        data: { status: DealerUnitStatus.IN_DOCUMENTATION },
      })
    }

    logger.info('Dealer quote creada', { id: created.id, quoteNumber, empresaId, userId })
    return created as unknown as IDealerQuote
  }

  async findById(id: string, empresaId: string, db: PrismaClientType): Promise<IDealerQuote> {
    const quote = await (db as PrismaClient).dealerQuote.findFirst({
      where: { id, empresaId },
      include: QUOTE_INCLUDE,
    })
    if (!quote) throw new NotFoundError('Cotización no encontrada')
    return quote as unknown as IDealerQuote
  }

  async findAll(
    filters: IDealerQuoteFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: IDealerQuote[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.DealerQuoteWhereInput = { empresaId }
    if (filters.dealerUnitId) where.dealerUnitId = filters.dealerUnitId
    if (filters.status) where.status = filters.status as DealerQuoteStatus
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {}
      if (filters.fromDate) where.createdAt.gte = filters.fromDate
      if (filters.toDate) where.createdAt.lte = filters.toDate
    }
    if (filters.search) {
      const search = filters.search.trim()
      where.OR = [
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerDocument: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { dealerUnit: { vin: { contains: search, mode: 'insensitive' } } },
        { dealerUnit: { code: { contains: search, mode: 'insensitive' } } },
        { dealerUnit: { plate: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const validSortFields = new Set(['createdAt', 'updatedAt', 'status', 'totalAmount', 'validUntil'])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'createdAt'

    const [data, total] = await Promise.all([
      (db as PrismaClient).dealerQuote.findMany({
        where,
        include: QUOTE_INCLUDE,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).dealerQuote.count({ where }),
    ])

    return { data: data as unknown as IDealerQuote[], total }
  }

  async update(id: string, data: UpdateDealerQuoteDTO, empresaId: string, userId: string, db: PrismaClientType): Promise<IDealerQuote> {
    const current = await this.findById(id, empresaId, db)

    const newStatus = data.status ? (data.status as DealerQuoteStatus) : current.status
    this.validateTransition(current.status, newStatus)

    const listPrice = data.listPrice !== undefined ? data.listPrice : ((current.listPrice as unknown as number | null) ?? null)
    const offeredPrice = data.offeredPrice !== undefined ? data.offeredPrice : ((current.offeredPrice as unknown as number | null) ?? null)
    const discountPct = data.discountPct !== undefined ? data.discountPct : ((current.discountPct as unknown as number | null) ?? null)
    const taxPct = data.taxPct !== undefined ? data.taxPct : ((current.taxPct as unknown as number | null) ?? null)
    const totals = this.calculateTotals({ listPrice, offeredPrice, discountPct, taxPct })

    const updateData: Prisma.DealerQuoteUpdateInput = {
      listPrice: totals.listPrice,
      discountPct: totals.discountPct,
      discountAmount: totals.discountAmount,
      offeredPrice: totals.offeredPrice,
      taxPct: totals.taxPct,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
    }

    if (data.customerName !== undefined) updateData.customerName = data.customerName
    if (data.customerDocument !== undefined) updateData.customerDocument = data.customerDocument || null
    if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone || null
    if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail || null
    if (data.currency !== undefined) updateData.currency = data.currency || null
    if (data.validUntil !== undefined) updateData.validUntil = data.validUntil ?? null
    if (data.paymentTerms !== undefined) updateData.paymentTerms = data.paymentTerms || null
    if (data.financingRequired !== undefined) updateData.financingRequired = data.financingRequired
    if (data.notes !== undefined) updateData.notes = data.notes || null
    if (data.status !== undefined) updateData.status = newStatus
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    if (current.status !== newStatus) {
      if (newStatus === DealerQuoteStatus.SENT) updateData.sentAt = new Date()
      if (newStatus === DealerQuoteStatus.APPROVED) updateData.approvedAt = new Date()
      if (newStatus === DealerQuoteStatus.REJECTED) updateData.rejectedAt = new Date()
      if (newStatus === DealerQuoteStatus.CONVERTED) updateData.convertedAt = new Date()
    }

    const updated = await (db as PrismaClient).dealerQuote.update({
      where: { id },
      data: updateData,
      include: QUOTE_INCLUDE,
    })

    if (current.status !== newStatus && newStatus === DealerQuoteStatus.CONVERTED) {
      await (db as PrismaClient).dealerUnit.update({
        where: { id: current.dealerUnitId },
        data: { status: DealerUnitStatus.IN_DOCUMENTATION },
      })
    }

    logger.info('Dealer quote actualizada', { id, empresaId, userId, status: newStatus })
    return updated as unknown as IDealerQuote
  }

  async delete(id: string, empresaId: string, userId: string, db: PrismaClientType): Promise<{ success: boolean; id: string }> {
    await this.findById(id, empresaId, db)
    await (db as PrismaClient).dealerQuote.update({
      where: { id },
      data: { isActive: false },
    })
    logger.info('Dealer quote desactivada', { id, empresaId, userId })
    return { success: true, id }
  }
}

export default new DealerQuotesService()
