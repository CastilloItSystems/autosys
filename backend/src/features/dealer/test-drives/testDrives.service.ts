import { DealerTestDriveStatus, Prisma, PrismaClient } from '../../../generated/prisma/client.js'
import { BadRequestError, NotFoundError } from '../../../shared/utils/apiError.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { CreateDealerTestDriveDTO, UpdateDealerTestDriveDTO } from './testDrives.dto.js'
import { IDealerTestDrive, IDealerTestDriveFilters } from './testDrives.interface.js'
import { domainEventBus } from '../../../shared/events/domain-event-bus.js'
import { toDomainEvent } from '../../../shared/events/domain-events.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const TEST_DRIVE_INCLUDE = {
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
    const customer = await this.assertCustomerValid(data.customerId, empresaId, db)

    const status = (data.status as DealerTestDriveStatus) || DealerTestDriveStatus.SCHEDULED
    const testDriveNumber = await this.generateTestDriveNumber(empresaId, db)

    const created = await (db as PrismaClient).dealerTestDrive.create({
      data: {
        empresaId,
        dealerUnitId: data.dealerUnitId,
        customerId: data.customerId,
        testDriveNumber,
        status,
        customerName: data.customerName || customer.name,
        customerDocument: data.customerDocument ?? customer.taxId ?? null,
        customerPhone: data.customerPhone ?? customer.phone ?? customer.mobile ?? null,
        customerEmail: data.customerEmail ?? customer.email ?? null,
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

    try {
      await domainEventBus.publish(
        toDomainEvent({
          empresaId,
          eventCode: 'dealer.test_drive.created',
          module: 'dealer',
          title: `Prueba de manejo ${created.testDriveNumber} creada`,
          message: `Se creó la prueba de manejo ${created.testDriveNumber}.`,
          type: 'info',
          entityType: 'DEALER_TEST_DRIVE',
          entityId: created.id,
          priority: 'MEDIUM',
          severity: 'INFO',
          link: '/empresa/concesionario/test-drives',
          source: 'dealer.test_drives',
          dedupKey: `dealer.test_drive.created:${created.id}`,
          metadata: {
            testDriveId: created.id,
            testDriveNumber: created.testDriveNumber,
            status: created.status,
            dealerUnitId: created.dealerUnitId,
            customerId: created.customerId,
            scheduledAt: created.scheduledAt,
          },
          createdById: userId,
          createdByName: 'Sistema',
        })
      )
    } catch (publishError) {
      logger.error('Error publicando evento dealer.test_drive.created', {
        testDriveId: created.id,
        empresaId,
        error: publishError,
      })
    }

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
        { customer: { name: { contains: search, mode: 'insensitive' } } },
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
    if (data.customerId !== undefined) {
      await this.assertCustomerValid(data.customerId, empresaId, db)
      updateData.customer = { connect: { id: data.customerId } }
    }
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

    if (current.status !== newStatus) {
      const isWarningStatus =
        newStatus === DealerTestDriveStatus.NO_SHOW ||
        newStatus === DealerTestDriveStatus.CANCELLED

      try {
        await domainEventBus.publish(
          toDomainEvent({
            empresaId,
            eventCode: 'dealer.test_drive.status_changed',
            module: 'dealer',
            title: `Prueba de manejo ${updated.testDriveNumber} actualizada`,
            message: `La prueba de manejo cambió de ${current.status} a ${newStatus}.`,
            type: isWarningStatus ? 'warning' : 'info',
            entityType: 'DEALER_TEST_DRIVE',
            entityId: updated.id,
            priority: isWarningStatus ? 'HIGH' : 'MEDIUM',
            severity: isWarningStatus ? 'WARNING' : 'INFO',
            link: '/empresa/concesionario/test-drives',
            source: 'dealer.test_drives',
            dedupKey: `dealer.test_drive.status_changed:${updated.id}:${newStatus}`,
            metadata: {
              testDriveId: updated.id,
              testDriveNumber: updated.testDriveNumber,
              previousStatus: current.status,
              status: newStatus,
              dealerUnitId: updated.dealerUnitId,
              customerId: updated.customerId,
              scheduledAt: updated.scheduledAt,
            },
            createdById: userId,
            createdByName: 'Sistema',
          })
        )
      } catch (publishError) {
        logger.error('Error publicando evento dealer.test_drive.status_changed', {
          testDriveId: updated.id,
          empresaId,
          status: newStatus,
          error: publishError,
        })
      }
    }

    return updated as unknown as IDealerTestDrive
  }

  async delete(id: string, empresaId: string, userId: string, db: PrismaClientType): Promise<{ success: boolean; id: string }> {
    const current = await this.findById(id, empresaId, db)
    await (db as PrismaClient).dealerTestDrive.update({
      where: { id },
      data: {
        isActive: false,
        status: DealerTestDriveStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    })

    logger.info('Dealer test drive desactivado', { id, empresaId, userId })

    try {
      await domainEventBus.publish(
        toDomainEvent({
          empresaId,
          eventCode: 'dealer.test_drive.status_changed',
          module: 'dealer',
          title: `Prueba de manejo ${current.testDriveNumber} cancelada`,
          message: `La prueba de manejo cambió de ${current.status} a CANCELLED.`,
          type: 'warning',
          entityType: 'DEALER_TEST_DRIVE',
          entityId: current.id,
          priority: 'HIGH',
          severity: 'WARNING',
          link: '/empresa/concesionario/test-drives',
          source: 'dealer.test_drives',
          dedupKey: `dealer.test_drive.status_changed:${current.id}:CANCELLED`,
          metadata: {
            testDriveId: current.id,
            testDriveNumber: current.testDriveNumber,
            previousStatus: current.status,
            status: DealerTestDriveStatus.CANCELLED,
            dealerUnitId: current.dealerUnitId,
            customerId: current.customerId,
          },
          createdById: userId,
          createdByName: 'Sistema',
        })
      )
    } catch (publishError) {
      logger.error('Error publicando evento dealer.test_drive.status_changed', {
        testDriveId: current.id,
        empresaId,
        status: DealerTestDriveStatus.CANCELLED,
        error: publishError,
      })
    }

    return { success: true, id }
  }
}

export default new DealerTestDrivesService()
