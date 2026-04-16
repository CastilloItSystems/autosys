import { DealerApprovalStatus, DealerApprovalType, Prisma, PrismaClient } from '../../../generated/prisma/client.js'
import { BadRequestError, NotFoundError } from '../../../shared/utils/apiError.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { CreateDealerApprovalDTO, UpdateDealerApprovalDTO } from './approvals.dto.js'
import { IDealerApproval, IDealerApprovalFilters } from './approvals.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const APPROVAL_INCLUDE = {
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

class DealerApprovalsService {
  private readonly transitions: Record<DealerApprovalStatus, DealerApprovalStatus[]> = {
    PENDING: ['APPROVED', 'REJECTED', 'CANCELLED'],
    APPROVED: [],
    REJECTED: [],
    CANCELLED: [],
  }

  private validateTransition(current: DealerApprovalStatus, next: DealerApprovalStatus): void {
    if (current === next) return
    const allowed = this.transitions[current] ?? []
    if (!allowed.includes(next)) throw new BadRequestError(`Transición no permitida: ${current} -> ${next}`)
  }

  private async generateNumber(empresaId: string, db: PrismaClientType): Promise<string> {
    const now = new Date()
    const yy = String(now.getFullYear()).slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const prefix = `APR-${yy}${mm}${dd}-`
    const countToday = await (db as PrismaClient).dealerApproval.count({
      where: { empresaId, approvalNumber: { startsWith: prefix } },
    })
    return `${prefix}${String(countToday + 1).padStart(4, '0')}`
  }

  async create(data: CreateDealerApprovalDTO, empresaId: string, userId: string, db: PrismaClientType): Promise<IDealerApproval> {
    const approvalNumber = await this.generateNumber(empresaId, db)
    const status = (data.status as DealerApprovalStatus) || DealerApprovalStatus.PENDING

    const created = await (db as PrismaClient).dealerApproval.create({
      data: {
        empresaId,
        dealerUnitId: data.dealerUnitId ?? null,
        referenceType: data.referenceType ?? null,
        referenceId: data.referenceId ?? null,
        approvalNumber,
        type: data.type as DealerApprovalType,
        status,
        title: data.title,
        reason: data.reason ?? null,
        requestedBy: data.requestedBy ?? null,
        requestedAmount: data.requestedAmount ?? null,
        requestedPct: data.requestedPct ?? null,
        ...(status !== DealerApprovalStatus.PENDING
          ? { resolvedBy: userId, resolvedAt: new Date(), resolutionNotes: data.resolutionNotes ?? null }
          : {}),
      },
      include: APPROVAL_INCLUDE,
    })

    logger.info('Dealer approval creada', { id: created.id, empresaId, userId })
    return created as unknown as IDealerApproval
  }

  async findById(id: string, empresaId: string, db: PrismaClientType): Promise<IDealerApproval> {
    const item = await (db as PrismaClient).dealerApproval.findFirst({
      where: { id, empresaId },
      include: APPROVAL_INCLUDE,
    })
    if (!item) throw new NotFoundError('Aprobación no encontrada')
    return item as unknown as IDealerApproval
  }

  async findAll(
    filters: IDealerApprovalFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: IDealerApproval[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })
    const where: Prisma.DealerApprovalWhereInput = { empresaId }
    if (filters.dealerUnitId) where.dealerUnitId = filters.dealerUnitId
    if (filters.type) where.type = filters.type as DealerApprovalType
    if (filters.status) where.status = filters.status as DealerApprovalStatus
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.search) {
      const q = filters.search.trim()
      where.OR = [
        { approvalNumber: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
        { reason: { contains: q, mode: 'insensitive' } },
        { requestedBy: { contains: q, mode: 'insensitive' } },
      ]
    }

    const validSortFields = new Set(['createdAt', 'updatedAt', 'status', 'type'])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'createdAt'
    const [data, total] = await Promise.all([
      (db as PrismaClient).dealerApproval.findMany({
        where,
        include: APPROVAL_INCLUDE,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).dealerApproval.count({ where }),
    ])
    return { data: data as unknown as IDealerApproval[], total }
  }

  async update(
    id: string,
    data: UpdateDealerApprovalDTO,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IDealerApproval> {
    const current = await this.findById(id, empresaId, db)
    const status = data.status as DealerApprovalStatus | undefined
    if (status) this.validateTransition(current.status, status)

    const updated = await (db as PrismaClient).dealerApproval.update({
      where: { id },
      data: {
        ...(data.dealerUnitId !== undefined ? { dealerUnitId: data.dealerUnitId || null } : {}),
        ...(data.referenceType !== undefined ? { referenceType: data.referenceType || null } : {}),
        ...(data.referenceId !== undefined ? { referenceId: data.referenceId || null } : {}),
        ...(data.type !== undefined ? { type: data.type as DealerApprovalType } : {}),
        ...(data.status !== undefined ? { status } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.reason !== undefined ? { reason: data.reason || null } : {}),
        ...(data.requestedBy !== undefined ? { requestedBy: data.requestedBy || null } : {}),
        ...(data.requestedAmount !== undefined ? { requestedAmount: data.requestedAmount ?? null } : {}),
        ...(data.requestedPct !== undefined ? { requestedPct: data.requestedPct ?? null } : {}),
        ...(data.resolutionNotes !== undefined ? { resolutionNotes: data.resolutionNotes || null } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(status && status !== DealerApprovalStatus.PENDING ? { resolvedBy: userId, resolvedAt: new Date() } : {}),
      },
      include: APPROVAL_INCLUDE,
    })

    logger.info('Dealer approval actualizada', { id, empresaId, userId })
    return updated as unknown as IDealerApproval
  }

  async delete(id: string, empresaId: string, userId: string, db: PrismaClientType): Promise<{ success: boolean; id: string }> {
    await this.findById(id, empresaId, db)
    await (db as PrismaClient).dealerApproval.update({ where: { id }, data: { isActive: false } })
    logger.info('Dealer approval desactivada', { id, empresaId, userId })
    return { success: true, id }
  }
}

export default new DealerApprovalsService()
