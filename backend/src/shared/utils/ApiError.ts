// backend/src/shared/utils/ApiError.ts

export class ApiError extends Error {
  public statusCode: number
  public isOperational: boolean
  public errors?: any[]

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    errors?: any[]
  ) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.errors = errors

    Object.setPrototypeOf(this, ApiError.prototype)
    Error.captureStackTrace(this, this.constructor)
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string = 'Solicitud inválida', errors?: any[]) {
    super(message, 400, true, errors)
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'No autorizado') {
    super(message, 401, true)
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Acceso denegado') {
    super(message, 403, true)
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Recurso no encontrado') {
    super(message, 404, true)
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Conflicto con el estado actual del recurso') {
    super(message, 409, true)
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = 'Error de validación', errors?: any[]) {
    super(message, 422, true, errors)
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = 'Error interno del servidor') {
    super(message, 500, false)
  }
}
