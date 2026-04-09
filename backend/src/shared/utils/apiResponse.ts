// backend/src/shared/utils/apiResponse.ts

import { Response } from 'express'
import { PaginationHelper } from './pagination.js'

interface ApiResponseData<T = unknown> {
  success: boolean
  message?: string
  data?: T
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
    hasNext?: boolean
    hasPrev?: boolean
  }
  errors?: unknown[]
  timestamp?: string
}

export class ApiResponse {
  static success<T>(
    res: Response,
    data?: T,
    message = 'Operación exitosa',
    statusCode = 200
  ): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    } as ApiResponseData<T>)
  }

  static created<T>(
    res: Response,
    data?: T,
    message = 'Recurso creado exitosamente'
  ): Response {
    return this.success(res, data, message, 201)
  }

  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message = 'Datos obtenidos exitosamente'
  ): Response {
    const meta = PaginationHelper.getMeta(page, limit, total)
    return res.status(200).json({
      success: true,
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
    } as ApiResponseData<T[]>)
  }

  static noContent(res: Response): Response {
    return res.status(204).send()
  }

  static error(
    res: Response,
    message = 'Ha ocurrido un error',
    statusCode = 500,
    errors?: unknown[]
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    } as ApiResponseData)
  }

  static badRequest(
    res: Response,
    message = 'Solicitud inválida',
    errors?: unknown[]
  ): Response {
    return this.error(res, message, 400, errors)
  }

  static unauthorized(res: Response, message = 'No autorizado'): Response {
    return this.error(res, message, 401)
  }

  static forbidden(res: Response, message = 'Acceso denegado'): Response {
    return this.error(res, message, 403)
  }

  static notFound(res: Response, message = 'Recurso no encontrado'): Response {
    return this.error(res, message, 404)
  }

  static conflict(
    res: Response,
    message = 'Conflicto con el estado actual del recurso'
  ): Response {
    return this.error(res, message, 409)
  }

  static validationError(
    res: Response,
    errors: unknown[],
    message = 'Error de validación'
  ): Response {
    return this.error(res, message, 422, errors)
  }

  static serverError(
    res: Response,
    message = 'Error interno del servidor',
    error?: unknown
  ): Response {
    const isProd = process.env.NODE_ENV === 'production'
    const errors =
      !isProd && error
        ? [error instanceof Error ? error.message : String(error)]
        : undefined

    return this.error(res, message, 500, errors)
  }
}
