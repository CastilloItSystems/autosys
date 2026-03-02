import { Request, Response, NextFunction } from 'express'
import prisma from '../../services/prisma.service'
import { ApiResponse } from '../utils/apiResponse'
import { createTenantPrisma } from '../../services/prisma-tenant.service'

/**
 * Middleware para extraer y validar empresaId del header X-Empresa-Id
 * Debe ejecutarse DESPUÉS del middleware de autenticación
 * Valida que el usuario autenticado tenga acceso a la empresa solicitada
 * Crea e inyecta un Prisma client extendido con contexto de tenant
 */
export const extractEmpresa = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Debe venir después de authenticate, así que req.user debe existir
    if (!req.user || !req.user.userId) {
      return ApiResponse.unauthorized(res, 'Usuario no autenticado')
    }

    // Leer el header X-Empresa-Id
    const empresaId = req.headers['x-empresa-id'] as string | undefined

    // Si no viene el header, es un error (todas las rutas protegidas que usan esto requieren empresa)
    if (!empresaId) {
      return ApiResponse.badRequest(res, 'El header X-Empresa-Id es requerido')
    }

    // Validar que el usuario tiene acceso a esta empresa
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { empresas: { select: { id_empresa: true } } },
    })

    if (!user) {
      return ApiResponse.unauthorized(res, 'Usuario no encontrado')
    }

    // Verificar que la empresa está en la lista de empresas del usuario
    const hasAccess = user.empresas.some(
      (empresa) => empresa.id_empresa === empresaId
    )

    if (!hasAccess) {
      return ApiResponse.forbidden(res, 'No tienes acceso a esta empresa')
    }

    // Adjuntar empresaId al request
    req.empresaId = empresaId

    // Crear e inyectar Prisma client extendido con contexto de tenant
    // Esto hace que TODAS las queries de modelos ancla se filtren automáticamente por empresaId
    req.prisma = createTenantPrisma(empresaId) as any

    next()
  } catch (error) {
    console.error('[extractEmpresa] Error:', error)
    return ApiResponse.serverError(res, 'Error al validar acceso a empresa')
  }
}
