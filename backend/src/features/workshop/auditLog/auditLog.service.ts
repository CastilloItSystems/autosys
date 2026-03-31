// backend/src/features/workshop/auditLog/auditLog.service.ts
import type { PrismaClient } from '../../../generated/prisma/client.js'

type Db = PrismaClient | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export interface IAuditLogFilters {
  entityType?: string
  entityId?: string
  action?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export async function findAuditLogs(db: Db, empresaId: string, filters: IAuditLogFilters) {
  const { entityType, entityId, action, userId, dateFrom, dateTo, page = 1, limit = 50 } = filters
  const where: any = { empresaId }
  if (entityType) where.entityType = entityType
  if (entityId) where.entityId = entityId
  if (action) where.action = action
  if (userId) where.userId = userId
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) where.createdAt.lte = new Date(dateTo)
  }
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    (db as PrismaClient).workshopAuditLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    (db as PrismaClient).workshopAuditLog.count({ where }),
  ])
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export async function createAuditLog(
  db: Db,
  empresaId: string,
  params: {
    entityType: string
    entityId: string
    action: string
    previousValue?: object
    newValue?: object
    description?: string
    userId: string
    userIp?: string
  }
) {
  return (db as PrismaClient).workshopAuditLog.create({
    data: {
      entityType: params.entityType as any,
      entityId: params.entityId,
      action: params.action as any,
      previousValue: params.previousValue ?? undefined,
      newValue: params.newValue ?? undefined,
      description: params.description,
      userId: params.userId,
      userIp: params.userIp,
      empresaId,
    },
  })
}
