// backend/src/features/workshop/qualityChecks/qualityChecks.service.ts
import type { PrismaClient } from '../../../generated/prisma/client.js'
import { NotFoundError, BadRequestError, ConflictError } from '../../../shared/utils/apiError.js'
import type { ICreateQualityCheckInput, ISubmitQualityCheckInput } from './qualityChecks.interface.js'

type Db = PrismaClient | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

const INCLUDE = {
  serviceOrder: { select: { id: true, folio: true, status: true, vehiclePlate: true } },
} as const

export async function findAllQualityChecks(db: Db, empresaId: string, filters: any = {}) {
  const { page = 1, limit = 20 } = filters ?? {}
  const where = { serviceOrder: { empresaId } }
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    (db as PrismaClient).qualityCheck.findMany({ where, skip, take: limit, include: INCLUDE }),
    (db as PrismaClient).qualityCheck.count({ where }),
  ])
  return { data, page, limit, total }
}

export async function findQualityCheckBySOId(db: Db, serviceOrderId: string, empresaId: string) {
  const item = await (db as PrismaClient).qualityCheck.findFirst({
    where: { serviceOrderId, serviceOrder: { empresaId } },
    include: INCLUDE,
  })
  if (!item) throw new NotFoundError('Control de calidad no encontrado para esta orden')
  return item
}

export async function findQualityCheckById(db: Db, id: string, empresaId: string) {
  const item = await (db as PrismaClient).qualityCheck.findFirst({
    where: { id, serviceOrder: { empresaId } },
    include: INCLUDE,
  })
  if (!item) throw new NotFoundError('Control de calidad no encontrado')
  return item
}

export async function createQualityCheck(db: Db, empresaId: string, userId: string, data: ICreateQualityCheckInput) {
  // Verificar que la OT existe y pertenece a la empresa
  const so = await (db as PrismaClient).serviceOrder.findFirst({
    where: { id: data.serviceOrderId, empresaId },
    select: { id: true, status: true },
  })
  if (!so) throw new NotFoundError('Orden de trabajo no encontrada')
  if (!['IN_PROGRESS', 'QUALITY_CHECK'].includes(so.status)) {
    throw new BadRequestError('El control de calidad solo se puede crear cuando la OT está en IN_PROGRESS o QUALITY_CHECK')
  }

  // Verificar que no exista ya uno (1:1)
  const existing = await (db as PrismaClient).qualityCheck.findFirst({ where: { serviceOrderId: data.serviceOrderId } })
  if (existing) throw new ConflictError('Ya existe un control de calidad para esta orden. Use el endpoint de actualización.')

  // Mover OT a QUALITY_CHECK si estaba en IN_PROGRESS
  if (so.status === 'IN_PROGRESS') {
    await (db as PrismaClient).serviceOrder.update({ where: { id: data.serviceOrderId }, data: { status: 'QUALITY_CHECK' } })
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

export async function submitQualityCheck(db: Db, id: string, empresaId: string, data: ISubmitQualityCheckInput) {
  const item = await findQualityCheckById(db, id, empresaId)
  if (item.status === 'PASSED') throw new BadRequestError('Este control de calidad ya fue aprobado')
  if (item.status === 'FAILED' && item.retryCount >= 3) {
    throw new BadRequestError('Se alcanzó el máximo de reintentos. Escale con el jefe de taller.')
  }

  const allPassed = data.checklistItems.every(i => i.passed)
  const newStatus = allPassed ? 'PASSED' : 'FAILED'

  // Si aprueba → mover OT a READY; si falla → regresar a IN_PROGRESS
  await (db as PrismaClient).serviceOrder.update({
    where: { id: item.serviceOrderId },
    data: { status: allPassed ? 'READY' : 'IN_PROGRESS' },
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
