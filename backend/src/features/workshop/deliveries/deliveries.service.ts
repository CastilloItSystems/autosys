// backend/src/features/workshop/deliveries/deliveries.service.ts
import type { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import { logger } from '../../../shared/utils/logger.js'
import type {
  ICreateDeliveryInput,
  IUpdateDeliveryInput,
} from './deliveries.interface.js'
import { changeServiceOrderStatusWithHistory } from '../serviceOrders/serviceOrderStatusHistory.service.js'
import { domainEventBus } from '../../../shared/events/domain-event-bus.js'
import { toDomainEvent } from '../../../shared/events/domain-events.js'
import { resolveUserNames } from '../../sales/shared/userNameResolver.js'
import { assertReturnedPartsBeforeClose } from '../deliveryReturnedParts/deliveryReturnedParts.service.js'

type Db =
  | PrismaClient
  | Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >

// FASE 2.5: Allowed statuses for delivery creation (QUALITY_CHECK and onwards)
const DELIVERY_ALLOWED_STATUSES = ['QUALITY_CHECK', 'READY']

export async function findAllDeliveries(
  db: Db,
  empresaId: string,
  filters: any = {}
) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters ?? {}
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    (db as PrismaClient).vehicleDelivery.findMany({
      where: { empresaId },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        serviceOrder: { select: { id: true, folio: true, status: true } },
      },
    }),
    (db as PrismaClient).vehicleDelivery.count({ where: { empresaId } }),
  ])
  const userMap = await resolveUserNames(db, data.map((d) => d.deliveredBy))
  const enriched = data.map((d) => ({
    ...d,
    deliveredByName: d.deliveredBy ? (userMap.get(d.deliveredBy) ?? null) : null,
  }))
  return { data: enriched, page, limit, total }
}

export async function createDelivery(
  db: Db,
  empresaId: string,
  userId: string,
  data: ICreateDeliveryInput
) {
  // FASE 2.1: Validate ServiceOrder exists and status is allowed
  const serviceOrder = await (db as PrismaClient).serviceOrder.findFirst({
    where: { id: data.serviceOrderId, empresaId },
    select: { id: true, status: true },
  })
  if (!serviceOrder) {
    throw new NotFoundError('Orden de trabajo no encontrada')
  }
  if (!DELIVERY_ALLOWED_STATUSES.includes(serviceOrder.status as string)) {
    throw new BadRequestError(
      `La orden debe estar en estado de entrega (${DELIVERY_ALLOWED_STATUSES.join(', ')}). Estado actual: ${serviceOrder.status}`
    )
  }

  // FASE 2.2: Check delivery doesn't already exist for this SO
  const existing = await (db as PrismaClient).vehicleDelivery.findFirst({
    where: { serviceOrderId: data.serviceOrderId, empresaId },
  })
  if (existing) {
    throw new ConflictError(
      'La orden de trabajo ya tiene una entrega registrada'
    )
  }

  // FASE 2.3: Create delivery
  const delivery = await (db as PrismaClient).vehicleDelivery.create({
    data: {
      empresaId,
      serviceOrderId: data.serviceOrderId,
      deliveredBy: data.deliveredBy,
      receivedByName: data.receivedByName,
      clientConformity: data.clientConformity ?? true,
      clientSignature: data.clientSignature,
      observations: data.observations,
      nextVisitDate: data.nextVisitDate ? new Date(data.nextVisitDate) : null,
    },
    include: {
      serviceOrder: { select: { id: true, folio: true, status: true } },
    },
  })

  // FASE 2.4: Auto-transition ServiceOrder.status to DELIVERED
  await changeServiceOrderStatusWithHistory(db, {
    serviceOrderId: data.serviceOrderId,
    empresaId,
    newStatus: 'DELIVERED',
    userId,
    comment: 'Entrega de vehículo registrada',
    extraData: { updatedAt: new Date() },
  })

  try {
    await domainEventBus.publish(
      toDomainEvent({
        empresaId,
        eventCode: 'workshop.delivery.created',
        module: 'workshop',
        title: `Entrega registrada para orden ${delivery.serviceOrder.folio}`,
        message: `Se registró la entrega de la orden ${delivery.serviceOrder.folio}.`,
        type: 'success',
        entityType: 'DELIVERY',
        entityId: delivery.id,
        priority: 'HIGH',
        severity: 'SUCCESS',
        link: `/empresa/taller/entregas`,
        source: 'workshop.deliveries',
        dedupKey: `workshop.delivery.created:${delivery.id}`,
        metadata: {
          deliveryId: delivery.id,
          serviceOrderId: delivery.serviceOrder.id,
          serviceOrderFolio: delivery.serviceOrder.folio,
          serviceOrderStatus: delivery.serviceOrder.status,
          receivedByName: delivery.receivedByName,
        },
        createdById: userId,
        createdByName: 'Sistema',
      })
    )
  } catch (publishError) {
    logger.error('Error publicando evento workshop.delivery.created', {
      deliveryId: delivery.id,
      empresaId,
      error: publishError,
    })
  }

  const userMap = await resolveUserNames(db, [delivery.deliveredBy])
  return {
    ...delivery,
    deliveredByName: delivery.deliveredBy ? (userMap.get(delivery.deliveredBy) ?? null) : null,
  }
}

export async function findDeliveryByServiceOrder(
  db: Db,
  serviceOrderId: string,
  empresaId: string
) {
  const delivery = await (db as PrismaClient).vehicleDelivery.findFirst({
    where: { serviceOrderId, empresaId },
  })
  if (!delivery) return null
  const userMap = await resolveUserNames(db, [delivery.deliveredBy])
  return {
    ...delivery,
    deliveredByName: delivery.deliveredBy ? (userMap.get(delivery.deliveredBy) ?? null) : null,
  }
}

// FASE 1.2: Update delivery (editable fields only)
export async function updateDelivery(
  db: Db,
  id: string,
  empresaId: string,
  data: IUpdateDeliveryInput
) {
  const delivery = await (db as PrismaClient).vehicleDelivery.findFirst({
    where: { id, empresaId },
  })
  if (!delivery) throw new NotFoundError('Entrega no encontrada')

  const updated = await (db as PrismaClient).vehicleDelivery.update({
    where: { id },
    data: {
      receivedByName: data.receivedByName ?? delivery.receivedByName,
      clientConformity:
        data.clientConformity !== undefined
          ? data.clientConformity
          : delivery.clientConformity,
      clientSignature:
        data.clientSignature !== undefined
          ? data.clientSignature
          : delivery.clientSignature,
      observations:
        data.observations !== undefined
          ? data.observations
          : delivery.observations,
      nextVisitDate:
        data.nextVisitDate !== undefined
          ? new Date(data.nextVisitDate)
          : delivery.nextVisitDate,
    },
    include: {
      serviceOrder: { select: { id: true, folio: true, status: true } },
    },
  })
  const userMap = await resolveUserNames(db, [updated.deliveredBy])
  return {
    ...updated,
    deliveredByName: updated.deliveredBy ? (userMap.get(updated.deliveredBy) ?? null) : null,
  }
}

// §23.3 — marcar entrega de repuestos sustituidos al cliente.
// Bloquea si no hay al menos 1 registro acknowledged en DeliveryReturnedPart.
export async function markSubstitutedPartsReturned(
  db: Db,
  id: string,
  empresaId: string
) {
  const delivery = await (db as PrismaClient).vehicleDelivery.findFirst({
    where: { id, empresaId },
  })
  if (!delivery) throw new NotFoundError('Entrega no encontrada')

  await assertReturnedPartsBeforeClose(db as PrismaClient, id)

  return (db as PrismaClient).vehicleDelivery.update({
    where: { id },
    data: { substitutedPartsReturned: true },
  })
}

// FASE 1.3: Delete delivery
export async function deleteDelivery(db: Db, id: string, empresaId: string) {
  const delivery = await (db as PrismaClient).vehicleDelivery.findFirst({
    where: { id, empresaId },
  })
  if (!delivery) throw new NotFoundError('Entrega no encontrada')

  // Delete delivery (cascade handled by Prisma)
  await (db as PrismaClient).vehicleDelivery.delete({
    where: { id },
  })
}
