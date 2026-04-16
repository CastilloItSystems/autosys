// backend/src/features/workshop/qualityChecks/qualityChecks.service.ts
import type { PrismaClient } from '../../../generated/prisma/client.js'
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '../../../shared/utils/apiError.js'
import type {
  ICreateQualityCheckInput,
  ISubmitQualityCheckInput,
} from './qualityChecks.interface.js'
import { changeServiceOrderStatusWithHistory } from '../serviceOrders/serviceOrderStatusHistory.service.js'

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
    where: { id: data.inspectorId },
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
    where: { serviceOrderId: data.serviceOrderId },
  })
  if (existing)
    throw new ConflictError(
      'Ya existe un control de calidad para esta orden. Use el endpoint de actualización.'
    )

  // Mover OT a QUALITY_CHECK si estaba en IN_PROGRESS
  if (so.status === 'IN_PROGRESS') {
    await changeServiceOrderStatusWithHistory(db, {
      serviceOrderId: data.serviceOrderId,
      empresaId,
      newStatus: 'QUALITY_CHECK',
      userId,
      comment: 'Control de calidad iniciado',
    })
  }

  return (db as PrismaClient).qualityCheck.create({
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

  // Si aprueba → mover OT a READY; si falla → regresar a IN_PROGRESS
  await changeServiceOrderStatusWithHistory(db, {
    serviceOrderId: item.serviceOrderId,
    empresaId,
    newStatus: targetStatus,
    userId,
    comment: allPassed
      ? 'Control de calidad aprobado'
      : 'Control de calidad rechazado',
  })

  return (db as PrismaClient).qualityCheck.update({
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
}
