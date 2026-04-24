import type { PrismaClient } from '../../../generated/prisma/client.js'
import { NotFoundError } from '../../../shared/utils/apiError.js'
import type { ServiceOrderStatus } from './serviceOrders.interface.js'
import { logger } from '../../../shared/utils/logger.js'
import { domainEventBus } from '../../../shared/events/domain-event-bus.js'
import { toDomainEvent } from '../../../shared/events/domain-events.js'

type Db =
  | PrismaClient
  | Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >

interface IChangeStatusWithHistoryInput {
  serviceOrderId: string
  empresaId: string
  newStatus: ServiceOrderStatus
  userId: string
  comment?: string
  extraData?: Record<string, unknown>
}

interface IStatusHistoryFilters {
  page?: number
  limit?: number
}

export async function changeServiceOrderStatusWithHistory(
  db: Db,
  input: IChangeStatusWithHistoryInput
) {
  const prisma = db as PrismaClient
  const { serviceOrderId, empresaId, newStatus, userId, comment, extraData } =
    input

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.serviceOrder.findFirst({
      where: { id: serviceOrderId, empresaId },
      select: { id: true, status: true, folio: true },
    })

    if (!existing) {
      throw new NotFoundError('Orden de taller no encontrada')
    }

    const updated = await tx.serviceOrder.update({
      where: { id: serviceOrderId },
      data: { status: newStatus, ...(extraData ?? {}) },
    })

    await tx.serviceOrderStatusHistory.create({
      data: {
        serviceOrderId,
        previousStatus: existing.status,
        newStatus,
        comment: comment?.trim() || null,
        userId,
        empresaId,
      },
    })

    return {
      updated,
      previousStatus: existing.status,
      folio: existing.folio,
    }
  })

  try {
    await domainEventBus.publish(
      toDomainEvent({
        empresaId,
        eventCode: 'workshop.service_order.status_changed',
        module: 'workshop',
        title: `Orden ${result.folio} actualizada`,
        message: `La orden ${result.folio} cambió de ${result.previousStatus} a ${newStatus}.`,
        type: 'info',
        entityType: 'SERVICE_ORDER',
        entityId: serviceOrderId,
        priority: 'MEDIUM',
        severity: 'INFO',
        link: `/empresa/taller/ordenes/${serviceOrderId}`,
        source: 'workshop.service_orders',
        dedupKey: `workshop.service_order.status_changed:${serviceOrderId}:${newStatus}`,
        metadata: {
          serviceOrderId,
          folio: result.folio,
          previousStatus: result.previousStatus,
          status: newStatus,
        },
        createdById: userId,
        createdByName: 'Sistema',
      })
    )

    if (newStatus === 'READY') {
      await domainEventBus.publish(
        toDomainEvent({
          empresaId,
          eventCode: 'workshop.service_order.ready',
          module: 'workshop',
          title: `Orden ${result.folio} lista`,
          message: `La orden ${result.folio} está lista para entrega.`,
          type: 'success',
          entityType: 'SERVICE_ORDER',
          entityId: serviceOrderId,
          priority: 'HIGH',
          severity: 'SUCCESS',
          link: `/empresa/taller/ordenes/${serviceOrderId}`,
          source: 'workshop.service_orders',
          dedupKey: `workshop.service_order.ready:${serviceOrderId}`,
          metadata: {
            serviceOrderId,
            folio: result.folio,
          },
          createdById: userId,
          createdByName: 'Sistema',
        })
      )
    }

    if (newStatus === 'DELIVERED') {
      await domainEventBus.publish(
        toDomainEvent({
          empresaId,
          eventCode: 'workshop.service_order.delivered',
          module: 'workshop',
          title: `Orden ${result.folio} entregada`,
          message: `La orden ${result.folio} fue entregada.`,
          type: 'success',
          entityType: 'SERVICE_ORDER',
          entityId: serviceOrderId,
          priority: 'HIGH',
          severity: 'SUCCESS',
          link: `/empresa/taller/ordenes/${serviceOrderId}`,
          source: 'workshop.service_orders',
          dedupKey: `workshop.service_order.delivered:${serviceOrderId}`,
          metadata: {
            serviceOrderId,
            folio: result.folio,
          },
          createdById: userId,
          createdByName: 'Sistema',
        })
      )
    }
  } catch (publishError) {
    logger.error('Error publicando eventos de estado de orden de taller', {
      serviceOrderId,
      empresaId,
      status: newStatus,
      error: publishError,
    })
  }

  return result.updated
}

export async function findServiceOrderStatusHistory(
  db: Db,
  serviceOrderId: string,
  empresaId: string,
  filters: IStatusHistoryFilters = {}
) {
  const prisma = db as PrismaClient
  const page = Number(filters.page ?? 1)
  const limit = Number(filters.limit ?? 20)
  const skip = (page - 1) * limit

  const order = await prisma.serviceOrder.findFirst({
    where: { id: serviceOrderId, empresaId },
    select: { id: true },
  })

  if (!order) {
    throw new NotFoundError('Orden de taller no encontrada')
  }

  const where = { serviceOrderId, empresaId }

  const [rows, total] = await Promise.all([
    prisma.serviceOrderStatusHistory.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.serviceOrderStatusHistory.count({ where }),
  ])

  return {
    data: rows,
    page,
    limit,
    total,
  }
}
