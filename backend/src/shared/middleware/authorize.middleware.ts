// backend/src/shared/middleware/authorize.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { ForbiddenError, UnauthorizedError } from '../utils/apiError.js'
import prisma from '../../services/prisma.service.js'

// Evaluated per-request so dotenv has time to load before the first check
const skipAuthzInTests = () =>
  process.env.NODE_ENV === 'test' && process.env.SKIP_AUTHZ_IN_TESTS === 'true'

async function getEffectivePermissions(
  membershipId: string
): Promise<Set<string>> {
  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  })

  if (!membership) {
    return new Set()
  }

  const effectivePermissions = new Set<string>()

  for (const rp of membership.role.permissions) {
    effectivePermissions.add(rp.permission.code)
  }

  for (const mp of membership.permissions) {
    if (mp.action === 'GRANT') {
      effectivePermissions.add(mp.permission.code)
    }

    if (mp.action === 'REVOKE') {
      effectivePermissions.delete(mp.permission.code)
    }
  }

  return effectivePermissions
}

export const authorize = (...requiredPermissions: string[]) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (skipAuthzInTests()) return next()

    if (!req.user) {
      throw new UnauthorizedError('Usuario no autenticado')
    }

    if (!req.membership?.id) {
      throw new ForbiddenError(
        'No se encontró la membresía activa para esta empresa'
      )
    }

    const userPermissions = await getEffectivePermissions(req.membership.id)

    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.has(permission)
    )
    if (!hasAllPermissions) {
      throw new ForbiddenError('No tienes permisos para realizar esta acción')
    }

    next()
  }
}

export const authorizeAny = (...requiredPermissions: string[]) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (skipAuthzInTests()) return next()

    if (!req.user) {
      throw new UnauthorizedError('Usuario no autenticado')
    }

    if (!req.membership?.id) {
      throw new ForbiddenError(
        'No se encontró la membresía activa para esta empresa'
      )
    }

    const userPermissions = await getEffectivePermissions(req.membership.id)

    const hasAnyPermission = requiredPermissions.some((permission) =>
      userPermissions.has(permission)
    )

    if (!hasAnyPermission) {
      throw new ForbiddenError('No tienes permisos para realizar esta acción')
    }

    next()
  }
}

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (skipAuthzInTests()) return next()

    if (!req.user) {
      throw new UnauthorizedError('Usuario no autenticado')
    }

    const roleName = req.membership?.role?.name

    if (!roleName || !allowedRoles.includes(roleName)) {
      throw new ForbiddenError(
        'No tienes el rol necesario para realizar esta acción'
      )
    }

    next()
  }
}
