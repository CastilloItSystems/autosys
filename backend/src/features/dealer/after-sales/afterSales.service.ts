import { DealerAfterSaleStatus, DealerAfterSaleType, Prisma, PrismaClient } from '../../../generated/prisma/client.js'
import { BadRequestError, NotFoundError } from '../../../shared/utils/apiError.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { CreateDealerAfterSaleDTO, UpdateDealerAfterSaleDTO } from './afterSales.dto.js'
import { IDealerAfterSale, IDealerAfterSaleFilters } from './afterSales.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const AFTER_SALE_INCLUDE = {
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

class DealerAfterSalesService {
  private readonly transitions: Record<DealerAfterSaleStatus, DealerAfterSaleStatus[]> = {
    OPEN: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['RESOLVED', 'CANCELLED'],
    RESOLVED: ['CLOSED'],
    CLOSED: [],
    CANCELLED: [],
  }

  private validateTransition(current: DealerAfterSaleStatus, next: DealerAfterSaleStatus): void {
    if (current === next) return
    const allowed = this.transitions[current] ?? []
    if (!allowed.includes(next)) throw new BadRequestError(`Transición no permitida: ${current} -> ${next}`)
  }

  private async generateNumber(empresaId: string, db: PrismaClientType): Promise<string> {
    const now = new Date()
    const yy = String(now.getFullYear()).slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const prefix = `POS-${yy}${mm}${dd}-`
    const countToday = await (db as PrismaClient).dealerAfterSale.count({
      where: { empresaId, caseNumber: { startsWith: prefix } },
    })
    return `${prefix}${String(countToday + 1).padStart(4, '0')}`
  }

  async create(data: CreateDealerAfterSaleDTO, empresaId: string, userId: string, db: PrismaClientType): Promise<IDealerAfterSale> {
    const caseNumber = await this.generateNumber(empresaId, db)
    const status = (data.status as DealerAfterSaleStatus) || DealerAfterSaleStatus.OPEN
    const created = await (db as PrismaClient).dealerAfterSale.create({
      data: {
        empresaId,
        dealerUnitId: data.dealerUnitId ?? null,
        referenceType: data.referenceType ?? null,
        referenceId: data.referenceId ?? null,
        caseNumber,
        type: data.type as DealerAfterSaleType,
        status,
        customerName: data.customerName,
        customerPhone: data.customerPhone ?? null,
        customerEmail: data.customerEmail ?? null,
        title: data.title,
        description: data.description ?? null,
        dueAt: data.dueAt ?? null,
        assignedTo: data.assignedTo ?? null,
        resolutionNotes: data.resolutionNotes ?? null,
        satisfactionScore: data.satisfactionScore ?? null,
        ...(status === DealerAfterSaleStatus.RESOLVED ? { resolvedAt: new Date() } : {}),
        ...(status === DealerAfterSaleStatus.CLOSED ? { closedAt: new Date() } : {}),
      },
      include: AFTER_SALE_INCLUDE,
    })
    logger.info('Dealer after-sale creado', { id: created.id, empresaId, userId })
    return created as unknown as IDealerAfterSale
  }

  async findById(id: string, empresaId: string, db: PrismaClientType): Promise<IDealerAfterSale> {
    const item = await (db as PrismaClient).dealerAfterSale.findFirst({
      where: { id, empresaId },
      include: AFTER_SALE_INCLUDE,
    })
    if (!item) throw new NotFoundError('Caso de postventa no encontrado')
    return item as unknown as IDealerAfterSale
  }

  async findAll(
    filters: IDealerAfterSaleFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: IDealerAfterSale[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })
    const where: Prisma.DealerAfterSaleWhereInput = { empresaId }
    if (filters.dealerUnitId) where.dealerUnitId = filters.dealerUnitId
    if (filters.type) where.type = filters.type as DealerAfterSaleType
    if (filters.status) where.status = filters.status as DealerAfterSaleStatus
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.search) {
      const q = filters.search.trim()
      where.OR = [
        { caseNumber: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }

    const validSortFields = new Set(['createdAt', 'updatedAt', 'status', 'dueAt'])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'createdAt'
    const [data, total] = await Promise.all([
      (db as PrismaClient).dealerAfterSale.findMany({
        where,
        include: AFTER_SALE_INCLUDE,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).dealerAfterSale.count({ where }),
    ])
    return { data: data as unknown as IDealerAfterSale[], total }
  }

  async update(
    id: string,
    data: UpdateDealerAfterSaleDTO,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IDealerAfterSale> {
    const current = await this.findById(id, empresaId, db)
    const status = data.status as DealerAfterSaleStatus | undefined
    if (status) this.validateTransition(current.status, status)

    const updated = await (db as PrismaClient).dealerAfterSale.update({
      where: { id },
      data: {
        ...(data.dealerUnitId !== undefined ? { dealerUnitId: data.dealerUnitId || null } : {}),
        ...(data.referenceType !== undefined ? { referenceType: data.referenceType || null } : {}),
        ...(data.referenceId !== undefined ? { referenceId: data.referenceId || null } : {}),
        ...(data.type !== undefined ? { type: data.type as DealerAfterSaleType } : {}),
        ...(data.status !== undefined ? { status } : {}),
        ...(data.customerName !== undefined ? { customerName: data.customerName } : {}),
        ...(data.customerPhone !== undefined ? { customerPhone: data.customerPhone || null } : {}),
        ...(data.customerEmail !== undefined ? { customerEmail: data.customerEmail || null } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
        ...(data.dueAt !== undefined ? { dueAt: data.dueAt ?? null } : {}),
        ...(data.assignedTo !== undefined ? { assignedTo: data.assignedTo || null } : {}),
        ...(data.resolutionNotes !== undefined ? { resolutionNotes: data.resolutionNotes || null } : {}),
        ...(data.satisfactionScore !== undefined ? { satisfactionScore: data.satisfactionScore ?? null } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(status === DealerAfterSaleStatus.RESOLVED ? { resolvedAt: new Date() } : {}),
        ...(status === DealerAfterSaleStatus.CLOSED ? { closedAt: new Date() } : {}),
      },
      include: AFTER_SALE_INCLUDE,
    })
    logger.info('Dealer after-sale actualizado', { id, empresaId, userId })
    return updated as unknown as IDealerAfterSale
  }

  async delete(id: string, empresaId: string, userId: string, db: PrismaClientType): Promise<{ success: boolean; id: string }> {
    await this.findById(id, empresaId, db)
    await (db as PrismaClient).dealerAfterSale.update({ where: { id }, data: { isActive: false } })
    logger.info('Dealer after-sale desactivado', { id, empresaId, userId })
    return { success: true, id }
  }
}

export default new DealerAfterSalesService()
