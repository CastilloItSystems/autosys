// backend/src/shared/middleware/errorHandler.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { Prisma } from '../../generated/prisma/client.js'
import { ApiError } from '../utils/apiError.js'
import { ApiResponse } from '../utils/apiResponse.js'
import { logger } from '../utils/logger.js'

const isProduction = process.env.NODE_ENV === 'production'

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  const error = err instanceof Error ? err : new Error(String(err))

  // Evitar fugas de info sensible en producción
  logger.error('Error caught by errorHandler', {
    message: error.message,
    stack: isProduction ? undefined : error.stack,
    url: req.url,
    method: req.method,
    params: req.params,
    query: req.query,
    body: isProduction ? undefined : req.body,
  })

  // Error personalizado de la aplicación
  if (error instanceof ApiError) {
    return ApiResponse.error(res, error.message, error.statusCode, error.errors)
  }

  // Errores de Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error, res)
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return ApiResponse.badRequest(
      res,
      'Error de validación en la base de datos'
    )
  }

  // Errores de JWT comunes
  if (error.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Token inválido')
  }

  if (error.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, 'Token expirado')
  }

  // Body JSON malformado
  if (error instanceof SyntaxError && 'body' in error) {
    return ApiResponse.badRequest(res, 'JSON inválido en el body')
  }

  // PayloadTooLargeError — body-parser rechaza el request antes del controller
  if ('status' in error && (error as any).status === 413) {
    return ApiResponse.error(res, 'El archivo supera el límite permitido', 413)
  }

  // Error de validación genérico (Joi/Zod/etc según adapter)
  if (error.name === 'ValidationError') {
    return ApiResponse.validationError(res, [error.message])
  }

  // Error genérico
  const message = isProduction ? 'Error interno del servidor' : error.message
  return ApiResponse.serverError(res, message, isProduction ? undefined : error)
}

function handlePrismaError(
  err: Prisma.PrismaClientKnownRequestError,
  res: Response
): Response {
  switch (err.code) {
    case 'P2002': {
      // Unique constraint violation
      const field = (err.meta?.target as string[])?.join(', ') || 'campo'
      return ApiResponse.conflict(
        res,
        `Ya existe un registro con este ${field}`
      )
    }

    case 'P2025':
      // Record not found
      return ApiResponse.notFound(res, 'Registro no encontrado')

    case 'P2003':
      // Foreign key constraint violation
      return ApiResponse.badRequest(
        res,
        'No se puede eliminar porque tiene registros relacionados'
      )

    case 'P2014':
      // Required relation violation
      return ApiResponse.badRequest(res, 'Faltan relaciones requeridas')

    default:
      logger.error('Prisma error no mapeado', {
        code: err.code,
        meta: err.meta,
      })
      return ApiResponse.serverError(res, 'Error en la base de datos')
  }
}

export const notFoundHandler = (req: Request, res: Response): Response => {
  return ApiResponse.notFound(
    res,
    `Ruta no encontrada: ${req.method} ${req.url}`
  )
}
