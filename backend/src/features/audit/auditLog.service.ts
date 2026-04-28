import { Prisma } from '../../generated/prisma/client.js'
import prisma from '../../services/prisma.service.js'
import { PaginationHelper } from '../../shared/utils/pagination.js'

export interface AuditLogFilters {
  page?: number
  limit?: number
  entity?: string
  entityId?: string
  action?: string
  actions?: string[] | string
  userId?: string
  createdFrom?: Date
  createdTo?: Date
}

function normalizeActions(actions?: string[] | string): string[] {
  if (!actions) return []
  const values = Array.isArray(actions) ? actions : actions.split(',')
  return values
    .map((action) => String(action).trim())
    .filter(Boolean)
}

export async function findAuditLogs(
  empresaId: string,
  filters: AuditLogFilters
) {
  const { page, limit } = PaginationHelper.validateAndParse({
    page: Number(filters.page ?? 1),
    limit: Number(filters.limit ?? 50),
  })

  const where: Prisma.AuditLogWhereInput = { empresaId }

  if (filters.entity) where.entity = filters.entity
  if (filters.entityId) where.entityId = filters.entityId
  const actionList = normalizeActions(filters.actions)
  if (actionList.length > 0) where.action = { in: actionList }
  else if (filters.action) where.action = filters.action
  if (filters.userId) where.userId = filters.userId
  if (filters.createdFrom || filters.createdTo) {
    where.createdAt = {}
    if (filters.createdFrom) where.createdAt.gte = filters.createdFrom
    if (filters.createdTo) where.createdAt.lte = filters.createdTo
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            correo: true,
          },
        },
        empresa: {
          select: {
            id_empresa: true,
            nombre: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return { items, total, page, limit }
}
