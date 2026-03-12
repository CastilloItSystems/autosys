import { Request, Response, NextFunction } from 'express'
import prisma from '../../services/prisma.service.js'
import { ApiResponse } from '../utils/apiResponse.js'
import { createTenantPrisma } from '../../services/prisma-tenant.service.js'
import { logger } from '../utils/logger.js'

export const extractEmpresa = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return ApiResponse.unauthorized(res, 'Usuario no autenticado')
    }

    const rawEmpresaId = req.headers['x-empresa-id']
    const empresaId =
      typeof rawEmpresaId === 'string'
        ? rawEmpresaId.trim()
        : Array.isArray(rawEmpresaId)
          ? rawEmpresaId[0]?.trim()
          : undefined

    if (!empresaId) {
      return ApiResponse.badRequest(res, 'El header X-Empresa-Id es requerido')
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_empresaId: {
          userId: req.user.userId,
          empresaId,
        },
      },
      include: {
        role: true,
      },
    })

    if (!membership) {
      return ApiResponse.forbidden(res, 'No tienes acceso a esta empresa')
    }

    if (membership.status !== 'active') {
      return ApiResponse.forbidden(
        res,
        'Tu membresía en esta empresa no está activa'
      )
    }

    req.empresaId = empresaId
    req.prisma = createTenantPrisma(empresaId)
    req.membership = membership

    return next()
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))

    logger.error('[extractEmpresa] Error', {
      message: err.message,
      stack: err.stack,
      userId: req.user?.userId,
    })

    return ApiResponse.serverError(res, 'Error al validar acceso a empresa')
  }
}
