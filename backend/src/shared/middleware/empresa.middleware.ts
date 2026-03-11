import { Request, Response, NextFunction } from 'express'
import prisma from '../../services/prisma.service.js'
import { ApiResponse } from '../utils/apiResponse.js'
import { createTenantPrisma } from '../../services/prisma-tenant.service.js'
import { logger } from '../utils/logger.js'

/**
 * Middleware para extraer y validar empresaId del header X-Empresa-Id
 * Debe ejecutarse DESPUÉS del middleware de autenticación
 */
export const extractEmpresa = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return ApiResponse.unauthorized(_res, 'Usuario no autenticado')
    }

    const rawEmpresaId = req.headers['x-empresa-id']
    const empresaId =
      typeof rawEmpresaId === 'string'
        ? rawEmpresaId.trim()
        : Array.isArray(rawEmpresaId)
          ? rawEmpresaId[0]?.trim()
          : undefined

    if (!empresaId) {
      return ApiResponse.badRequest(_res, 'El header X-Empresa-Id es requerido')
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { empresas: { select: { id_empresa: true } } },
    })

    if (!user) {
      return ApiResponse.unauthorized(_res, 'Usuario no encontrado')
    }

    const hasAccess = user.empresas.some(
      (empresa: { id_empresa: string }) => empresa.id_empresa === empresaId
    )
    if (!hasAccess) {
      return ApiResponse.forbidden(_res, 'No tienes acceso a esta empresa')
    }

    req.empresaId = empresaId
    req.prisma = createTenantPrisma(empresaId)

    return next()
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('[extractEmpresa] Error', {
      message: err.message,
      stack: err.stack,
      userId: req.user?.userId,
    })
    return ApiResponse.serverError(_res, 'Error al validar acceso a empresa')
  }
}
