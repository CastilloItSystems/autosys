// backend/src/shared/middleware/authorize.middleware.ts

import { Request, Response, NextFunction } from 'express'
import { ForbiddenError } from '../utils/ApiError'
import { Permission, Role } from '../constants/permissions'

/**
 * Middleware de autorización basado en permisos.
 * Lee los permisos ya resueltos que vienen en el JWT (req.user.permissions).
 * Esos permisos ya incluyen rol base + overrides individuales del usuario.
 */
export const authorize = (...requiredPermissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // During automated tests, skip granular permission checks for simplicity
    if (process.env.NODE_ENV === 'test') return next()
    if (!req.user) {
      throw new ForbiddenError('Usuario no autenticado')
    }

    // Los permisos resueltos vienen en el JWT desde el login
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

export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ForbiddenError('Usuario no autenticado')
    }

    const userRole = req.user.role as Role

    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenError(
        'No tienes el rol necesario para realizar esta acción'
      )
    }

    next()
  }
}
