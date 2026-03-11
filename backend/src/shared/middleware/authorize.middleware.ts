// backend/src/shared/middleware/authorize.middleware.ts

import { Request, Response, NextFunction } from 'express'
import { ForbiddenError, UnauthorizedError } from '../utils/apiError.js'
import { Permission } from '../constants/permissions.js'
import { Role } from '../constants/roles.js'

const skipAuthzInTests = process.env.SKIP_AUTHZ_IN_TESTS === 'true'

/**
 * Middleware de autorización: requiere TODOS los permisos indicados.
 * Los permisos ya vienen resueltos en el JWT (req.user.permissions).
 */
export const authorize = (...requiredPermissions: Permission[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (process.env.NODE_ENV === 'test' && skipAuthzInTests) return next()

    if (!req.user) {
      throw new UnauthorizedError('Usuario no autenticado')
    }

    const userPermissions: string[] = req.user.permissions ?? []
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    )

    if (!hasPermission) {
      throw new ForbiddenError('No tienes permisos para realizar esta acción')
    }

    next()
  }
}

/**
 * Middleware de autorización: requiere AL MENOS UNO de los permisos indicados.
 */
export const authorizeAny = (...requiredPermissions: Permission[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (process.env.NODE_ENV === 'test' && skipAuthzInTests) return next()

    if (!req.user) {
      throw new UnauthorizedError('Usuario no autenticado')
    }

    const userPermissions: string[] = req.user.permissions ?? []
    const hasAnyPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission)
    )

    if (!hasAnyPermission) {
      throw new ForbiddenError('No tienes permisos para realizar esta acción')
    }

    next()
  }
}

/**
 * Middleware de autorización: requiere estar en alguno de los roles indicados.
 */
export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (process.env.NODE_ENV === 'test' && skipAuthzInTests) return next()

    if (!req.user) {
      throw new UnauthorizedError('Usuario no autenticado')
    }

    const userRole = req.user.role as Role | undefined
    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new ForbiddenError(
        'No tienes el rol necesario para realizar esta acción'
      )
    }

    next()
  }
}
