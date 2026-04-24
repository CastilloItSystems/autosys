import { DealerTradeInStatus, Prisma, PrismaClient } from '../../../generated/prisma/client.js'
import { BadRequestError, NotFoundError } from '../../../shared/utils/apiError.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { CreateDealerTradeInDTO, UpdateDealerTradeInDTO } from './tradeIns.dto.js'
import { IDealerTradeIn, IDealerTradeInFilters } from './tradeIns.interface.js'
import { domainEventBus } from '../../../shared/events/domain-event-bus.js'
import { toDomainEvent } from '../../../shared/events/domain-events.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const TRADE_IN_INCLUDE = {
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
  targetDealerUnit: {
    select: {
      id: true,
      code: true,
      vin: true,
      brand: { select: { id: true, code: true, name: true } },
      model: { select: { id: true, name: true, year: true } },
    },
  },
} as const

class DealerTradeInsService {
  private readonly transitions: Record<DealerTradeInStatus, DealerTradeInStatus[]> = {
    PENDING: ['INSPECTED', 'REJECTED'],
    INSPECTED: ['VALUED', 'REJECTED'],
    VALUED: ['APPROVED', 'REJECTED'],
    APPROVED: ['APPLIED'],
    REJECTED: [],
    APPLIED: [],
  }

  private validateTransition(current: DealerTradeInStatus, next: DealerTradeInStatus): void {
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
    const prefix = `RET-${yy}${mm}${dd}-`
    const countToday = await (db as PrismaClient).dealerTradeIn.count({
      where: { empresaId, tradeInNumber: { startsWith: prefix } },
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

  async create(data: CreateDealerTradeInDTO, empresaId: string, userId: string, db: PrismaClientType): Promise<IDealerTradeIn> {
    const tradeInNumber = await this.generateNumber(empresaId, db)
    const customer = await this.assertCustomerValid(data.customerId, empresaId, db)
    const created = await (db as PrismaClient).dealerTradeIn.create({
      data: {
        empresaId,
        targetDealerUnitId: data.targetDealerUnitId ?? null,
        customerId: data.customerId,
        tradeInNumber,
        status: (data.status as DealerTradeInStatus) || DealerTradeInStatus.PENDING,
        customerName: data.customerName || customer.name,
        customerDocument: data.customerDocument ?? customer.taxId ?? null,
        customerPhone: data.customerPhone ?? customer.phone ?? customer.mobile ?? null,
        customerEmail: data.customerEmail ?? customer.email ?? null,
        vehicleBrand: data.vehicleBrand,
        vehicleModel: data.vehicleModel ?? null,
        vehicleYear: data.vehicleYear ?? null,
        vehicleVersion: data.vehicleVersion ?? null,
        vehicleVin: data.vehicleVin ?? null,
        vehiclePlate: data.vehiclePlate ?? null,
        mileage: data.mileage ?? null,
        conditionSummary: data.conditionSummary ?? null,
        requestedValue: data.requestedValue ?? null,
        appraisedValue: data.appraisedValue ?? null,
        approvedValue: data.approvedValue ?? null,
        appraisalDate: data.appraisalDate ?? null,
        appraiserName: data.appraiserName ?? null,
        notes: data.notes ?? null,
      },
      include: TRADE_IN_INCLUDE,
    })
    logger.info('Dealer trade-in creada', { id: created.id, empresaId, userId })

    try {
      await domainEventBus.publish(
        toDomainEvent({
          empresaId,
          eventCode: 'dealer.trade_in.created',
          module: 'dealer',
          title: `Retoma ${created.tradeInNumber} creada`,
          message: `Se creó la retoma ${created.tradeInNumber}.`,
          type: 'info',
          entityType: 'DEALER_TRADE_IN',
          entityId: created.id,
          priority: 'MEDIUM',
          severity: 'INFO',
          link: '/empresa/concesionario/trade-ins',
          source: 'dealer.trade_ins',
          dedupKey: `dealer.trade_in.created:${created.id}`,
          metadata: {
            tradeInId: created.id,
            tradeInNumber: created.tradeInNumber,
            status: created.status,
            customerId: created.customerId,
            targetDealerUnitId: created.targetDealerUnitId ?? null,
            vehicleBrand: created.vehicleBrand,
            vehicleModel: created.vehicleModel ?? null,
            vehicleYear: created.vehicleYear ?? null,
          },
          createdById: userId,
          createdByName: 'Sistema',
        })
      )
    } catch (publishError) {
      logger.error('Error publicando evento dealer.trade_in.created', {
        tradeInId: created.id,
        empresaId,
        error: publishError,
      })
    }

    return created as unknown as IDealerTradeIn
  }

  async findById(id: string, empresaId: string, db: PrismaClientType): Promise<IDealerTradeIn> {
    const record = await (db as PrismaClient).dealerTradeIn.findFirst({
      where: { id, empresaId },
      include: TRADE_IN_INCLUDE,
    })
    if (!record) throw new NotFoundError('Retoma no encontrada')
    return record as unknown as IDealerTradeIn
  }

  async findAll(
    filters: IDealerTradeInFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: IDealerTradeIn[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })
    const where: Prisma.DealerTradeInWhereInput = { empresaId }
    if (filters.targetDealerUnitId) where.targetDealerUnitId = filters.targetDealerUnitId
    if (filters.status) where.status = filters.status as DealerTradeInStatus
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {}
      if (filters.fromDate) where.createdAt.gte = filters.fromDate
      if (filters.toDate) where.createdAt.lte = filters.toDate
    }
    if (filters.search) {
      const search = filters.search.trim()
      where.OR = [
        { tradeInNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { vehicleBrand: { contains: search, mode: 'insensitive' } },
        { vehicleModel: { contains: search, mode: 'insensitive' } },
        { vehiclePlate: { contains: search, mode: 'insensitive' } },
        { vehicleVin: { contains: search, mode: 'insensitive' } },
      ]
    }

    const validSortFields = new Set(['createdAt', 'updatedAt', 'status', 'appraisedValue', 'approvedValue'])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'createdAt'

    const [data, total] = await Promise.all([
      (db as PrismaClient).dealerTradeIn.findMany({
        where,
        include: TRADE_IN_INCLUDE,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).dealerTradeIn.count({ where }),
    ])
    return { data: data as unknown as IDealerTradeIn[], total }
  }

  async update(
    id: string,
    data: UpdateDealerTradeInDTO,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IDealerTradeIn> {
    const current = await this.findById(id, empresaId, db)
    if (data.status) {
      this.validateTransition(current.status, data.status as DealerTradeInStatus)
    }
    if (data.customerId !== undefined) {
      await this.assertCustomerValid(data.customerId, empresaId, db)
    }
    const updated = await (db as PrismaClient).dealerTradeIn.update({
      where: { id },
      data: {
        ...(data.targetDealerUnitId !== undefined
          ? {
              targetDealerUnit: data.targetDealerUnitId
                ? {
                    connect: {
                      id: data.targetDealerUnitId,
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
        ...(data.status !== undefined ? { status: data.status as DealerTradeInStatus } : {}),
        ...(data.customerName !== undefined ? { customerName: data.customerName } : {}),
        ...(data.customerDocument !== undefined ? { customerDocument: data.customerDocument || null } : {}),
        ...(data.customerPhone !== undefined ? { customerPhone: data.customerPhone || null } : {}),
        ...(data.customerEmail !== undefined ? { customerEmail: data.customerEmail || null } : {}),
        ...(data.vehicleBrand !== undefined ? { vehicleBrand: data.vehicleBrand } : {}),
        ...(data.vehicleModel !== undefined ? { vehicleModel: data.vehicleModel || null } : {}),
        ...(data.vehicleYear !== undefined ? { vehicleYear: data.vehicleYear ?? null } : {}),
        ...(data.vehicleVersion !== undefined ? { vehicleVersion: data.vehicleVersion || null } : {}),
        ...(data.vehicleVin !== undefined ? { vehicleVin: data.vehicleVin || null } : {}),
        ...(data.vehiclePlate !== undefined ? { vehiclePlate: data.vehiclePlate || null } : {}),
        ...(data.mileage !== undefined ? { mileage: data.mileage ?? null } : {}),
        ...(data.conditionSummary !== undefined ? { conditionSummary: data.conditionSummary || null } : {}),
        ...(data.requestedValue !== undefined ? { requestedValue: data.requestedValue ?? null } : {}),
        ...(data.appraisedValue !== undefined ? { appraisedValue: data.appraisedValue ?? null } : {}),
        ...(data.approvedValue !== undefined ? { approvedValue: data.approvedValue ?? null } : {}),
        ...(data.appraisalDate !== undefined ? { appraisalDate: data.appraisalDate ?? null } : {}),
        ...(data.appraiserName !== undefined ? { appraiserName: data.appraiserName || null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      include: TRADE_IN_INCLUDE,
    })
    logger.info('Dealer trade-in actualizada', { id, empresaId, userId })

    if (data.status && current.status !== data.status) {
      const status = data.status as DealerTradeInStatus
      const isWarningStatus = status === DealerTradeInStatus.REJECTED
      const isSuccessStatus =
        status === DealerTradeInStatus.APPROVED ||
        status === DealerTradeInStatus.APPLIED

      try {
        await domainEventBus.publish(
          toDomainEvent({
            empresaId,
            eventCode: 'dealer.trade_in.status_changed',
            module: 'dealer',
            title: `Retoma ${updated.tradeInNumber} actualizada`,
            message: `La retoma cambió de ${current.status} a ${status}.`,
            type: isWarningStatus
              ? 'warning'
              : isSuccessStatus
                ? 'success'
                : 'info',
            entityType: 'DEALER_TRADE_IN',
            entityId: updated.id,
            priority: isWarningStatus || isSuccessStatus ? 'HIGH' : 'MEDIUM',
            severity: isWarningStatus
              ? 'WARNING'
              : isSuccessStatus
                ? 'SUCCESS'
                : 'INFO',
            link: '/empresa/concesionario/trade-ins',
            source: 'dealer.trade_ins',
            dedupKey: `dealer.trade_in.status_changed:${updated.id}:${status}`,
            metadata: {
              tradeInId: updated.id,
              tradeInNumber: updated.tradeInNumber,
              previousStatus: current.status,
              status,
              customerId: updated.customerId,
              targetDealerUnitId: updated.targetDealerUnitId ?? null,
              requestedValue: updated.requestedValue ?? null,
              appraisedValue: updated.appraisedValue ?? null,
              approvedValue: updated.approvedValue ?? null,
            },
            createdById: userId,
            createdByName: 'Sistema',
          })
        )
      } catch (publishError) {
        logger.error('Error publicando evento dealer.trade_in.status_changed', {
          tradeInId: updated.id,
          empresaId,
          status,
          error: publishError,
        })
      }
    }

    return updated as unknown as IDealerTradeIn
  }

  async delete(id: string, empresaId: string, userId: string, db: PrismaClientType): Promise<{ success: boolean; id: string }> {
    await this.findById(id, empresaId, db)
    await (db as PrismaClient).dealerTradeIn.update({ where: { id }, data: { isActive: false } })
    logger.info('Dealer trade-in desactivada', { id, empresaId, userId })
    return { success: true, id }
  }
}

export default new DealerTradeInsService()
