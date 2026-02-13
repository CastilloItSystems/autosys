// backend/src/shared/utils/ApiResponse.ts

import { Response } from 'express'

interface ApiResponseData<T = any> {
  success: boolean
  message?: string
  data?: T
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
  errors?: any[]
  timestamp?: string
}

export class ApiResponse {
  static success<T>(
    res: Response,
    data?: T,
    message: string = 'Operación exitosa',
    statusCode: number = 200
  ): Response {
    const response: ApiResponseData<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    }

    return res.status(statusCode).json(response)
  }

  static created<T>(
    res: Response,
    data?: T,
    message: string = 'Recurso creado exitosamente'
  ): Response {
    return this.success(res, data, message, 201)
  }

  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = 'Datos obtenidos exitosamente'
  ): Response {
    const response: ApiResponseData<T[]> = {
      success: true,
      message,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    }

    return res.status(200).json(response)
  }

  static noContent(res: Response): Response {
    return res.status(204).send()
  }

  static error(
    res: Response,
    message: string = 'Ha ocurrido un error',
    statusCode: number = 500,
    errors?: any[]
  ): Response {
    const response: ApiResponseData = {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    }

    return res.status(statusCode).json(response)
  }

  static badRequest(
    res: Response,
    message: string = 'Solicitud inválida',
    errors?: any[]
  ): Response {
    return this.error(res, message, 400, errors)
  }

  static unauthorized(
    res: Response,
    message: string = 'No autorizado'
  ): Response {
    return this.error(res, message, 401)
  }

  static forbidden(
    res: Response,
    message: string = 'Acceso denegado'
  ): Response {
    return this.error(res, message, 403)
  }

  static notFound(
    res: Response,
    message: string = 'Recurso no encontrado'
  ): Response {
    return this.error(res, message, 404)
  }

  static conflict(
    res: Response,
    message: string = 'Conflicto con el estado actual del recurso'
  ): Response {
    return this.error(res, message, 409)
  }

  static validationError(
    res: Response,
    errors: any[],
    message: string = 'Error de validación'
  ): Response {
    return this.error(res, message, 422, errors)
  }

  static serverError(
    res: Response,
    message: string = 'Error interno del servidor',
    error?: any
  ): Response {
    return this.error(res, message, 500, error ? [error] : undefined)
  }
}
