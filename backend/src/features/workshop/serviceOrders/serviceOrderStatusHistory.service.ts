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

// Cliente transaccional de Prisma (el `tx` que entrega `$transaction`).
type PrismaTx = Omit<
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

interface IChangeStatusOptions {
  // Cliente transaccional opcional. Cuando se provee, las operaciones de
  // BD se ejecutan sobre esa transacción (sin abrir una anidada) y la
  // publicación de eventos de dominio se difiere a la función `publishEvents`
  // que el llamador debe invocar DESPUÉS de hacer commit de su transacción.
  tx?: PrismaTx
}

interface IStatusHistoryFilters {
  page?: number
  limit?: number
}

// Ejecuta el cambio de estado + creación de history sobre un cliente
// (transaccional o no). NO publica eventos; eso queda a cargo del llamador.
async function applyStatusChange(
  client: PrismaTx,
  input: IChangeStatusWithHistoryInput
) {
  const { serviceOrderId, empresaId, newStatus, userId, comment, extraData } =
    input

  const existing = await client.serviceOrder.findFirst({
    where: { id: serviceOrderId, empresaId },
    select: { id: true, status: true, folio: true },
  })

  if (!existing) {
    throw new NotFoundError('Orden de taller no encontrada')
  }

  const updated = await client.serviceOrder.update({
    where: { id: serviceOrderId },
    data: { status: newStatus, ...(extraData ?? {}) },
  })

  await client.serviceOrderStatusHistory.create({
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
}

// Publica los eventos de dominio asociados a un cambio de estado.
// Diseñada para invocarse DESPUÉS del commit de la transacción.
async function publishStatusChangeEvents(
  input: IChangeStatusWithHistoryInput,
  result: { previousStatus: string; folio: string }
) {
  const { serviceOrderId, empresaId, newStatus, userId } = input
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
}

type StatusChangeResult = Awaited<ReturnType<typeof applyStatusChange>>['updated']

// Sobrecargas: con `tx` se difieren los eventos y se devuelve `publishEvents`;
// sin `tx` se publican de inmediato y se devuelve solo la OT actualizada.
export async function changeServiceOrderStatusWithHistory(
  db: Db,
  input: IChangeStatusWithHistoryInput,
  options: IChangeStatusOptions & { tx: PrismaTx }
): Promise<{ updated: StatusChangeResult; publishEvents: () => Promise<void> }>
export async function changeServiceOrderStatusWithHistory(
  db: Db,
  input: IChangeStatusWithHistoryInput,
  options?: IChangeStatusOptions
): Promise<StatusChangeResult>
export async function changeServiceOrderStatusWithHistory(
  db: Db,
  input: IChangeStatusWithHistoryInput,
  options: IChangeStatusOptions = {}
) {
  // Caso A: se nos pasó un cliente transaccional (`tx`). Ejecutamos las
  // operaciones de BD sobre esa transacción y diferimos los eventos: el
  // llamador es responsable de publicarlos tras el commit usando el
  // `publishEvents` devuelto.
  if (options.tx) {
    const result = await applyStatusChange(options.tx, input)
    return {
      updated: result.updated,
      publishEvents: () => publishStatusChangeEvents(input, result),
    }
  }

  // Caso B: comportamiento original. Abrimos transacción propia y publicamos
  // los eventos de inmediato tras el commit.
  const prisma = db as PrismaClient
  const result = await prisma.$transaction((tx) =>
    applyStatusChange(tx, input)
  )

  await publishStatusChangeEvents(input, result)

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
