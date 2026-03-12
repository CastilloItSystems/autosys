// backend/src/shared/middleware/authorizeGlobal.middleware.ts
// Autoriza operaciones sobre entidades globales del SaaS (e.g. /empresas)
// verificando que el usuario tenga al menos un Membership activo con un rol
// administrativo global (por defecto: OWNER o ADMIN).

import { Request, Response, NextFunction } from 'express'
import { ForbiddenError, UnauthorizedError } from '../utils/apiError.js'
import prisma from '../../services/prisma.service.js'

const GLOBAL_ADMIN_ROLES = ['OWNER', 'ADMIN']
const skipAuthzInTests = process.env.SKIP_AUTHZ_IN_TESTS === 'true'

/**
 * Middleware de autorización global para entidades SaaS.
 * No requiere extractEmpresa: verifica cualquier membership activa del usuario.
 *
 * @param allowedRoles Roles que tienen acceso. Por defecto: ['OWNER', 'ADMIN'].
 */
export const authorizeGlobal = (...allowedRoles: string[]) => {
  const roles = allowedRoles.length > 0 ? allowedRoles : GLOBAL_ADMIN_ROLES

  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (process.env.NODE_ENV === 'test' && skipAuthzInTests) return next()

    if (!req.user) {
      throw new UnauthorizedError('Usuario no autenticado')
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: req.user.userId,
        status: 'active',
        role: { name: { in: roles } },
      },
      select: { id: true },
    })

    if (!membership) {
      throw new ForbiddenError(
        'No tienes permisos globales para realizar esta acción'
      )
    }

    next()
  }
}
