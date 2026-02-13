// backend/src/shared/middleware/errorHandler.middleware.ts

import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../utils/ApiError'
import { ApiResponse } from '../utils/ApiResponse'
import { logger } from '../utils/logger'
import { Prisma } from '../../generated/prisma/client'

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  // Log del error
  logger.error('Error caught by errorHandler:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
  })

  // Error personalizado de la aplicación
  if (err instanceof ApiError) {
    return ApiResponse.error(res, err.message, err.statusCode, err.errors)
  }

  // Errores de Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(err, res)
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return ApiResponse.badRequest(
      res,
      'Error de validación en la base de datos'
    )
  }

  // Error de validación de Joi/Zod
  if (err.name === 'ValidationError') {
    return ApiResponse.validationError(res, [err.message])
  }

  // Error genérico
  const statusCode = 500
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message

  return ApiResponse.serverError(res, message, err)
}

function handlePrismaError(
  err: Prisma.PrismaClientKnownRequestError,
  res: Response
): Response {
  switch (err.code) {
    case 'P2002':
      // Unique constraint violation
      const field = (err.meta?.target as string[])?.join(', ') || 'campo'
      return ApiResponse.conflict(
        res,
        `Ya existe un registro con este ${field}`
      )

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
      logger.error('Prisma error:', { code: err.code, meta: err.meta })
      return ApiResponse.serverError(res, 'Error en la base de datos')
  }
}

export const notFoundHandler = (req: Request, res: Response): Response => {
  return ApiResponse.notFound(
    res,
    `Ruta no encontrada: ${req.method} ${req.url}`
  )
}
