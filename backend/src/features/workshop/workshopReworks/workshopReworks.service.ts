// backend/src/features/workshop/workshopReworks/workshopReworks.service.ts
import type { PrismaClient } from '../../../generated/prisma/client.js'
import { NotFoundError, BadRequestError } from '../../../shared/utils/apiError.js'

type Db = PrismaClient | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

type ReworkStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

const REWORK_STATUS_TRANSITIONS: Record<ReworkStatus, ReworkStatus[]> = {
  OPEN: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
}

const BASE_INCLUDE = {
  originalOrder: { select: { id: true, folio: true, status: true } },
  reworkOrder:   { select: { id: true, folio: true, status: true } },
} as const

export interface IReworkFilters {
  status?: ReworkStatus
  technicianId?: string
  originalOrderId?: string
  page?: number
  limit?: number
}

export interface ICreateReworkInput {
  originalOrderId: string
  motive: string
  rootCause?: string
  technicianId?: string
  estimatedCost?: number
  notes?: string
  createdBy: string
}

export interface IUpdateReworkInput {
  rootCause?: string
  technicianId?: string
  estimatedCost?: number
  realCost?: number
  notes?: string
  reworkOrderId?: string
}

export async function findAllReworks(db: Db, empresaId: string, filters: IReworkFilters) {
  const { status, technicianId, originalOrderId, page = 1, limit = 20 } = filters
  const where: any = { empresaId }
  if (status) where.status = status
  if (technicianId) where.technicianId = technicianId
  if (originalOrderId) where.originalOrderId = originalOrderId
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    (db as PrismaClient).workshopRework.findMany({ where, include: BASE_INCLUDE, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    (db as PrismaClient).workshopRework.count({ where }),
  ])
  return { data, page, limit, total }
}

export async function findReworkById(db: Db, id: string, empresaId: string) {
  const item = await (db as PrismaClient).workshopRework.findFirst({ where: { id, empresaId }, include: BASE_INCLUDE })
  if (!item) throw new NotFoundError('Retrabajo no encontrado')
  return item
}

export async function createRework(db: Db, empresaId: string, data: ICreateReworkInput) {
  const order = await (db as PrismaClient).serviceOrder.findFirst({ where: { id: data.originalOrderId, empresaId } })
  if (!order) throw new NotFoundError('Orden de trabajo no encontrada')
  return (db as PrismaClient).workshopRework.create({
    data: {
      originalOrderId: data.originalOrderId,
      motive: data.motive,
      rootCause: data.rootCause,
      technicianId: data.technicianId,
      estimatedCost: data.estimatedCost ?? 0,
      notes: data.notes,
      createdBy: data.createdBy,
      empresaId,
    },
    include: BASE_INCLUDE,
  })
}

export async function updateRework(db: Db, id: string, empresaId: string, data: IUpdateReworkInput) {
  await findReworkById(db, id, empresaId)
  if (data.reworkOrderId) {
    const reworkOrder = await (db as PrismaClient).serviceOrder.findFirst({ where: { id: data.reworkOrderId, empresaId } })
    if (!reworkOrder) throw new NotFoundError('Orden de retrabajo no encontrada')
  }
  return (db as PrismaClient).workshopRework.update({ where: { id }, data, include: BASE_INCLUDE })
}

export async function changeReworkStatus(db: Db, id: string, empresaId: string, newStatus: ReworkStatus) {
  const item = await findReworkById(db, id, empresaId)
  const allowed = REWORK_STATUS_TRANSITIONS[item.status as ReworkStatus] ?? []
  if (!allowed.includes(newStatus)) {
    throw new BadRequestError(`No se puede cambiar de estado ${item.status} a ${newStatus}`)
  }
  const updateData: any = { status: newStatus }
  if (newStatus === 'RESOLVED') updateData.resolvedAt = new Date()
  return (db as PrismaClient).workshopRework.update({ where: { id }, data: updateData, include: BASE_INCLUDE })
}
