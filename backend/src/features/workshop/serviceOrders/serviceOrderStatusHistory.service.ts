import type { PrismaClient } from '../../../generated/prisma/client.js'
import { NotFoundError } from '../../../shared/utils/apiError.js'
import type { ServiceOrderStatus } from './serviceOrders.interface.js'

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

  return prisma.$transaction(async (tx) => {
    const existing = await tx.serviceOrder.findFirst({
      where: { id: serviceOrderId, empresaId },
      select: { id: true, status: true },
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

    return updated
  })
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
