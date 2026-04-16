import { DealerFinancingStatus, Prisma, PrismaClient } from '../../../generated/prisma/client.js'
import { BadRequestError, NotFoundError } from '../../../shared/utils/apiError.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { CreateDealerFinancingDTO, UpdateDealerFinancingDTO } from './financing.dto.js'
import { IDealerFinancing, IDealerFinancingFilters } from './financing.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const FINANCING_INCLUDE = {
  dealerUnit: {
    select: {
      id: true,
      code: true,
      vin: true,
      brand: { select: { id: true, code: true, name: true } },
      model: { select: { id: true, name: true, year: true } },
    },
  },
} as const

class DealerFinancingService {
  private readonly transitions: Record<DealerFinancingStatus, DealerFinancingStatus[]> = {
    DRAFT: ['SUBMITTED', 'CANCELLED'],
    SUBMITTED: ['UNDER_REVIEW', 'REJECTED', 'CANCELLED'],
    UNDER_REVIEW: ['APPROVED', 'REJECTED', 'CANCELLED'],
    APPROVED: ['DISBURSED', 'CANCELLED'],
    REJECTED: [],
    CANCELLED: [],
    DISBURSED: [],
  }

  private validateTransition(current: DealerFinancingStatus, next: DealerFinancingStatus): void {
    if (current === next) return
    const allowed = this.transitions[current] ?? []
    if (!allowed.includes(next)) {
      throw new BadRequestError(`Transición no permitida: ${current} -> ${next}`)
    }
  }

  private async generateNumber(empresaId: string, db: PrismaClientType): Promise<string> {
    const now = new Date()
    const yy = String(now.getFullYear()).slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const prefix = `FIN-${yy}${mm}${dd}-`
    const countToday = await (db as PrismaClient).dealerFinancing.count({
      where: { empresaId, financingNumber: { startsWith: prefix } },
    })
    return `${prefix}${String(countToday + 1).padStart(4, '0')}`
  }

  async create(data: CreateDealerFinancingDTO, empresaId: string, userId: string, db: PrismaClientType): Promise<IDealerFinancing> {
    const financingNumber = await this.generateNumber(empresaId, db)
    const status = (data.status as DealerFinancingStatus) || DealerFinancingStatus.DRAFT
    const created = await (db as PrismaClient).dealerFinancing.create({
      data: {
        empresaId,
        dealerUnitId: data.dealerUnitId,
        financingNumber,
        status,
        customerName: data.customerName,
        customerDocument: data.customerDocument ?? null,
        customerPhone: data.customerPhone ?? null,
        customerEmail: data.customerEmail ?? null,
        bankName: data.bankName ?? null,
        planName: data.planName ?? null,
        requestedAmount: data.requestedAmount ?? null,
        downPaymentAmount: data.downPaymentAmount ?? null,
        approvedAmount: data.approvedAmount ?? null,
        termMonths: data.termMonths ?? null,
        annualRatePct: data.annualRatePct ?? null,
        installmentAmount: data.installmentAmount ?? null,
        currency: data.currency ?? 'USD',
        notes: data.notes ?? null,
        ...(status === DealerFinancingStatus.SUBMITTED ? { submittedAt: new Date() } : {}),
        ...(status === DealerFinancingStatus.APPROVED ? { approvedAt: new Date() } : {}),
        ...(status === DealerFinancingStatus.REJECTED ? { rejectedAt: new Date() } : {}),
        ...(status === DealerFinancingStatus.DISBURSED ? { disbursedAt: new Date() } : {}),
      },
      include: FINANCING_INCLUDE,
    })
    logger.info('Dealer financing creada', { id: created.id, empresaId, userId })
    return created as unknown as IDealerFinancing
  }

  async findById(id: string, empresaId: string, db: PrismaClientType): Promise<IDealerFinancing> {
    const record = await (db as PrismaClient).dealerFinancing.findFirst({
      where: { id, empresaId },
      include: FINANCING_INCLUDE,
    })
    if (!record) throw new NotFoundError('Financiamiento no encontrado')
    return record as unknown as IDealerFinancing
  }

  async findAll(
    filters: IDealerFinancingFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: IDealerFinancing[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })
    const where: Prisma.DealerFinancingWhereInput = { empresaId }
    if (filters.dealerUnitId) where.dealerUnitId = filters.dealerUnitId
    if (filters.status) where.status = filters.status as DealerFinancingStatus
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {}
      if (filters.fromDate) where.createdAt.gte = filters.fromDate
      if (filters.toDate) where.createdAt.lte = filters.toDate
    }
    if (filters.search) {
      const search = filters.search.trim()
      where.OR = [
        { financingNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerDocument: { contains: search, mode: 'insensitive' } },
        { bankName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const validSortFields = new Set(['createdAt', 'updatedAt', 'status', 'requestedAmount', 'approvedAmount'])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'createdAt'
    const [data, total] = await Promise.all([
      (db as PrismaClient).dealerFinancing.findMany({
        where,
        include: FINANCING_INCLUDE,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).dealerFinancing.count({ where }),
    ])
    return { data: data as unknown as IDealerFinancing[], total }
  }

  async update(
    id: string,
    data: UpdateDealerFinancingDTO,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IDealerFinancing> {
    const current = await this.findById(id, empresaId, db)
    const status = data.status as DealerFinancingStatus | undefined
    if (status) this.validateTransition(current.status, status)
    const updated = await (db as PrismaClient).dealerFinancing.update({
      where: { id },
      data: {
        ...(data.customerName !== undefined ? { customerName: data.customerName } : {}),
        ...(data.customerDocument !== undefined ? { customerDocument: data.customerDocument || null } : {}),
        ...(data.customerPhone !== undefined ? { customerPhone: data.customerPhone || null } : {}),
        ...(data.customerEmail !== undefined ? { customerEmail: data.customerEmail || null } : {}),
        ...(data.bankName !== undefined ? { bankName: data.bankName || null } : {}),
        ...(data.planName !== undefined ? { planName: data.planName || null } : {}),
        ...(data.requestedAmount !== undefined ? { requestedAmount: data.requestedAmount ?? null } : {}),
        ...(data.downPaymentAmount !== undefined ? { downPaymentAmount: data.downPaymentAmount ?? null } : {}),
        ...(data.approvedAmount !== undefined ? { approvedAmount: data.approvedAmount ?? null } : {}),
        ...(data.termMonths !== undefined ? { termMonths: data.termMonths ?? null } : {}),
        ...(data.annualRatePct !== undefined ? { annualRatePct: data.annualRatePct ?? null } : {}),
        ...(data.installmentAmount !== undefined ? { installmentAmount: data.installmentAmount ?? null } : {}),
        ...(data.currency !== undefined ? { currency: data.currency || null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
        ...(data.status !== undefined ? { status } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(status === DealerFinancingStatus.SUBMITTED ? { submittedAt: new Date() } : {}),
        ...(status === DealerFinancingStatus.APPROVED ? { approvedAt: new Date() } : {}),
        ...(status === DealerFinancingStatus.REJECTED ? { rejectedAt: new Date() } : {}),
        ...(status === DealerFinancingStatus.DISBURSED ? { disbursedAt: new Date() } : {}),
      },
      include: FINANCING_INCLUDE,
    })
    logger.info('Dealer financing actualizada', { id, empresaId, userId })
    return updated as unknown as IDealerFinancing
  }

  async delete(id: string, empresaId: string, userId: string, db: PrismaClientType): Promise<{ success: boolean; id: string }> {
    await this.findById(id, empresaId, db)
    await (db as PrismaClient).dealerFinancing.update({ where: { id }, data: { isActive: false } })
    logger.info('Dealer financing desactivada', { id, empresaId, userId })
    return { success: true, id }
  }
}

export default new DealerFinancingService()
