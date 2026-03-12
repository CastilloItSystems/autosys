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

/**
 * Igual que extractEmpresa pero lee el empresaId del parámetro de URL `:id`
 * en vez del header X-Empresa-Id. Para usar en rutas tipo /empresas/:id/...
 */
export const extractEmpresaFromParam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return ApiResponse.unauthorized(res, 'Usuario no autenticado')
    }

    const rawId = req.params.id
    const empresaId = (Array.isArray(rawId) ? rawId[0] : rawId)?.trim()

    if (!empresaId) {
      return ApiResponse.badRequest(
        res,
        'El ID de empresa es requerido en la URL'
      )
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

    logger.error('[extractEmpresaFromParam] Error', {
      message: err.message,
      stack: err.stack,
      userId: req.user?.userId,
    })

    return ApiResponse.serverError(res, 'Error al validar acceso a empresa')
  }
}
