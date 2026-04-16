import { DealerReservationStatus, DealerUnitStatus, Prisma, PrismaClient } from '../../../generated/prisma/client.js'
import { BadRequestError, ConflictError, NotFoundError } from '../../../shared/utils/apiError.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { CreateDealerReservationDTO, UpdateDealerReservationDTO } from './reservations.dto.js'
import { IDealerReservation, IDealerReservationFilters } from './reservations.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const RESERVATION_INCLUDE = {
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

class DealerReservationsService {
  private async assertUnitValid(dealerUnitId: string, empresaId: string, db: PrismaClientType) {
    const unit = await (db as PrismaClient).dealerUnit.findFirst({
      where: { id: dealerUnitId, empresaId, isActive: true },
      select: { id: true, status: true },
    })
    if (!unit) throw new NotFoundError('Unidad no encontrada')
    if (unit.status === DealerUnitStatus.DELIVERED) {
      throw new BadRequestError('La unidad ya fue entregada y no puede reservarse')
    }
    return unit
  }

  private async assertNoActiveReservation(dealerUnitId: string, empresaId: string, db: PrismaClientType, excludeId?: string) {
    const activeReservation = await (db as PrismaClient).dealerReservation.findFirst({
      where: {
        empresaId,
        dealerUnitId,
        isActive: true,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        status: { in: [DealerReservationStatus.PENDING, DealerReservationStatus.CONFIRMED] },
      },
      select: { id: true, reservationNumber: true },
    })
    if (activeReservation) {
      throw new ConflictError(`La unidad ya tiene una reserva activa (${activeReservation.reservationNumber})`)
    }
  }

  private async generateReservationNumber(empresaId: string, db: PrismaClientType): Promise<string> {
    const now = new Date()
    const yy = String(now.getFullYear()).slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const prefix = `RES-${yy}${mm}${dd}-`

    const countToday = await (db as PrismaClient).dealerReservation.count({
      where: {
        empresaId,
        reservationNumber: { startsWith: prefix },
      },
    })

    return `${prefix}${String(countToday + 1).padStart(4, '0')}`
  }

  private shouldReleaseUnit(status?: DealerReservationStatus): boolean {
    return status === DealerReservationStatus.EXPIRED || status === DealerReservationStatus.CANCELLED
  }

  private shouldReserveUnit(status?: DealerReservationStatus): boolean {
    return status === DealerReservationStatus.PENDING || status === DealerReservationStatus.CONFIRMED
  }

  async create(
    data: CreateDealerReservationDTO,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IDealerReservation> {
    await this.assertUnitValid(data.dealerUnitId, empresaId, db)

    const status = (data.status as DealerReservationStatus) || DealerReservationStatus.PENDING
    if (this.shouldReserveUnit(status)) {
      await this.assertNoActiveReservation(data.dealerUnitId, empresaId, db)
    }

    const reservationNumber = await this.generateReservationNumber(empresaId, db)

    const created = await (db as PrismaClient).dealerReservation.create({
      data: {
        empresaId,
        dealerUnitId: data.dealerUnitId,
        reservationNumber,
        status,
        customerName: data.customerName,
        customerDocument: data.customerDocument ?? null,
        customerPhone: data.customerPhone ?? null,
        customerEmail: data.customerEmail ?? null,
        offeredPrice: data.offeredPrice ?? null,
        depositAmount: data.depositAmount ?? null,
        currency: data.currency ?? 'USD',
        expiresAt: data.expiresAt ?? null,
        notes: data.notes ?? null,
        sourceChannel: data.sourceChannel ?? null,
      },
      include: RESERVATION_INCLUDE,
    })

    if (this.shouldReserveUnit(status)) {
      await (db as PrismaClient).dealerUnit.update({
        where: { id: data.dealerUnitId },
        data: { status: DealerUnitStatus.RESERVED },
      })
    }

    logger.info('Dealer reservation creada', { id: created.id, reservationNumber, empresaId, userId })
    return created as unknown as IDealerReservation
  }

  async findById(id: string, empresaId: string, db: PrismaClientType): Promise<IDealerReservation> {
    const reservation = await (db as PrismaClient).dealerReservation.findFirst({
      where: { id, empresaId },
      include: RESERVATION_INCLUDE,
    })
    if (!reservation) throw new NotFoundError('Reserva no encontrada')
    return reservation as unknown as IDealerReservation
  }

  async findAll(
    filters: IDealerReservationFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'reservedAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: IDealerReservation[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.DealerReservationWhereInput = { empresaId }
    if (filters.dealerUnitId) where.dealerUnitId = filters.dealerUnitId
    if (filters.status) where.status = filters.status as DealerReservationStatus
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.fromDate || filters.toDate) {
      where.reservedAt = {}
      if (filters.fromDate) where.reservedAt.gte = filters.fromDate
      if (filters.toDate) where.reservedAt.lte = filters.toDate
    }
    if (filters.search) {
      const search = filters.search.trim()
      where.OR = [
        { reservationNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerDocument: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { dealerUnit: { vin: { contains: search, mode: 'insensitive' } } },
        { dealerUnit: { code: { contains: search, mode: 'insensitive' } } },
        { dealerUnit: { plate: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const validSortFields = new Set(['reservedAt', 'createdAt', 'updatedAt', 'status'])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'reservedAt'

    const [data, total] = await Promise.all([
      (db as PrismaClient).dealerReservation.findMany({
        where,
        include: RESERVATION_INCLUDE,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).dealerReservation.count({ where }),
    ])

    return { data: data as unknown as IDealerReservation[], total }
  }

  async update(
    id: string,
    data: UpdateDealerReservationDTO,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IDealerReservation> {
    const current = await this.findById(id, empresaId, db)

    const newStatus = data.status ? (data.status as DealerReservationStatus) : current.status
    const statusChanged = newStatus !== current.status

    if (this.shouldReserveUnit(newStatus)) {
      await this.assertNoActiveReservation(current.dealerUnitId, empresaId, db, id)
    }

    const updateData: Prisma.DealerReservationUpdateInput = {}
    if (data.customerName !== undefined) updateData.customerName = data.customerName
    if (data.customerDocument !== undefined) updateData.customerDocument = data.customerDocument || null
    if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone || null
    if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail || null
    if (data.offeredPrice !== undefined) updateData.offeredPrice = data.offeredPrice ?? null
    if (data.depositAmount !== undefined) updateData.depositAmount = data.depositAmount ?? null
    if (data.currency !== undefined) updateData.currency = data.currency || null
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt ?? null
    if (data.notes !== undefined) updateData.notes = data.notes || null
    if (data.sourceChannel !== undefined) updateData.sourceChannel = data.sourceChannel || null
    if (data.status !== undefined) updateData.status = newStatus
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    if (statusChanged) {
      if (newStatus === DealerReservationStatus.CONFIRMED) updateData.confirmedAt = new Date()
      if (newStatus === DealerReservationStatus.CANCELLED) updateData.cancelledAt = new Date()
      if (newStatus === DealerReservationStatus.CONVERTED) updateData.convertedAt = new Date()
    }

    const updated = await (db as PrismaClient).dealerReservation.update({
      where: { id },
      data: updateData,
      include: RESERVATION_INCLUDE,
    })

    if (statusChanged) {
      if (this.shouldReleaseUnit(newStatus)) {
        await (db as PrismaClient).dealerUnit.update({
          where: { id: current.dealerUnitId },
          data: { status: DealerUnitStatus.AVAILABLE },
        })
      } else if (this.shouldReserveUnit(newStatus)) {
        await (db as PrismaClient).dealerUnit.update({
          where: { id: current.dealerUnitId },
          data: { status: DealerUnitStatus.RESERVED },
        })
      } else if (newStatus === DealerReservationStatus.CONVERTED) {
        await (db as PrismaClient).dealerUnit.update({
          where: { id: current.dealerUnitId },
          data: { status: DealerUnitStatus.IN_DOCUMENTATION },
        })
      }
    }

    logger.info('Dealer reservation actualizada', { id, empresaId, userId, status: newStatus })
    return updated as unknown as IDealerReservation
  }

  async delete(
    id: string,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<{ success: boolean; id: string }> {
    const current = await this.findById(id, empresaId, db)

    await (db as PrismaClient).dealerReservation.update({
      where: { id },
      data: {
        isActive: false,
        status: DealerReservationStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    })

    if (this.shouldReserveUnit(current.status)) {
      await (db as PrismaClient).dealerUnit.update({
        where: { id: current.dealerUnitId },
        data: { status: DealerUnitStatus.AVAILABLE },
      })
    }

    logger.info('Dealer reservation desactivada', { id, empresaId, userId })
    return { success: true, id }
  }
}

export default new DealerReservationsService()
