import { DealerDeliveryStatus, DealerUnitStatus, Prisma, PrismaClient } from '../../../generated/prisma/client.js'
import { BadRequestError, NotFoundError } from '../../../shared/utils/apiError.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { CreateDealerDeliveryDTO, UpdateDealerDeliveryDTO } from './deliveries.dto.js'
import { IDealerDelivery, IDealerDeliveryFilters } from './deliveries.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const DELIVERY_INCLUDE = {
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

class DealerDeliveriesService {
  private readonly transitions: Record<DealerDeliveryStatus, DealerDeliveryStatus[]> = {
    SCHEDULED: ['READY', 'CANCELLED'],
    READY: ['DELIVERED', 'CANCELLED'],
    DELIVERED: [],
    CANCELLED: [],
  }

  private validateTransition(current: DealerDeliveryStatus, next: DealerDeliveryStatus): void {
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
    const prefix = `ENT-${yy}${mm}${dd}-`
    const countToday = await (db as PrismaClient).dealerDelivery.count({
      where: { empresaId, deliveryNumber: { startsWith: prefix } },
    })
    return `${prefix}${String(countToday + 1).padStart(4, '0')}`
  }

  async create(data: CreateDealerDeliveryDTO, empresaId: string, userId: string, db: PrismaClientType): Promise<IDealerDelivery> {
    const deliveryNumber = await this.generateNumber(empresaId, db)
    const status = (data.status as DealerDeliveryStatus) || DealerDeliveryStatus.SCHEDULED
    const created = await (db as PrismaClient).dealerDelivery.create({
      data: {
        empresaId,
        dealerUnitId: data.dealerUnitId,
        deliveryNumber,
        status,
        customerName: data.customerName,
        customerDocument: data.customerDocument ?? null,
        customerPhone: data.customerPhone ?? null,
        customerEmail: data.customerEmail ?? null,
        scheduledAt: data.scheduledAt,
        advisorName: data.advisorName ?? null,
        checklistCompleted: data.checklistCompleted ?? false,
        documentsSigned: data.documentsSigned ?? false,
        accessoriesDelivered: data.accessoriesDelivered ?? false,
        observations: data.observations ?? null,
        actNumber: data.actNumber ?? null,
        ...(status === DealerDeliveryStatus.DELIVERED ? { deliveredAt: new Date() } : {}),
      },
      include: DELIVERY_INCLUDE,
    })

    if (status === DealerDeliveryStatus.DELIVERED) {
      await (db as PrismaClient).dealerUnit.update({
        where: { id: data.dealerUnitId },
        data: { status: DealerUnitStatus.DELIVERED },
      })
    }

    logger.info('Dealer delivery creada', { id: created.id, empresaId, userId })
    return created as unknown as IDealerDelivery
  }

  async findById(id: string, empresaId: string, db: PrismaClientType): Promise<IDealerDelivery> {
    const record = await (db as PrismaClient).dealerDelivery.findFirst({
      where: { id, empresaId },
      include: DELIVERY_INCLUDE,
    })
    if (!record) throw new NotFoundError('Entrega no encontrada')
    return record as unknown as IDealerDelivery
  }

  async findAll(
    filters: IDealerDeliveryFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'scheduledAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: IDealerDelivery[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })
    const where: Prisma.DealerDeliveryWhereInput = { empresaId }
    if (filters.dealerUnitId) where.dealerUnitId = filters.dealerUnitId
    if (filters.status) where.status = filters.status as DealerDeliveryStatus
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.fromDate || filters.toDate) {
      where.scheduledAt = {}
      if (filters.fromDate) where.scheduledAt.gte = filters.fromDate
      if (filters.toDate) where.scheduledAt.lte = filters.toDate
    }
    if (filters.search) {
      const search = filters.search.trim()
      where.OR = [
        { deliveryNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerDocument: { contains: search, mode: 'insensitive' } },
        { actNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    const validSortFields = new Set(['scheduledAt', 'createdAt', 'updatedAt', 'status'])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'scheduledAt'
    const [data, total] = await Promise.all([
      (db as PrismaClient).dealerDelivery.findMany({
        where,
        include: DELIVERY_INCLUDE,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).dealerDelivery.count({ where }),
    ])
    return { data: data as unknown as IDealerDelivery[], total }
  }

  async update(
    id: string,
    data: UpdateDealerDeliveryDTO,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IDealerDelivery> {
    const current = await this.findById(id, empresaId, db)
    const status = data.status as DealerDeliveryStatus | undefined
    if (status) this.validateTransition(current.status, status)
    const updated = await (db as PrismaClient).dealerDelivery.update({
      where: { id },
      data: {
        ...(data.customerName !== undefined ? { customerName: data.customerName } : {}),
        ...(data.customerDocument !== undefined ? { customerDocument: data.customerDocument || null } : {}),
        ...(data.customerPhone !== undefined ? { customerPhone: data.customerPhone || null } : {}),
        ...(data.customerEmail !== undefined ? { customerEmail: data.customerEmail || null } : {}),
        ...(data.scheduledAt !== undefined ? { scheduledAt: data.scheduledAt } : {}),
        ...(data.advisorName !== undefined ? { advisorName: data.advisorName || null } : {}),
        ...(data.checklistCompleted !== undefined ? { checklistCompleted: data.checklistCompleted } : {}),
        ...(data.documentsSigned !== undefined ? { documentsSigned: data.documentsSigned } : {}),
        ...(data.accessoriesDelivered !== undefined ? { accessoriesDelivered: data.accessoriesDelivered } : {}),
        ...(data.observations !== undefined ? { observations: data.observations || null } : {}),
        ...(data.actNumber !== undefined ? { actNumber: data.actNumber || null } : {}),
        ...(data.status !== undefined ? { status } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(status === DealerDeliveryStatus.DELIVERED ? { deliveredAt: new Date() } : {}),
      },
      include: DELIVERY_INCLUDE,
    })

    if ((status === DealerDeliveryStatus.DELIVERED && current.status !== DealerDeliveryStatus.DELIVERED) || data.status === 'DELIVERED') {
      await (db as PrismaClient).dealerUnit.update({
        where: { id: current.dealerUnitId },
        data: { status: DealerUnitStatus.DELIVERED },
      })
    }

    logger.info('Dealer delivery actualizada', { id, empresaId, userId })
    return updated as unknown as IDealerDelivery
  }

  async delete(id: string, empresaId: string, userId: string, db: PrismaClientType): Promise<{ success: boolean; id: string }> {
    await this.findById(id, empresaId, db)
    await (db as PrismaClient).dealerDelivery.update({ where: { id }, data: { isActive: false } })
    logger.info('Dealer delivery desactivada', { id, empresaId, userId })
    return { success: true, id }
  }
}

export default new DealerDeliveriesService()
