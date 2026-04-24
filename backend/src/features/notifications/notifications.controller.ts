import { Request, Response } from 'express'
import notificationService from './notifications.service.js'
import {
  getNotificationCatalog,
  getNotificationEventAliases,
  getVisibleNotificationCatalogByPermissions,
  isNotificationCatalogItemHardLocked,
  resolveNotificationEventCode,
} from './notifications.catalog.js'
import {
  ListNotificationsQueryDTO,
  UpsertCompanyPoliciesDTO,
  UpsertPreferencesDTO,
} from './notifications.dto.js'
import { ApiResponse } from '../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../shared/middleware/asyncHandler.middleware.js'
import { ForbiddenError, NotFoundError } from '../../shared/utils/apiError.js'
import { resolveMembershipPermissions } from '../../shared/utils/resolvePermissions.js'

const getActorName = async (req: Request): Promise<string | undefined> => {
  const actor = await (req.prisma as any).user.findUnique({
    where: { id: req.user!.userId },
    select: { nombre: true },
  })
  if (typeof actor?.nombre === 'string' && actor.nombre.trim()) {
    return actor.nombre.trim()
  }
  return undefined
}

const resolveAccessContext = async (req: Request): Promise<{
  membershipId: string
  effectivePermissions: Set<string>
  visibleCatalog: ReturnType<typeof getVisibleNotificationCatalogByPermissions>
  allowedEventCodes: string[]
  allowedModules: string[]
}> => {
  const membership = await notificationService.getActiveMembershipWithPermissions(
    req.user!.userId,
    req.empresaId,
    req.prisma
  )

  if (!membership) {
    throw new ForbiddenError('Membresía de empresa no activa')
  }

  const effectivePermissions = new Set(
    resolveMembershipPermissions(
      membership.role.permissions,
      membership.permissions
    )
  )

  const visibleCatalog = getVisibleNotificationCatalogByPermissions(
    effectivePermissions
  )

  const allowedEventCodes = Array.from(
    new Set(
      visibleCatalog.flatMap((item) => [
        item.eventCode,
        ...getNotificationEventAliases(item.eventCode),
      ])
    )
  )

  const allowedModules = Array.from(
    new Set(visibleCatalog.map((item) => item.module))
  )

  return {
    membershipId: membership.id,
    effectivePermissions,
    visibleCatalog,
    allowedEventCodes,
    allowedModules,
  }
}

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const query = new ListNotificationsQueryDTO(req.validatedQuery ?? req.query)
  const access = await resolveAccessContext(req)

  const result = await notificationService.listForUser(
    req.user!.userId,
    req.empresaId,
    query,
    req.prisma,
    {
      allowedEventCodes: access.allowedEventCodes,
      allowedModules: access.allowedModules,
    }
  )

  return ApiResponse.paginated(
    res,
    result.items,
    result.meta.page,
    result.meta.limit,
    result.meta.total
  )
})

export const markNotificationAsRead = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const access = await resolveAccessContext(req)

  const updated = await notificationService.markAsRead(
    id,
    req.user!.userId,
    req.empresaId,
    req.prisma,
    {
      allowedEventCodes: access.allowedEventCodes,
      allowedModules: access.allowedModules,
    }
  )
  if (!updated) throw new NotFoundError('Notificación no encontrada')
  return ApiResponse.success(res, updated)
})

export const markAllNotificationsAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const access = await resolveAccessContext(req)
    const result = await notificationService.markAllAsRead(
      req.user!.userId,
      req.empresaId,
      req.prisma,
      {
        allowedEventCodes: access.allowedEventCodes,
        allowedModules: access.allowedModules,
      }
    )
    return ApiResponse.success(res, result)
  }
)

export const getNotificationCatalogController = asyncHandler(
  async (req: Request, res: Response) => {
    const access = await resolveAccessContext(req)
    return ApiResponse.success(res, { items: access.visibleCatalog })
  }
)

export const getCompanyPolicies = asyncHandler(async (req: Request, res: Response) => {
  const [policies, catalog] = await Promise.all([
    notificationService.getCompanyPolicies(req.empresaId, req.prisma),
    Promise.resolve(getNotificationCatalog({ includeHidden: true })),
  ])

  const policyMap = new Map(policies.map((p) => [p.eventCode, p]))

  const merged = catalog.map((item) => {
    const override = policyMap.get(item.eventCode)
    const locked = isNotificationCatalogItemHardLocked(item)

    return {
      eventCode: item.eventCode,
      module: item.module,
      enabled: locked ? true : (override?.enabled ?? item.defaultEnabled),
      mandatory: locked ? true : (override?.mandatory ?? item.defaultMandatory),
      requiredPermissionsAny:
        override?.requiredPermissionsAny ?? item.requiredPermissionsAny,
      dedupWindowSec: override?.dedupWindowSec ?? item.defaultDedupWindowSec,
      locked,
      updatedBy: override?.updatedBy,
      updatedByName: override?.updatedByName,
      createdAt: override?.createdAt,
      updatedAt: override?.updatedAt,
    }
  })

  return ApiResponse.success(res, { items: merged })
})

export const upsertCompanyPolicies = asyncHandler(async (req: Request, res: Response) => {
  const dto = new UpsertCompanyPoliciesDTO(req.validatedBody ?? req.body)
  const actorName = await getActorName(req)

  const updated = await notificationService.upsertCompanyPolicies(
    {
      empresaId: req.empresaId,
      actorUserId: req.user!.userId,
      actorName,
      policies: dto.policies,
    },
    req.prisma
  )

  return ApiResponse.success(res, { items: updated })
})

export const getMyNotificationPreferences = asyncHandler(
  async (req: Request, res: Response) => {
    const access = await resolveAccessContext(req)

    const [preferences, companyPolicies] = await Promise.all([
      notificationService.getMembershipPreferences(access.membershipId, req.prisma, {
        eventCodes: access.visibleCatalog.map((item) => item.eventCode),
      }),
      notificationService.getCompanyPolicies(req.empresaId, req.prisma),
    ])

    const preferenceMap = new Map(preferences.map((p) => [p.eventCode, p]))
    const companyPolicyMap = new Map(companyPolicies.map((p) => [p.eventCode, p]))

    const items = access.visibleCatalog.map((item) => {
      const pref = preferenceMap.get(item.eventCode)
      const policy = companyPolicyMap.get(item.eventCode)
      const lockedBySeverity = isNotificationCatalogItemHardLocked(item)
      const mandatory = lockedBySeverity
        ? true
        : (policy?.mandatory ?? item.defaultMandatory)
      const locked = mandatory || lockedBySeverity

      return {
        eventCode: item.eventCode,
        module: item.module,
        enabled: locked ? true : (pref?.enabled ?? true),
        mandatory,
        locked,
        updatedBy: pref?.updatedBy,
        updatedByName: pref?.updatedByName,
        createdAt: pref?.createdAt,
        updatedAt: pref?.updatedAt,
      }
    })

    return ApiResponse.success(res, { items })
  }
)

export const upsertMyNotificationPreferences = asyncHandler(
  async (req: Request, res: Response) => {
    const dto = new UpsertPreferencesDTO(req.validatedBody ?? req.body)
    const access = await resolveAccessContext(req)

    const companyPolicies = await notificationService.getCompanyPolicies(
      req.empresaId,
      req.prisma
    )

    const actorName = await getActorName(req)
    const companyPolicyMap = new Map(companyPolicies.map((p) => [p.eventCode, p]))
    const catalogMap = new Map(
      access.visibleCatalog.map((item) => [item.eventCode, item])
    )
    const visibleEventCodes = new Set(access.visibleCatalog.map((item) => item.eventCode))

    const normalizedMap = new Map<
      string,
      { eventCode: string; enabled: boolean }
    >()

    for (const preference of dto.preferences) {
      const canonicalEventCode = resolveNotificationEventCode(preference.eventCode)
      if (!visibleEventCodes.has(canonicalEventCode)) continue

      const catalogItem = catalogMap.get(canonicalEventCode)
      if (!catalogItem) continue

      const policy = companyPolicyMap.get(canonicalEventCode)
      const lockedBySeverity = isNotificationCatalogItemHardLocked(catalogItem)
      const mandatory = lockedBySeverity
        ? true
        : (policy?.mandatory ?? catalogItem.defaultMandatory)
      const enabled = mandatory ? true : Boolean(preference.enabled)

      normalizedMap.set(canonicalEventCode, {
        eventCode: canonicalEventCode,
        enabled,
      })
    }

    const normalizedPreferences = [...normalizedMap.values()]

    const updated = await notificationService.upsertMembershipPreferences(
      {
        membershipId: access.membershipId,
        actorUserId: req.user!.userId,
        actorName,
        preferences: normalizedPreferences,
      },
      req.prisma
    )

    const filtered = updated.filter((item) => {
      const canonicalEventCode = resolveNotificationEventCode(item.eventCode)
      return visibleEventCodes.has(canonicalEventCode)
    })

    return ApiResponse.success(res, { items: filtered })
  }
)
