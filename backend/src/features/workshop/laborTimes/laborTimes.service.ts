// backend/src/features/workshop/laborTimes/laborTimes.service.ts
import type { PrismaClient } from '../../../generated/prisma/client.js'
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '../../../shared/utils/apiError.js'
import type {
  ILaborTimeFilters,
  IStartLaborTimeInput,
} from './laborTimes.interface.js'

type Db =
  | PrismaClient
  | Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >

const INCLUDE = {
  operation: {
    select: { id: true, code: true, name: true, standardMinutes: true },
  },
  pauses: { orderBy: { startedAt: 'asc' } },
} as const

// Calcula minutos reales descontando pausas
function calcRealMinutes(
  startedAt: Date,
  finishedAt: Date,
  pausedMinutes: number
): number {
  const totalMs = finishedAt.getTime() - startedAt.getTime()
  const totalMinutes = Math.round(totalMs / 60000)
  return Math.max(0, totalMinutes - pausedMinutes)
}

export async function findAllLaborTimes(
  db: Db,
  empresaId: string,
  filters: ILaborTimeFilters
) {
  const {
    serviceOrderId,
    technicianId,
    status,
    dateFrom,
    dateTo,
    page = 1,
    limit = 50,
  } = filters

  // Verificar acceso via empresaId → serviceOrder
  const where: any = { serviceOrder: { empresaId } }
  if (serviceOrderId) where.serviceOrderId = serviceOrderId
  if (technicianId) where.technicianId = technicianId
  if (status) where.status = status
  if (dateFrom || dateTo) {
    where.startedAt = {}
    if (dateFrom) where.startedAt.gte = new Date(dateFrom)
    if (dateTo) where.startedAt.lte = new Date(dateTo)
  }

  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    (db as PrismaClient).laborTime.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startedAt: 'desc' },
      include: INCLUDE,
    }),
    (db as PrismaClient).laborTime.count({ where }),
  ])
  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export async function findLaborTimeById(db: Db, id: string, empresaId: string) {
  const item = await (db as PrismaClient).laborTime.findFirst({
    where: { id, serviceOrder: { empresaId } },
    include: INCLUDE,
  })
  if (!item) throw new NotFoundError('Registro de tiempo no encontrado')
  return item
}

export async function startLaborTime(
  db: Db,
  empresaId: string,
  userId: string,
  data: IStartLaborTimeInput
) {
  // Verificar que la OT existe y pertenece a la empresa
  const so = await (db as PrismaClient).serviceOrder.findFirst({
    where: { id: data.serviceOrderId, empresaId },
    select: { id: true, status: true },
  })
  if (!so) throw new NotFoundError('Orden de trabajo no encontrada')
  if (['CLOSED', 'CANCELLED', 'DELIVERED', 'INVOICED'].includes(so.status)) {
    throw new BadRequestError(
      'No se puede iniciar tiempo en una orden cerrada, cancelada o facturada'
    )
  }

  // Regla: técnico no puede tener dos registros ACTIVE simultáneamente
  const activeForTech = await (db as PrismaClient).laborTime.findFirst({
    where: { technicianId: data.technicianId, status: 'ACTIVE' },
  })
  if (activeForTech) {
    throw new ConflictError(
      'El técnico ya tiene un trabajo activo en curso. Debe pausarlo o finalizarlo primero.'
    )
  }

  // Obtener tiempo estándar de la operación si se proporcionó
  let standardMinutes: number | null = null
  if (data.operationId) {
    const op = await (db as PrismaClient).workshopOperation.findFirst({
      where: { id: data.operationId, empresaId },
      select: { standardMinutes: true },
    })
    if (!op) throw new NotFoundError('Operación no encontrada')
    standardMinutes = op.standardMinutes ?? null
  }

  return (db as PrismaClient).laborTime.create({
    data: {
      serviceOrderId: data.serviceOrderId,
      serviceOrderItemId: data.serviceOrderItemId ?? null,
      operationId: data.operationId ?? null,
      technicianId: data.technicianId,
      startedAt: new Date(),
      standardMinutes,
      status: 'ACTIVE',
      notes: data.notes ?? null,
      createdBy: userId,
    },
    include: INCLUDE,
  })
}

export async function pauseLaborTime(
  db: Db,
  id: string,
  empresaId: string,
  reason?: string
) {
  const item = await findLaborTimeById(db, id, empresaId)
  if (item.status !== 'ACTIVE')
    throw new BadRequestError('Solo se puede pausar un registro activo')

  return (db as PrismaClient).$transaction(async (tx) => {
    const pausedAt = new Date()

    // Create pause record
    await tx.laborTimePause.create({
      data: {
        laborTimeId: id,
        startedAt: pausedAt,
        reason: reason ?? null,
        empresaId,
      },
    })

    return tx.laborTime.update({
      where: { id },
      data: { status: 'PAUSED', pausedAt },
      include: INCLUDE,
    })
  })
}

export async function resumeLaborTime(
  db: Db,
  id: string,
  empresaId: string,
  userId: string
) {
  const item = await findLaborTimeById(db, id, empresaId)
  if (item.status !== 'PAUSED')
    throw new BadRequestError('Solo se puede reanudar un registro pausado')

  // Verificar que el técnico no tenga otro ACTIVE
  const activeForTech = await (db as PrismaClient).laborTime.findFirst({
    where: { technicianId: item.technicianId, status: 'ACTIVE', NOT: { id } },
  })
  if (activeForTech)
    throw new ConflictError('El técnico ya tiene otro trabajo activo en curso')

  return (db as PrismaClient).$transaction(async (tx) => {
    const resumedAt = new Date()
    let durationMinutes = 0

    // Find the latest open pause record
    const openPause = await tx.laborTimePause.findFirst({
      where: { laborTimeId: id, endedAt: null },
      orderBy: { startedAt: 'desc' },
    })

    if (openPause) {
      durationMinutes = Math.round(
        (resumedAt.getTime() - openPause.startedAt.getTime()) / 60000
      )
      await tx.laborTimePause.update({
        where: { id: openPause.id },
        data: {
          endedAt: resumedAt,
          durationMinutes,
        },
      })
    }

    return tx.laborTime.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        pausedAt: null,
        pausedMinutes: item.pausedMinutes + durationMinutes,
      },
      include: INCLUDE,
    })
  })
}

export async function finishLaborTime(
  db: Db,
  id: string,
  empresaId: string,
  notes?: string
) {
  const item = await findLaborTimeById(db, id, empresaId)
  if (!['ACTIVE', 'PAUSED'].includes(item.status)) {
    throw new BadRequestError(
      'Solo se puede finalizar un registro activo o pausado'
    )
  }

  return (db as PrismaClient).$transaction(async (tx) => {
    const finishedAt = new Date()
    let pausedMinutes = item.pausedMinutes

    // If it was paused, close the pending pause record
    if (item.status === 'PAUSED') {
      const openPause = await tx.laborTimePause.findFirst({
        where: { laborTimeId: id, endedAt: null },
        orderBy: { startedAt: 'desc' },
      })

      if (openPause) {
        const durationMinutes = Math.round(
          (finishedAt.getTime() - openPause.startedAt.getTime()) / 60000
        )
        pausedMinutes += durationMinutes
        await tx.laborTimePause.update({
          where: { id: openPause.id },
          data: {
            endedAt: finishedAt,
            durationMinutes,
          },
        })
      }
    }

    const realMinutes = calcRealMinutes(
      item.startedAt,
      finishedAt,
      pausedMinutes
    )

    return tx.laborTime.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        finishedAt,
        pausedMinutes,
        realMinutes,
        pausedAt: null,
        ...(notes ? { notes } : {}),
      },
      include: INCLUDE,
    })
  })
}

export async function cancelLaborTime(db: Db, id: string, empresaId: string) {
  const item = await findLaborTimeById(db, id, empresaId)
  if (item.status === 'COMPLETED')
    throw new BadRequestError('No se puede cancelar un registro completado')
  return (db as PrismaClient).laborTime.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: INCLUDE,
  })
}
