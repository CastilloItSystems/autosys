// backend/src/features/inventory/returns/returns.service.ts

import { v4 as uuidv4 } from 'uuid'
import prisma from '../../../services/prisma.service'
import { logger } from '../../../shared/utils/logger'
import { NotFoundError, BadRequestError } from '../../../shared/utils/apiError'
import {
  IReturn,
  IReturnWithRelations,
  ICreateReturnInput,
  IUpdateReturnInput,
  ReturnStatus,
} from './returns.interface'
import { EventType } from '../shared/events/event.types'
import EventService from '../shared/events/event.service'

const eventService = EventService.getInstance()

class ReturnsService {
  private static instance: ReturnsService

  private constructor() {}

  static getInstance(): ReturnsService {
    if (!ReturnsService.instance) {
      ReturnsService.instance = new ReturnsService()
    }
    return ReturnsService.instance
  }

  async create(
    input: ICreateReturnInput,
    userId: string
  ): Promise<IReturnWithRelations> {
    try {
      logger.info('Creating return', { type: input.type, userId })

      const warehouse = await prisma.warehouse.findUnique({
        where: { id: input.warehouseId },
      })

      if (!warehouse) {
        throw new NotFoundError('Warehouse not found')
      }

      const count = await prisma.returnOrder.count()
      const returnNumber = `RET-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`

      // Validate items exist
      for (const item of input.items) {
        const itemRecord = await prisma.item.findUnique({
          where: { id: item.itemId },
        })
        if (!itemRecord) {
          throw new NotFoundError(`Item ${item.itemId} not found`)
        }
      }

      const ret = await prisma.returnOrder.create({
        data: {
          id: uuidv4(),
          returnNumber,
          type: input.type as any,
          status: ReturnStatus.DRAFT as any,
          warehouseId: input.warehouseId,
          reason: input.reason,
          notes: input.notes || null,
          createdBy: userId,
          items: {
            create: input.items.map((item) => ({
              id: uuidv4(),
              itemId: item.itemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice || null,
              notes: item.notes,
            })),
          },
        },
        include: { items: { include: { item: true } }, warehouse: true },
      })

      await eventService.emit({
        type: EventType.RETURN_CREATED,
        entityId: ret.id,
        entityType: 'return',
        userId,
        data: { returnNumber: ret.returnNumber, type: ret.type },
      })

      return this.mapToInterface(ret)
    } catch (error) {
      logger.error('Error creating return', { error })
      throw error
    }
  }

  async findById(id: string): Promise<IReturnWithRelations> {
    const ret = await prisma.returnOrder.findUnique({
      where: { id },
      include: { items: { include: { item: true } }, warehouse: true },
    })

    if (!ret) throw new NotFoundError('Return not found')
    return this.mapToInterface(ret)
  }

  async findAll(
    page = 1,
    limit = 10,
    filters?: { status?: ReturnStatus; type?: string; warehouseId?: string },
    prismaClient?: any
  ): Promise<any> {
    const where: any = {}
    if (filters?.status) where.status = filters.status
    if (filters?.type) where.type = filters.type
    if (filters?.warehouseId) where.warehouseId = filters.warehouseId

    const db = prismaClient || prisma

    const [data, total] = await Promise.all([
      db.returnOrder.findMany({
        where,
        include: { items: { include: { item: true } }, warehouse: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.returnOrder.count({ where }),
    ])

    return {
      data: data.map((r) => this.mapToInterface(r)),
      total,
      page,
      limit,
    }
  }

  async submit(id: string, userId: string): Promise<IReturnWithRelations> {
    const ret = await prisma.returnOrder.findUnique({ where: { id } })
    if (!ret) throw new NotFoundError('Return not found')
    if (ret.status !== ReturnStatus.DRAFT)
      throw new BadRequestError(
        'Only draft returns can be submitted for approval'
      )

    const updated = await prisma.returnOrder.update({
      where: { id },
      data: { status: ReturnStatus.PENDING_APPROVAL as any },
      include: { items: { include: { item: true } }, warehouse: true },
    })

    await eventService.emit({
      type: EventType.RETURN_CREATED,
      entityId: id,
      entityType: 'return',
      userId,
      data: { returnNumber: updated.returnNumber, action: 'submitted' },
    })

    return this.mapToInterface(updated)
  }

  async update(
    id: string,
    input: IUpdateReturnInput,
    userId: string
  ): Promise<IReturnWithRelations> {
    const ret = await prisma.returnOrder.findUnique({ where: { id } })
    if (!ret) throw new NotFoundError('Return not found')
    if (ret.status !== ReturnStatus.DRAFT)
      throw new BadRequestError('Can only update draft returns')

    const updated = await prisma.returnOrder.update({
      where: { id },
      data: {
        reason: input.reason ?? ret.reason,
        notes: input.notes ?? ret.notes,
      },
      include: { items: { include: { item: true } }, warehouse: true },
    })

    return this.mapToInterface(updated)
  }

  async approve(id: string, userId: string): Promise<IReturnWithRelations> {
    const ret = await prisma.returnOrder.findUnique({ where: { id } })
    if (!ret) throw new NotFoundError('Return not found')
    if (ret.status !== ReturnStatus.PENDING_APPROVAL)
      throw new BadRequestError('Only pending returns can be approved')

    const updated = await prisma.returnOrder.update({
      where: { id },
      data: {
        status: ReturnStatus.APPROVED as any,
        approvedBy: userId,
        approvedAt: new Date(),
      },
      include: { items: { include: { item: true } }, warehouse: true },
    })

    await eventService.emit({
      type: EventType.RETURN_APPROVED,
      entityId: id,
      entityType: 'return',
      userId,
      data: { returnNumber: updated.returnNumber },
    })

    return this.mapToInterface(updated)
  }

  async process(id: string, userId: string): Promise<IReturnWithRelations> {
    const ret = await prisma.returnOrder.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!ret) throw new NotFoundError('Return not found')
    if (ret.status !== ReturnStatus.APPROVED)
      throw new BadRequestError('Only approved returns can be processed')

    // Create movements to add items back
    for (const item of ret.items) {
      await prisma.movement.create({
        data: {
          id: uuidv4(),
          movementNumber: `MOV-RET-${uuidv4().substring(0, 8)}`,
          type: 'SUPPLIER_RETURN' as any,
          itemId: item.itemId,
          quantity: item.quantity,
          warehouseToId: ret.warehouseId,
          movementDate: new Date(),
          createdBy: userId,
        },
      })

      // Update stock
      const stock = await prisma.stock.findUnique({
        where: {
          itemId_warehouseId: {
            itemId: item.itemId,
            warehouseId: ret.warehouseId,
          },
        },
      })

      if (stock) {
        await prisma.stock.update({
          where: {
            itemId_warehouseId: {
              itemId: item.itemId,
              warehouseId: ret.warehouseId,
            },
          },
          data: {
            quantityReal: { increment: item.quantity },
            quantityAvailable: { increment: item.quantity },
          },
        })
      }
    }

    const updated = await prisma.returnOrder.update({
      where: { id },
      data: {
        status: ReturnStatus.PROCESSED as any,
        processedBy: userId,
        processedAt: new Date(),
      },
      include: { items: { include: { item: true } }, warehouse: true },
    })

    await eventService.emit({
      type: EventType.RETURN_PROCESSED,
      entityId: id,
      entityType: 'return',
      userId,
      data: { returnNumber: updated.returnNumber },
    })

    return this.mapToInterface(updated)
  }

  async reject(id: string, userId: string): Promise<IReturnWithRelations> {
    const ret = await prisma.returnOrder.findUnique({ where: { id } })
    if (!ret) throw new NotFoundError('Return not found')
    if (ret.status !== ReturnStatus.PENDING_APPROVAL) {
      throw new BadRequestError('Only pending returns can be rejected')
    }

    const updated = await prisma.returnOrder.update({
      where: { id },
      data: {
        status: ReturnStatus.REJECTED as any,
        processedBy: userId,
        processedAt: new Date(),
      },
      include: { items: { include: { item: true } }, warehouse: true },
    })

    await eventService.emit({
      type: EventType.RETURN_REJECTED,
      entityId: id,
      entityType: 'return',
      userId,
      data: { returnNumber: updated.returnNumber },
    })

    return this.mapToInterface(updated)
  }

  async cancel(id: string, userId: string): Promise<IReturnWithRelations> {
    const ret = await prisma.returnOrder.findUnique({ where: { id } })
    if (!ret) throw new NotFoundError('Return not found')
    if (
      ret.status === ReturnStatus.PROCESSED ||
      ret.status === ReturnStatus.REJECTED
    ) {
      throw new BadRequestError('Cannot cancel processed or rejected returns')
    }

    const updated = await prisma.returnOrder.update({
      where: { id },
      data: {
        status: ReturnStatus.CANCELLED as any,
        processedBy: userId,
        processedAt: new Date(),
      },
      include: { items: { include: { item: true } }, warehouse: true },
    })

    return this.mapToInterface(updated)
  }

  private mapToInterface(ret: any): IReturnWithRelations {
    return {
      id: ret.id,
      returnNumber: ret.returnNumber,
      type: ret.type,
      status: ret.status,
      warehouseId: ret.warehouseId,
      reason: ret.reason,
      notes: ret.notes,
      approvedBy: ret.approvedBy,
      approvedAt: ret.approvedAt,
      processedBy: ret.processedBy,
      processedAt: ret.processedAt,
      createdBy: ret.createdBy,
      createdAt: ret.createdAt,
      updatedAt: ret.updatedAt,
      items: ret.items,
      warehouse: ret.warehouse,
    }
  }
}

export default ReturnsService.getInstance()
