import {
  PrismaClient,
  Prisma,
  NotificationPriority,
  NotificationSeverity,
} from '../../generated/prisma/client.js'
import notificationService from './notifications.service.js'
import {
  getModuleNotificationPermission,
  getNotificationCatalogItem,
  getNotificationEventAliases,
  isHardLockedNotification,
  resolveModuleFromEventCode,
  resolveNotificationEventCode,
  type NotificationCatalogItem,
} from './notifications.catalog.js'
import { getActiveMembershipsWithPermissions } from './memberships-permissions.cache.js'
import { emitNotificationToUser } from '../../socket/index.js'
import { logger } from '../../shared/utils/logger.js'

const VALID_PRIORITIES = new Set<string>(Object.values(NotificationPriority))
const VALID_SEVERITIES = new Set<string>(Object.values(NotificationSeverity))

const normalizePriorityEnum = (value: string): NotificationPriority => {
  const normalized = value.trim().toUpperCase()
  return VALID_PRIORITIES.has(normalized)
    ? (normalized as NotificationPriority)
    : NotificationPriority.MEDIUM
}

const normalizeSeverityEnum = (value: string): NotificationSeverity => {
  const normalized = value.trim().toUpperCase()
  return VALID_SEVERITIES.has(normalized)
    ? (normalized as NotificationSeverity)
    : NotificationSeverity.INFO
}

const normalizeType = (type?: string): string => {
  if (!type || typeof type !== 'string') return 'info'
  return type.trim().toLowerCase() || 'info'
}

type PrismaClientType = PrismaClient | Prisma.TransactionClient

export interface NotificationEventInput {
  empresaId: string
  eventCode: string
  title?: string
  message?: string
  type?: string
  module?: string
  entityType?: string
  entityId?: string
  priority?: string
  severity?: string
  link?: string
  source?: string
  dedupKey?: string
  metadata?: Record<string, unknown>
  createdById?: string
  createdByName?: string
}

interface EffectiveCompanyPolicy {
  enabled: boolean
  mandatory: boolean
  dedupWindowSec: number
  requiredPermissionsAny: string[]
}

const toUpper = (value?: string): string => {
  if (!value || typeof value !== 'string') return ''
  return value.trim().toUpperCase()
}

const normalizeStringArray = (values: unknown): string[] => {
  if (!Array.isArray(values)) return []
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean)
    )
  )
}

class NotificationOrchestratorService {
  private mergePolicy(
    catalog: NotificationCatalogItem | undefined,
    dbPolicy: Record<string, unknown> | null
  ): EffectiveCompanyPolicy {
    return {
      enabled:
        typeof dbPolicy?.enabled === 'boolean'
          ? dbPolicy.enabled
          : (catalog?.defaultEnabled ?? true),
      mandatory:
        typeof dbPolicy?.mandatory === 'boolean'
          ? dbPolicy.mandatory
          : (catalog?.defaultMandatory ?? false),
      dedupWindowSec:
        typeof dbPolicy?.dedupWindowSec === 'number' &&
        Number.isFinite(dbPolicy.dedupWindowSec)
          ? Math.max(0, Math.floor(dbPolicy.dedupWindowSec))
          : (catalog?.defaultDedupWindowSec ?? 300),
      requiredPermissionsAny:
        normalizeStringArray(dbPolicy?.requiredPermissionsAny).length > 0
          ? normalizeStringArray(dbPolicy?.requiredPermissionsAny)
          : (catalog?.requiredPermissionsAny ?? []),
    }
  }

  private buildDedupKey(eventCode: string, input: NotificationEventInput): string {
    if (typeof input.dedupKey === 'string' && input.dedupKey.trim()) {
      return input.dedupKey.trim()
    }

    const entityType =
      typeof input.entityType === 'string' && input.entityType.trim()
        ? input.entityType.trim().toUpperCase()
        : 'NA'
    const entityId =
      typeof input.entityId === 'string' && input.entityId.trim()
        ? input.entityId.trim()
        : 'NA'

    return `${eventCode}:${entityType}:${entityId}`
  }

  async emitEvent(
    input: NotificationEventInput,
    db: PrismaClientType
  ): Promise<{
    createdCount: number
    recipients: number
    skippedByPolicy: number
    skippedByPreference: number
    skippedByDedup: number
  }> {
    const client = db as PrismaClient
    const eventCode = resolveNotificationEventCode(input.eventCode)
    const catalogItem = getNotificationCatalogItem(eventCode)
    const module =
      typeof input.module === 'string' && input.module.trim()
        ? input.module.trim()
        : resolveModuleFromEventCode(eventCode)
    const modulePermission = getModuleNotificationPermission(module)

    const policyRow = await notificationService.getCompanyPolicyByEventCode(
      input.empresaId,
      eventCode,
      db
    )

    const effectivePolicy = this.mergePolicy(
      catalogItem,
      policyRow as unknown as Record<string, unknown> | null
    )

    const severity = toUpper(input.severity || catalogItem?.defaultSeverity || 'INFO')
    const priority = toUpper(input.priority || catalogItem?.defaultPriority || 'MEDIUM')
    const hardLocked = isHardLockedNotification(severity, priority)

    if (hardLocked) {
      effectivePolicy.enabled = true
      effectivePolicy.mandatory = true
    }

    if (!effectivePolicy.enabled) {
      return {
        createdCount: 0,
        recipients: 0,
        skippedByPolicy: 0,
        skippedByPreference: 0,
        skippedByDedup: 0,
      }
    }

    const memberships = await getActiveMembershipsWithPermissions(
      input.empresaId,
      db
    )

    if (memberships.length === 0) {
      return {
        createdCount: 0,
        recipients: 0,
        skippedByPolicy: 0,
        skippedByPreference: 0,
        skippedByDedup: 0,
      }
    }

    const membershipIds = memberships.map((m) => m.membershipId)
    const canonicalAndAliases = [eventCode, ...getNotificationEventAliases(eventCode)]

    const preferences = await client.notificationMembershipPreference.findMany({
      where: {
        membershipId: { in: membershipIds },
        eventCode: { in: canonicalAndAliases },
      },
      select: { membershipId: true, eventCode: true, enabled: true },
      orderBy: { updatedAt: 'desc' },
    })

    const preferenceMap = new Map<string, boolean>()
    for (const preference of preferences) {
      if (preference.eventCode === eventCode) {
        preferenceMap.set(preference.membershipId, preference.enabled)
        continue
      }
      if (!preferenceMap.has(preference.membershipId)) {
        preferenceMap.set(preference.membershipId, preference.enabled)
      }
    }

    const dedupKey = this.buildDedupKey(eventCode, input)
    let recentlyNotifiedUserIds = new Set<string>()

    if (effectivePolicy.dedupWindowSec > 0 && dedupKey) {
      const since = new Date(Date.now() - effectivePolicy.dedupWindowSec * 1000)
      const recentRows = await client.notification.findMany({
        where: {
          empresaId: input.empresaId,
          eventCode: { in: canonicalAndAliases },
          dedupKey,
          eliminado: false,
          createdAt: { gte: since },
          userId: { in: memberships.map((m) => m.userId) },
        },
        select: { userId: true },
      })
      recentlyNotifiedUserIds = new Set(recentRows.map((row) => row.userId))
    }

    let skippedByPolicy = 0
    let skippedByPreference = 0
    let skippedByDedup = 0

    const mandatory = effectivePolicy.mandatory || hardLocked
    const recipientsToCreate: { userId: string }[] = []
    const seenUserIds = new Set<string>()

    for (const membership of memberships) {
      const effectivePermissions = membership.permissions

      if (!effectivePermissions.has('notifications.view')) {
        skippedByPolicy += 1
        continue
      }

      if (modulePermission && !effectivePermissions.has(modulePermission)) {
        skippedByPolicy += 1
        continue
      }

      if (
        effectivePolicy.requiredPermissionsAny.length > 0 &&
        !effectivePolicy.requiredPermissionsAny.some((p) =>
          effectivePermissions.has(p)
        )
      ) {
        skippedByPolicy += 1
        continue
      }

      const preferenceEnabled = preferenceMap.get(membership.membershipId)

      if (!mandatory && preferenceEnabled === false) {
        skippedByPreference += 1
        continue
      }

      if (recentlyNotifiedUserIds.has(membership.userId)) {
        skippedByDedup += 1
        continue
      }

      if (seenUserIds.has(membership.userId)) continue
      seenUserIds.add(membership.userId)
      recipientsToCreate.push({ userId: membership.userId })
    }

    let createdCount = 0
    let recipients = 0

    if (recipientsToCreate.length > 0) {
      const baseData = {
        empresaId: input.empresaId,
        eventCode,
        module,
        channel: 'IN_APP' as const,
        title: input.title || catalogItem?.title || eventCode,
        message:
          input.message ||
          catalogItem?.description ||
          `Evento ${eventCode} registrado`,
        type: normalizeType(input.type),
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        priority: normalizePriorityEnum(priority || catalogItem?.defaultPriority || 'MEDIUM'),
        severity: normalizeSeverityEnum(severity),
        link: input.link ?? null,
        source: input.source ?? null,
        dedupKey: dedupKey || null,
        isMandatory: mandatory,
        read: false,
        eliminado: false,
        createdBy: input.createdById ?? 'SYSTEM',
        createdByName: input.createdByName ?? 'Sistema',
        metadata: (input.metadata ?? null) as Prisma.InputJsonValue | null,
      }

      const rows = await client.notification.createManyAndReturn({
        data: recipientsToCreate.map((r) => ({ ...baseData, userId: r.userId })),
      })

      recipients = rows.length
      createdCount = rows.length

      for (const row of rows) {
        emitNotificationToUser(row.userId, {
          id: row.id,
          empresaId: row.empresaId,
          module: row.module,
          title: row.title,
          message: row.message,
          type: row.type,
          entityType: row.entityType ?? undefined,
          entityId: row.entityId ?? undefined,
          eventCode: row.eventCode,
          priority: row.priority,
          severity: row.severity,
          link: row.link ?? undefined,
          read: row.read,
          metadata:
            row.metadata && typeof row.metadata === 'object'
              ? (row.metadata as Record<string, unknown>)
              : undefined,
          createdAt: row.createdAt,
        })
      }
    }

    logger.debug('NotificationOrchestrator emitEvent', {
      empresaId: input.empresaId,
      eventCode,
      createdCount,
      recipients,
      skippedByPolicy,
      skippedByPreference,
      skippedByDedup,
    })

    return {
      createdCount,
      recipients,
      skippedByPolicy,
      skippedByPreference,
      skippedByDedup,
    }
  }
}

export default new NotificationOrchestratorService()
