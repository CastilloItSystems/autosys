import { DealerAfterSaleStatus, DealerAfterSaleType, Prisma, PrismaClient } from '../../../generated/prisma/client.js'
import { BadRequestError, NotFoundError } from '../../../shared/utils/apiError.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { CreateDealerAfterSaleDTO, UpdateDealerAfterSaleDTO } from './afterSales.dto.js'
import { IDealerAfterSale, IDealerAfterSaleFilters } from './afterSales.interface.js'
import { createServiceOrder } from '../../workshop/serviceOrders/serviceOrders.service.js'
import { CreateServiceOrderDTO } from '../../workshop/serviceOrders/serviceOrders.dto.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const AFTER_SALE_INCLUDE = {
  customer: {
    select: {
      id: true,
      code: true,
      name: true,
      phone: true,
      email: true,
      taxId: true,
    },
  },
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

  private async assertCustomerValid(customerId: string, empresaId: string, db: PrismaClientType) {
    const customer = await (db as PrismaClient).customer.findFirst({
      where: { id: customerId, empresaId, isActive: true },
      select: {
        id: true,
        name: true,
        taxId: true,
        phone: true,
        mobile: true,
        email: true,
      },
    })
    if (!customer) throw new NotFoundError('Cliente no encontrado')
    return customer
  }

  async create(data: CreateDealerAfterSaleDTO, empresaId: string, userId: string, db: PrismaClientType): Promise<IDealerAfterSale> {
    const caseNumber = await this.generateNumber(empresaId, db)
    const customer = await this.assertCustomerValid(data.customerId, empresaId, db)
    const status = (data.status as DealerAfterSaleStatus) || DealerAfterSaleStatus.OPEN
    const created = await (db as PrismaClient).dealerAfterSale.create({
      data: {
        empresaId,
        dealerUnitId: data.dealerUnitId ?? null,
        customerId: data.customerId,
        referenceType: data.referenceType ?? null,
        referenceId: data.referenceId ?? null,
        caseNumber,
        type: data.type as DealerAfterSaleType,
        status,
        customerName: data.customerName || customer.name,
        customerPhone: data.customerPhone ?? customer.phone ?? customer.mobile ?? null,
        customerEmail: data.customerEmail ?? customer.email ?? null,
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
        { customer: { name: { contains: q, mode: 'insensitive' } } },
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
    if (data.customerId !== undefined) {
      await this.assertCustomerValid(data.customerId, empresaId, db)
    }

    const updated = await (db as PrismaClient).dealerAfterSale.update({
      where: { id },
      data: {
        ...(data.dealerUnitId !== undefined
          ? {
              dealerUnit: data.dealerUnitId
                ? {
                    connect: {
                      id: data.dealerUnitId,
                    },
                  }
                : {
                    disconnect: true,
                  },
            }
          : {}),
        ...(data.customerId !== undefined
          ? {
              customer: {
                connect: {
                  id: data.customerId,
                },
              },
            }
          : {}),
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

  /**
   * Doc §20.3/§24.5 — Deriva un caso de postventa (garantía/primer servicio/reclamo)
   * al módulo de taller creando una Orden de Servicio y vinculándola al caso.
   */
  async deriveToWorkshop(
    id: string,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<{ afterSale: IDealerAfterSale; serviceOrderId: string; folio: string }> {
    const current = (await this.findById(id, empresaId, db)) as any

    const derivableTypes: DealerAfterSaleType[] = [
      DealerAfterSaleType.WARRANTY_CHECK,
      DealerAfterSaleType.FIRST_SERVICE,
      DealerAfterSaleType.CLAIM,
    ]
    if (!derivableTypes.includes(current.type)) {
      throw new BadRequestError('Solo se derivan a taller casos de garantía, primer servicio o reclamo')
    }
    if (current.referenceType === 'WORKSHOP_SERVICE_ORDER' && current.referenceId) {
      throw new BadRequestError(`Este caso ya fue derivado a la OT ${current.referenceId}`)
    }

    const unit = current.dealerUnit
    const vehicleDesc = unit
      ? [unit.brand?.name, unit.model?.name, unit.model?.year, unit.vin].filter(Boolean).join(' ')
      : undefined

    const dto = new CreateServiceOrderDTO({
      customerId: current.customerId,
      vehicleDesc: vehicleDesc || current.title,
      observations: `Derivado de postventa concesionario ${current.caseNumber}: ${current.title}`,
      diagnosisNotes: current.description ?? undefined,
      items: [],
    })

    const order = await createServiceOrder(db, empresaId, userId, dto)
    const orderId = (order as any).id as string
    const folio = ((order as any).folio as string) ?? orderId

    const updated = await (db as PrismaClient).dealerAfterSale.update({
      where: { id },
      data: {
        referenceType: 'WORKSHOP_SERVICE_ORDER',
        referenceId: orderId,
        ...(current.status === DealerAfterSaleStatus.OPEN ? { status: DealerAfterSaleStatus.IN_PROGRESS } : {}),
      },
      include: AFTER_SALE_INCLUDE,
    })

    logger.info('Dealer after-sale derivado a taller', { id, empresaId, userId, serviceOrderId: orderId, folio })
    return { afterSale: updated as unknown as IDealerAfterSale, serviceOrderId: orderId, folio }
  }
}

export default new DealerAfterSalesService()
