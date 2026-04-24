import {
  PrismaClient,
  Prisma,
  NotificationPriority,
  NotificationSeverity,
} from '../../generated/prisma/client.js'
import type {
  NotificationDTO,
  NotificationListQuery,
  NotificationListResponse,
  NotificationCompanyPolicyInput,
  NotificationCompanyPolicyDTO,
  NotificationMembershipPreferenceInput,
  NotificationMembershipPreferenceDTO,
  NotificationCreateInput,
} from './notifications.interface.js'
import {
  getNotificationCatalogItem,
  isHardLockedNotification,
  isNotificationCatalogItemHardLocked,
  resolveNotificationEventCode,
} from './notifications.catalog.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

export interface NotificationVisibilityFilter {
  allowedEventCodes?: string[]
  allowedModules?: string[]
}

const VALID_PRIORITIES = new Set<string>(Object.values(NotificationPriority))
const VALID_SEVERITIES = new Set<string>(Object.values(NotificationSeverity))

const normalizeNotificationType = (type?: string): string => {
  if (!type || typeof type !== 'string') return 'info'
  return type.trim().toLowerCase() || 'info'
}

const normalizePriority = (priority?: string): NotificationPriority => {
  if (!priority || typeof priority !== 'string') return NotificationPriority.MEDIUM
  const normalized = priority.trim().toUpperCase()
  return VALID_PRIORITIES.has(normalized)
    ? (normalized as NotificationPriority)
    : NotificationPriority.MEDIUM
}

const normalizeSeverity = (severity?: string): NotificationSeverity => {
  if (!severity || typeof severity !== 'string') return NotificationSeverity.INFO
  const normalized = severity.trim().toUpperCase()
  return VALID_SEVERITIES.has(normalized)
    ? (normalized as NotificationSeverity)
    : NotificationSeverity.INFO
}

const normalizePermissionsArray = (value?: string[]): string[] => {
  if (!Array.isArray(value)) return []
  return Array.from(
    new Set(
      value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
    )
  )
}

const normalizeVisibility = (
  visibility?: NotificationVisibilityFilter
): NotificationVisibilityFilter | null => {
  if (!visibility) return null

  const allowedEventCodes = Array.from(
    new Set(
      (visibility.allowedEventCodes ?? [])
        .map((code) => (typeof code === 'string' ? code.trim() : ''))
        .filter(Boolean)
        .map(resolveNotificationEventCode)
    )
  )

  const allowedModules = Array.from(
    new Set(
      (visibility.allowedModules ?? [])
        .map((moduleCode) =>
          typeof moduleCode === 'string' ? moduleCode.trim() : ''
        )
        .filter(Boolean)
    )
  )

  if (allowedEventCodes.length === 0 && allowedModules.length === 0) {
    return null
  }

  return { allowedEventCodes, allowedModules }
}

const buildVisibilityWhere = (
  visibility: NotificationVisibilityFilter | null
): Prisma.NotificationWhereInput | undefined => {
  if (!visibility) return undefined

  const allowedEventCodes = visibility.allowedEventCodes ?? []
  const allowedModules = visibility.allowedModules ?? []

  const orFilters: Prisma.NotificationWhereInput[] = []

  if (allowedEventCodes.length > 0) {
    orFilters.push({ eventCode: { in: allowedEventCodes } })
  }
  if (allowedModules.length > 0) {
    orFilters.push({ module: { in: allowedModules } })
  }

  if (orFilters.length === 0) return undefined
  return { OR: orFilters }
}

const mapRowToNotification = (row: Record<string, unknown>): NotificationDTO => {
  return {
    id: row.id as string,
    empresaId: row.empresaId as string,
    userId: row.userId as string,
    eventCode: row.eventCode as string,
    module: row.module as string,
    channel: row.channel as string,
    title: row.title as string,
    message: row.message as string,
    type: normalizeNotificationType(row.type as string | undefined),
    entityType: typeof row.entityType === 'string' ? row.entityType : undefined,
    entityId: typeof row.entityId === 'string' ? row.entityId : undefined,
    priority: typeof row.priority === 'string' ? row.priority : 'MEDIUM',
    severity: typeof row.severity === 'string' ? row.severity : 'INFO',
    link: typeof row.link === 'string' ? row.link : undefined,
    source: typeof row.source === 'string' ? row.source : undefined,
    dedupKey: typeof row.dedupKey === 'string' ? row.dedupKey : undefined,
    isMandatory: Boolean(row.isMandatory),
    read: Boolean(row.read),
    createdBy: {
      id:
        typeof row.createdBy === 'string' && row.createdBy
          ? row.createdBy
          : 'SYSTEM',
      nombre:
        typeof row.createdByName === 'string' && row.createdByName
          ? row.createdByName
          : 'Sistema',
    },
    metadata:
      row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : undefined,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  }
}

const mapCompanyPolicy = (row: Record<string, unknown>): NotificationCompanyPolicyDTO => {
  return {
    eventCode: row.eventCode as string,
    enabled: Boolean(row.enabled),
    mandatory: Boolean(row.mandatory),
    requiredPermissionsAny: normalizePermissionsArray(
      row.requiredPermissionsAny as string[] | undefined
    ),
    dedupWindowSec:
      typeof row.dedupWindowSec === 'number' && Number.isFinite(row.dedupWindowSec)
        ? row.dedupWindowSec
        : 300,
    updatedBy: typeof row.updatedBy === 'string' ? row.updatedBy : undefined,
    updatedByName: typeof row.updatedByName === 'string' ? row.updatedByName : undefined,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  }
}

const mapMembershipPreference = (
  row: Record<string, unknown>
): NotificationMembershipPreferenceDTO => {
  return {
    eventCode: row.eventCode as string,
    enabled: Boolean(row.enabled),
    updatedBy: typeof row.updatedBy === 'string' ? row.updatedBy : undefined,
    updatedByName: typeof row.updatedByName === 'string' ? row.updatedByName : undefined,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  }
}

class NotificationService {
  async listForUser(
    userId: string,
    empresaId: string,
    query: NotificationListQuery = {},
    db: PrismaClientType,
    visibility?: NotificationVisibilityFilter
  ): Promise<NotificationListResponse> {
    const client = db as PrismaClient
    const page =
      typeof query.page === 'number' && Number.isFinite(query.page) && query.page > 0
        ? Math.floor(query.page)
        : 1
    const limit =
      typeof query.limit === 'number' && Number.isFinite(query.limit) && query.limit > 0
        ? Math.min(Math.floor(query.limit), 200)
        : 50

    const where: Prisma.NotificationWhereInput = {
      userId,
      empresaId,
      eliminado: false,
    }

    if (typeof query.read === 'boolean') where.read = query.read
    if (typeof query.eventCode === 'string' && query.eventCode.trim()) {
      where.eventCode = resolveNotificationEventCode(query.eventCode.trim())
    }
    if (typeof query.module === 'string' && query.module.trim()) {
      where.module = query.module.trim()
    }
    if (typeof query.severity === 'string' && query.severity.trim()) {
      where.severity = normalizeSeverity(query.severity)
    }

    const normalizedVisibility = normalizeVisibility(visibility)
    const visibilityWhere = buildVisibilityWhere(normalizedVisibility)

    if (visibilityWhere) {
      where.AND = [...(Array.isArray(where.AND) ? where.AND : []), visibilityWhere]
    }

    const [total, rows] = await Promise.all([
      client.notification.count({ where }),
      client.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return {
      items: rows.map((r) => mapRowToNotification(r as unknown as Record<string, unknown>)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    }
  }

  async markAsRead(
    id: string,
    userId: string,
    empresaId: string,
    db: PrismaClientType,
    visibility?: NotificationVisibilityFilter
  ): Promise<NotificationDTO | null> {
    const client = db as PrismaClient
    const normalizedVisibility = normalizeVisibility(visibility)

    const where: Prisma.NotificationWhereInput = {
      id,
      userId,
      empresaId,
      eliminado: false,
    }

    const visibilityWhere = buildVisibilityWhere(normalizedVisibility)
    if (visibilityWhere) {
      where.AND = [visibilityWhere]
    }

    const existing = await client.notification.findFirst({ where })
    if (!existing) return null

    const row = await client.notification.update({
      where: { id, userId, empresaId },
      data: { read: true, readBy: userId, readAt: new Date() },
    })

    return mapRowToNotification(row as unknown as Record<string, unknown>)
  }

  async markAllAsRead(
    userId: string,
    empresaId: string,
    db: PrismaClientType,
    visibility?: NotificationVisibilityFilter
  ): Promise<{ updated: number }> {
    const client = db as PrismaClient
    const normalizedVisibility = normalizeVisibility(visibility)

    const where: Prisma.NotificationWhereInput = {
      userId,
      empresaId,
      eliminado: false,
      read: false,
    }

    const visibilityWhere = buildVisibilityWhere(normalizedVisibility)
    if (visibilityWhere) {
      where.AND = [visibilityWhere]
    }

    const result = await client.notification.updateMany({
      where,
      data: { read: true, readBy: userId, readAt: new Date() },
    })
    return { updated: result.count }
  }

  async create(input: NotificationCreateInput, db: PrismaClientType): Promise<NotificationDTO> {
    const client = db as PrismaClient
    const eventCode = resolveNotificationEventCode(input.eventCode)
    const row = await client.notification.create({
      data: {
        empresaId: input.empresaId,
        userId: input.userId,
        eventCode,
        module: input.module,
        channel: 'IN_APP',
        title: input.title,
        message: input.message,
        type: normalizeNotificationType(input.type),
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        priority: normalizePriority(input.priority),
        severity: normalizeSeverity(input.severity),
        link: input.link ?? null,
        source: input.source ?? null,
        dedupKey: input.dedupKey ?? null,
        isMandatory: Boolean(input.isMandatory),
        read: false,
        eliminado: false,
        createdBy: input.createdById ?? 'SYSTEM',
        createdByName: input.createdByName ?? 'Sistema',
        metadata: (input.metadata ?? null) as Prisma.InputJsonValue | null,
      },
    })

    return mapRowToNotification(row as unknown as Record<string, unknown>)
  }

  async findRecentByDedup(
    params: {
      empresaId: string
      userId: string
      eventCode: string
      dedupKey: string
      since: Date
    },
    db: PrismaClientType
  ): Promise<NotificationDTO | null> {
    const client = db as PrismaClient
    const row = await client.notification.findFirst({
      where: {
        empresaId: params.empresaId,
        userId: params.userId,
        eventCode: resolveNotificationEventCode(params.eventCode),
        dedupKey: params.dedupKey,
        eliminado: false,
        createdAt: { gte: params.since },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!row) return null
    return mapRowToNotification(row as unknown as Record<string, unknown>)
  }

  async getCompanyPolicyByEventCode(
    empresaId: string,
    eventCode: string,
    db: PrismaClientType
  ) {
    const client = db as PrismaClient
    return client.notificationCompanyPolicy.findUnique({
      where: {
        empresaId_eventCode: {
          empresaId,
          eventCode: resolveNotificationEventCode(eventCode),
        },
      },
    })
  }

  async getCompanyPolicies(
    empresaId: string,
    db: PrismaClientType
  ): Promise<NotificationCompanyPolicyDTO[]> {
    const client = db as PrismaClient
    const rows = await client.notificationCompanyPolicy.findMany({
      where: { empresaId },
      orderBy: { eventCode: 'asc' },
    })
    return rows.map((r) => mapCompanyPolicy(r as unknown as Record<string, unknown>))
  }

  async upsertCompanyPolicies(
    params: {
      empresaId: string
      actorUserId: string
      actorName?: string
      policies: NotificationCompanyPolicyInput[]
    },
    db: PrismaClientType
  ): Promise<NotificationCompanyPolicyDTO[]> {
    const client = db as PrismaClient
    const normalized = params.policies
      .map((policy) => {
        const eventCode = resolveNotificationEventCode(
          typeof policy.eventCode === 'string' ? policy.eventCode.trim() : ''
        )
        const catalogItem = getNotificationCatalogItem(eventCode)
        const hardLocked =
          (catalogItem && isNotificationCatalogItemHardLocked(catalogItem)) ||
          false

        return {
          eventCode,
          enabled:
            hardLocked || typeof policy.enabled !== 'boolean'
              ? true
              : policy.enabled,
          mandatory:
            hardLocked || typeof policy.mandatory !== 'boolean'
              ? Boolean(catalogItem?.defaultMandatory)
              : policy.mandatory,
          requiredPermissionsAny: normalizePermissionsArray(policy.requiredPermissionsAny),
          dedupWindowSec:
            typeof policy.dedupWindowSec === 'number' &&
            Number.isFinite(policy.dedupWindowSec)
              ? Math.max(0, Math.floor(policy.dedupWindowSec))
              : (catalogItem?.defaultDedupWindowSec ?? 300),
        }
      })
      .filter((policy) => Boolean(policy.eventCode))

    if (normalized.length === 0) return this.getCompanyPolicies(params.empresaId, db)

    await client.$transaction(
      normalized.map((policy) =>
        client.notificationCompanyPolicy.upsert({
          where: {
            empresaId_eventCode: {
              empresaId: params.empresaId,
              eventCode: policy.eventCode,
            },
          },
          create: {
            empresa: { connect: { id_empresa: params.empresaId } },
            eventCode: policy.eventCode,
            enabled: policy.enabled,
            mandatory: policy.mandatory,
            requiredPermissionsAny: policy.requiredPermissionsAny,
            dedupWindowSec: policy.dedupWindowSec,
            updatedBy: params.actorUserId,
            updatedByName: params.actorName ?? 'Sistema',
          },
          update: {
            enabled: policy.enabled,
            mandatory: policy.mandatory,
            requiredPermissionsAny: policy.requiredPermissionsAny,
            dedupWindowSec: policy.dedupWindowSec,
            updatedBy: params.actorUserId,
            updatedByName: params.actorName ?? 'Sistema',
          },
        })
      )
    )

    return this.getCompanyPolicies(params.empresaId, db)
  }

  async getMembershipByUserAndEmpresa(
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ) {
    const client = db as PrismaClient
    return client.membership.findUnique({
      where: { userId_empresaId: { userId, empresaId } },
      select: { id: true, status: true },
    })
  }

  async getActiveMembershipWithPermissions(
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ) {
    const client = db as PrismaClient
    return client.membership.findFirst({
      where: {
        userId,
        empresaId,
        status: 'active',
      },
      include: {
        role: {
          include: {
            permissions: { include: { permission: { select: { code: true } } } },
          },
        },
        permissions: { include: { permission: { select: { code: true } } } },
      },
    })
  }

  async getMembershipPreferences(
    membershipId: string,
    db: PrismaClientType,
    filter?: { eventCodes?: string[] }
  ): Promise<NotificationMembershipPreferenceDTO[]> {
    const client = db as PrismaClient
    const eventCodes = (filter?.eventCodes ?? []).map((code) =>
      resolveNotificationEventCode(code)
    )

    const where: Prisma.NotificationMembershipPreferenceWhereInput = { membershipId }
    if (eventCodes.length > 0) {
      where.eventCode = { in: eventCodes }
    }

    const rows = await client.notificationMembershipPreference.findMany({
      where,
      orderBy: { eventCode: 'asc' },
    })
    return rows.map((r) => mapMembershipPreference(r as unknown as Record<string, unknown>))
  }

  async upsertMembershipPreferences(
    params: {
      membershipId: string
      actorUserId: string
      actorName?: string
      preferences: NotificationMembershipPreferenceInput[]
    },
    db: PrismaClientType
  ): Promise<NotificationMembershipPreferenceDTO[]> {
    const client = db as PrismaClient
    const normalized = params.preferences
      .map((item) => {
        const eventCode = resolveNotificationEventCode(
          typeof item.eventCode === 'string' ? item.eventCode.trim() : ''
        )
        const catalogItem = getNotificationCatalogItem(eventCode)
        const hardLocked =
          (catalogItem && isNotificationCatalogItemHardLocked(catalogItem)) ||
          isHardLockedNotification(catalogItem?.defaultSeverity, catalogItem?.defaultPriority)

        return {
          eventCode,
          enabled: hardLocked ? true : Boolean(item.enabled),
        }
      })
      .filter((item) => Boolean(item.eventCode))

    if (normalized.length === 0) {
      return this.getMembershipPreferences(params.membershipId, db)
    }

    await client.$transaction(
      normalized.map((item) =>
        client.notificationMembershipPreference.upsert({
          where: {
            membershipId_eventCode: {
              membershipId: params.membershipId,
              eventCode: item.eventCode,
            },
          },
          create: {
            membershipId: params.membershipId,
            eventCode: item.eventCode,
            enabled: item.enabled,
            updatedBy: params.actorUserId,
            updatedByName: params.actorName ?? 'Sistema',
          },
          update: {
            enabled: item.enabled,
            updatedBy: params.actorUserId,
            updatedByName: params.actorName ?? 'Sistema',
          },
        })
      )
    )

    return this.getMembershipPreferences(params.membershipId, db)
  }
}

export default new NotificationService()
