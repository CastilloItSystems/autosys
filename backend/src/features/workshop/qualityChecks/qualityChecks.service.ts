// backend/src/features/workshop/qualityChecks/qualityChecks.service.ts
import type { PrismaClient } from '../../../generated/prisma/client.js'
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '../../../shared/utils/apiError.js'
import { logger } from '../../../shared/utils/logger.js'
import type {
  ICreateQualityCheckInput,
  ISubmitQualityCheckInput,
} from './qualityChecks.interface.js'
import { changeServiceOrderStatusWithHistory } from '../serviceOrders/serviceOrderStatusHistory.service.js'
import { domainEventBus } from '../../../shared/events/domain-event-bus.js'
import { toDomainEvent } from '../../../shared/events/domain-events.js'

type Db =
  | PrismaClient
  | Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >

const INCLUDE = {
  serviceOrder: {
    select: { id: true, folio: true, status: true, vehiclePlate: true },
  },
  checklistTemplate: {
    select: {
      id: true,
      code: true,
      name: true,
      items: {
        where: { isActive: true },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          responseType: true,
          isRequired: true,
          order: true,
          options: true,
        },
        orderBy: { order: 'asc' as const },
      },
    },
  },
  inspector: {
    select: {
      id: true,
      nombre: true,
    },
  },
} as const

export async function findAllQualityChecks(
  db: Db,
  empresaId: string,
  filters: any = {}
) {
  const { page = 1, limit = 20 } = filters ?? {}
  const where = { serviceOrder: { empresaId } }
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    (db as PrismaClient).qualityCheck.findMany({
      where,
      skip,
      take: limit,
      include: INCLUDE,
    }),
    (db as PrismaClient).qualityCheck.count({ where }),
  ])
  return { data, page, limit, total }
}

export async function findQualityCheckBySOId(
  db: Db,
  serviceOrderId: string,
  empresaId: string
) {
  const item = await (db as PrismaClient).qualityCheck.findFirst({
    where: { serviceOrderId, serviceOrder: { empresaId } },
    include: INCLUDE,
  })
  if (!item)
    throw new NotFoundError('Control de calidad no encontrado para esta orden')
  return item
}

export async function findQualityCheckById(
  db: Db,
  id: string,
  empresaId: string
) {
  const item = await (db as PrismaClient).qualityCheck.findFirst({
    where: { id, serviceOrder: { empresaId } },
    include: INCLUDE,
  })
  if (!item) throw new NotFoundError('Control de calidad no encontrado')
  return item
}

export async function createQualityCheck(
  db: Db,
  empresaId: string,
  userId: string,
  data: ICreateQualityCheckInput
) {
  // Verificar que la OT existe y pertenece a la empresa
  const so = await (db as PrismaClient).serviceOrder.findFirst({
    where: { id: data.serviceOrderId, empresaId },
    select: { id: true, status: true },
  })
  if (!so) throw new NotFoundError('Orden de trabajo no encontrada')
  if (!['IN_PROGRESS', 'QUALITY_CHECK'].includes(so.status)) {
    throw new BadRequestError(
      'El control de calidad solo se puede crear cuando la OT está en IN_PROGRESS o QUALITY_CHECK'
    )
  }

  // Verificar que el inspector existe, es técnico y está activo
  const inspector = await (db as PrismaClient).user.findFirst({
    where: {
      id: data.inspectorId,
      memberships: { some: { empresaId } },
    },
    select: { id: true, isTechnician: true, estado: true, eliminado: true },
  })
  if (!inspector) throw new NotFoundError('Inspector no encontrado')
  if (!inspector.isTechnician)
    throw new BadRequestError('El usuario seleccionado no tiene rol de técnico')
  if (inspector.estado !== 'activo')
    throw new BadRequestError('El inspector no está activo')
  if (inspector.eliminado)
    throw new BadRequestError('El inspector ha sido eliminado del sistema')

  // Verificar que no exista ya uno (1:1)
  const existing = await (db as PrismaClient).qualityCheck.findFirst({
    where: {
      serviceOrderId: data.serviceOrderId,
      serviceOrder: { empresaId },
    },
  })
  if (existing)
    throw new ConflictError(
      'Ya existe un control de calidad para esta orden. Use el endpoint de actualización.'
    )

  // Mover OT a QUALITY_CHECK si estaba en IN_PROGRESS y crear el QC deben ser
  // atómicos. Diferimos los eventos del cambio de estado al commit.
  const { created, publishStatusEvents } = await (
    db as PrismaClient
  ).$transaction(async (tx) => {
    let publishStatusEvents: (() => Promise<void>) | null = null

    if (so.status === 'IN_PROGRESS') {
      const { publishEvents } = await changeServiceOrderStatusWithHistory(
        tx,
        {
          serviceOrderId: data.serviceOrderId,
          empresaId,
          newStatus: 'QUALITY_CHECK',
          userId,
          comment: 'Control de calidad iniciado',
        },
        { tx }
      )
      publishStatusEvents = publishEvents
    }

    const created = await tx.qualityCheck.create({
      data: {
        serviceOrderId: data.serviceOrderId,
        inspectorId: data.inspectorId,
        status: 'IN_PROGRESS',
        checklistItems: (data.checklistItems as any) ?? [],
        startedAt: new Date(),
        notes: data.notes ?? null,
        createdBy: userId,
      },
      include: INCLUDE,
    })

    return { created, publishStatusEvents }
  })

  // Eventos de cambio de estado de la OT: publicados tras el commit.
  if (publishStatusEvents) {
    await publishStatusEvents()
  }

  try {
    await domainEventBus.publish(
      toDomainEvent({
        empresaId,
        eventCode: 'workshop.quality_check.created',
        module: 'workshop',
        title: `Control de calidad creado para OT ${created.serviceOrder.folio}`,
        message: `Se inició un control de calidad para la orden ${created.serviceOrder.folio}.`,
        type: 'info',
        entityType: 'QUALITY_CHECK',
        entityId: created.id,
        priority: 'MEDIUM',
        severity: 'INFO',
        link: `/empresa/taller/quality-checks/${created.id}`,
        source: 'workshop.quality_checks',
        dedupKey: `workshop.quality_check.created:${created.id}`,
        metadata: {
          qualityCheckId: created.id,
          serviceOrderId: created.serviceOrderId,
          serviceOrderFolio: created.serviceOrder.folio,
          inspectorId: created.inspectorId,
          status: created.status,
        },
        createdById: userId,
        createdByName: 'Sistema',
      })
    )
  } catch (publishError) {
    logger.error('Error publicando evento workshop.quality_check.created', {
      qualityCheckId: created.id,
      empresaId,
      error: publishError,
    })
  }

  return created
}

export async function submitQualityCheck(
  db: Db,
  id: string,
  empresaId: string,
  data: ISubmitQualityCheckInput,
  userId: string
) {
  const item = await findQualityCheckById(db, id, empresaId)

  // Optimistic locking: verify updatedAt hasn't changed
  if (data.updatedAt) {
    const clientUpdatedAt = new Date(data.updatedAt).getTime()
    const serverUpdatedAt = item.updatedAt.getTime()
    if (clientUpdatedAt !== serverUpdatedAt) {
      throw new ConflictError(
        'El control de calidad fue modificado por otro usuario. Por favor, recarga y reinten.'
      )
    }
  }

  if (item.status === 'PASSED')
    throw new BadRequestError('Este control de calidad ya fue aprobado')
  if (item.status === 'FAILED' && item.retryCount >= 3) {
    throw new BadRequestError(
      'Se alcanzó el máximo de reintentos. Escale con el jefe de taller.'
    )
  }

  const allPassed = data.checklistItems.every((i) => i.passed)
  const newStatus = allPassed ? 'PASSED' : 'FAILED'
  const targetStatus = allPassed ? 'READY' : 'IN_PROGRESS'

  // Cambio de estado de la OT (+ history) y actualización del QC deben ser
  // atómicos: si una falla, la otra revierte. Envolvemos ambas en una sola
  // transacción y diferimos los eventos de dominio al commit.
  const { updated, publishStatusEvents } = await (
    db as PrismaClient
  ).$transaction(async (tx) => {
    // Si aprueba → mover OT a READY; si falla → regresar a IN_PROGRESS
    const { publishEvents: publishStatusEvents } =
      await changeServiceOrderStatusWithHistory(
        tx,
        {
          serviceOrderId: item.serviceOrderId,
          empresaId,
          newStatus: targetStatus,
          userId,
          comment: allPassed
            ? 'Control de calidad aprobado'
            : 'Control de calidad rechazado',
        },
        { tx }
      )

    const updated = await tx.qualityCheck.update({
      where: { id },
      data: {
        status: newStatus,
        checklistItems: data.checklistItems as any,
        failureNotes: data.failureNotes ?? null,
        completedAt: new Date(),
        retryCount: allPassed ? item.retryCount : item.retryCount + 1,
        notes: data.notes ?? item.notes,
      },
      include: INCLUDE,
    })

    return { updated, publishStatusEvents }
  })

  // Eventos de cambio de estado de la OT: publicados tras el commit.
  await publishStatusEvents()

  const eventCode =
    newStatus === 'PASSED'
      ? 'workshop.quality_check.passed'
      : 'workshop.quality_check.failed'

  try {
    await domainEventBus.publish(
      toDomainEvent({
        empresaId,
        eventCode,
        module: 'workshop',
        title:
          newStatus === 'PASSED'
            ? `Control de calidad aprobado para OT ${updated.serviceOrder.folio}`
            : `Control de calidad rechazado para OT ${updated.serviceOrder.folio}`,
        message:
          newStatus === 'PASSED'
            ? 'El vehículo superó el control de calidad.'
            : 'El vehículo no superó el control de calidad.',
        type: newStatus === 'PASSED' ? 'success' : 'warning',
        entityType: 'QUALITY_CHECK',
        entityId: updated.id,
        priority: newStatus === 'PASSED' ? 'MEDIUM' : 'HIGH',
        severity: newStatus === 'PASSED' ? 'SUCCESS' : 'WARNING',
        link: `/empresa/taller/quality-checks/${updated.id}`,
        source: 'workshop.quality_checks',
        dedupKey: `${eventCode}:${updated.id}`,
        metadata: {
          qualityCheckId: updated.id,
          serviceOrderId: updated.serviceOrderId,
          serviceOrderFolio: updated.serviceOrder.folio,
          status: updated.status,
          retryCount: updated.retryCount,
          allPassed,
        },
        createdById: userId,
        createdByName: 'Sistema',
      })
    )
  } catch (publishError) {
    logger.error(`Error publicando evento ${eventCode}`, {
      qualityCheckId: updated.id,
      empresaId,
      error: publishError,
    })
  }

  return updated
}
