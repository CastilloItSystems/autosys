import { DealerTestDriveStatus, Prisma, PrismaClient } from '../../../generated/prisma/client.js'
import { BadRequestError, NotFoundError } from '../../../shared/utils/apiError.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { CreateDealerTestDriveDTO, UpdateDealerTestDriveDTO } from './testDrives.dto.js'
import { IDealerTestDrive, IDealerTestDriveFilters } from './testDrives.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const TEST_DRIVE_INCLUDE = {
  dealerUnit: {
    select: {
      id: true,
      code: true,
      vin: true,
      plate: true,
      brand: { select: { id: true, code: true, name: true } },
      model: { select: { id: true, name: true, year: true } },
    },
  },
} as const

const STATUS_TRANSITIONS: Record<DealerTestDriveStatus, DealerTestDriveStatus[]> = {
  SCHEDULED: ['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'NO_SHOW', 'CANCELLED'],
  COMPLETED: [],
  NO_SHOW: [],
  CANCELLED: [],
}

class DealerTestDrivesService {
  private async assertUnitValid(dealerUnitId: string, empresaId: string, db: PrismaClientType): Promise<void> {
    const unit = await (db as PrismaClient).dealerUnit.findFirst({
      where: { id: dealerUnitId, empresaId, isActive: true },
      select: { id: true },
    })
    if (!unit) throw new NotFoundError('Unidad no encontrada')
  }

  private async generateTestDriveNumber(empresaId: string, db: PrismaClientType): Promise<string> {
    const now = new Date()
    const yy = String(now.getFullYear()).slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const prefix = `TM-${yy}${mm}${dd}-`

    const countToday = await (db as PrismaClient).dealerTestDrive.count({
      where: {
        empresaId,
        testDriveNumber: { startsWith: prefix },
      },
    })

    return `${prefix}${String(countToday + 1).padStart(4, '0')}`
  }

  private validateTransition(currentStatus: DealerTestDriveStatus, newStatus: DealerTestDriveStatus) {
    if (currentStatus === newStatus) return
    const allowed = STATUS_TRANSITIONS[currentStatus]
    if (!allowed.includes(newStatus)) {
      throw new BadRequestError(`Transición no permitida: ${currentStatus} -> ${newStatus}`)
    }
  }

  async create(
    data: CreateDealerTestDriveDTO,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IDealerTestDrive> {
    await this.assertUnitValid(data.dealerUnitId, empresaId, db)

    const status = (data.status as DealerTestDriveStatus) || DealerTestDriveStatus.SCHEDULED
    const testDriveNumber = await this.generateTestDriveNumber(empresaId, db)

    const created = await (db as PrismaClient).dealerTestDrive.create({
      data: {
        empresaId,
        dealerUnitId: data.dealerUnitId,
        testDriveNumber,
        status,
        customerName: data.customerName,
        customerDocument: data.customerDocument ?? null,
        customerPhone: data.customerPhone ?? null,
        customerEmail: data.customerEmail ?? null,
        driverLicense: data.driverLicense ?? null,
        scheduledAt: data.scheduledAt,
        advisorName: data.advisorName ?? null,
        routeDescription: data.routeDescription ?? null,
        observations: data.observations ?? null,
        customerFeedback: data.customerFeedback ?? null,
        ...(status === DealerTestDriveStatus.COMPLETED ? { completedAt: new Date() } : {}),
        ...(status === DealerTestDriveStatus.CANCELLED ? { cancelledAt: new Date() } : {}),
      },
      include: TEST_DRIVE_INCLUDE,
    })

    logger.info('Dealer test drive creado', { id: created.id, testDriveNumber, empresaId, userId })
    return created as unknown as IDealerTestDrive
  }

  async findById(id: string, empresaId: string, db: PrismaClientType): Promise<IDealerTestDrive> {
    const testDrive = await (db as PrismaClient).dealerTestDrive.findFirst({
      where: { id, empresaId },
      include: TEST_DRIVE_INCLUDE,
    })
    if (!testDrive) throw new NotFoundError('Prueba de manejo no encontrada')
    return testDrive as unknown as IDealerTestDrive
  }

  async findAll(
    filters: IDealerTestDriveFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'scheduledAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: IDealerTestDrive[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.DealerTestDriveWhereInput = { empresaId }
    if (filters.dealerUnitId) where.dealerUnitId = filters.dealerUnitId
    if (filters.status) where.status = filters.status as DealerTestDriveStatus
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.fromDate || filters.toDate) {
      where.scheduledAt = {}
      if (filters.fromDate) where.scheduledAt.gte = filters.fromDate
      if (filters.toDate) where.scheduledAt.lte = filters.toDate
    }
    if (filters.search) {
      const search = filters.search.trim()
      where.OR = [
        { testDriveNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerDocument: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { dealerUnit: { vin: { contains: search, mode: 'insensitive' } } },
        { dealerUnit: { code: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const validSortFields = new Set(['scheduledAt', 'createdAt', 'updatedAt', 'status'])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'scheduledAt'

    const [data, total] = await Promise.all([
      (db as PrismaClient).dealerTestDrive.findMany({
        where,
        include: TEST_DRIVE_INCLUDE,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).dealerTestDrive.count({ where }),
    ])

    return { data: data as unknown as IDealerTestDrive[], total }
  }

  async update(
    id: string,
    data: UpdateDealerTestDriveDTO,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IDealerTestDrive> {
    const current = await this.findById(id, empresaId, db)

    const newStatus = data.status ? (data.status as DealerTestDriveStatus) : current.status
    this.validateTransition(current.status, newStatus)

    const updateData: Prisma.DealerTestDriveUpdateInput = {}
    if (data.customerName !== undefined) updateData.customerName = data.customerName
    if (data.customerDocument !== undefined) updateData.customerDocument = data.customerDocument || null
    if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone || null
    if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail || null
    if (data.driverLicense !== undefined) updateData.driverLicense = data.driverLicense || null
    if (data.scheduledAt !== undefined) updateData.scheduledAt = data.scheduledAt
    if (data.advisorName !== undefined) updateData.advisorName = data.advisorName || null
    if (data.routeDescription !== undefined) updateData.routeDescription = data.routeDescription || null
    if (data.observations !== undefined) updateData.observations = data.observations || null
    if (data.customerFeedback !== undefined) updateData.customerFeedback = data.customerFeedback || null
    if (data.status !== undefined) updateData.status = newStatus
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    if (current.status !== newStatus) {
      if (newStatus === DealerTestDriveStatus.CONFIRMED) updateData.startedAt = new Date()
      if (newStatus === DealerTestDriveStatus.COMPLETED) updateData.completedAt = new Date()
      if (newStatus === DealerTestDriveStatus.CANCELLED) updateData.cancelledAt = new Date()
    }

    const updated = await (db as PrismaClient).dealerTestDrive.update({
      where: { id },
      data: updateData,
      include: TEST_DRIVE_INCLUDE,
    })

    logger.info('Dealer test drive actualizado', { id, empresaId, userId, status: newStatus })
    return updated as unknown as IDealerTestDrive
  }

  async delete(id: string, empresaId: string, userId: string, db: PrismaClientType): Promise<{ success: boolean; id: string }> {
    await this.findById(id, empresaId, db)
    await (db as PrismaClient).dealerTestDrive.update({
      where: { id },
      data: {
        isActive: false,
        status: DealerTestDriveStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    })

    logger.info('Dealer test drive desactivado', { id, empresaId, userId })
    return { success: true, id }
  }
}

export default new DealerTestDrivesService()
