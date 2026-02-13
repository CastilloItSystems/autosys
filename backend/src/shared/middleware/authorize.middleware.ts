// backend/src/shared/middleware/authorize.middleware.ts

import { Request, Response, NextFunction } from 'express'
import { ForbiddenError } from '../utils/ApiError'
import { ROLE_PERMISSIONS, Permission, Role } from '../constants/permissions'

export const authorize = (...requiredPermissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ForbiddenError('Usuario no autenticado')
    }

    const userRole = req.user.role as Role
    const userPermissions = ROLE_PERMISSIONS[userRole] || []

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
