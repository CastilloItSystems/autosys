// backend/src/shared/middleware/authorize.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { ForbiddenError, UnauthorizedError } from '../utils/apiError.js'
import {
  getEffectivePermissionsForMembership,
  userHasPermissionsInAnyEmpresa,
} from '../utils/resolvePermissions.js'

// Evaluated per-request so dotenv has time to load before the first check
const skipAuthzInTests = () =>
  process.env.NODE_ENV === 'test' && process.env.SKIP_AUTHZ_IN_TESTS === 'true'

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

    const userPermissions = await getEffectivePermissionsForMembership(
      req.membership.id
    )

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

    const userPermissions = await getEffectivePermissionsForMembership(
      req.membership.id
    )

    const hasAnyPermission = requiredPermissions.some((permission) =>
      userPermissions.has(permission)
    )

    if (!hasAnyPermission) {
      throw new ForbiddenError('No tienes permisos para realizar esta acción')
    }

    next()
  }
}

export const authorizeInAnyEmpresa = (...requiredPermissions: string[]) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (skipAuthzInTests()) return next()

    if (!req.user) {
      throw new UnauthorizedError('Usuario no autenticado')
    }

    const hasPermissions = await userHasPermissionsInAnyEmpresa(
      req.user.userId,
      requiredPermissions
    )

    if (!hasPermissions) {
      throw new ForbiddenError('No tienes permisos para realizar esta acción')
    }

    next()
  }
}
