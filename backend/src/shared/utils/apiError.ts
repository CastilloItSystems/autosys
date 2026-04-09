// backend/src/shared/utils/ApiError.ts

export class ApiError extends Error {
  public statusCode: number
  public isOperational: boolean
  public errors?: unknown[] | undefined

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    errors?: unknown[] | undefined
  ) {
    super(message)

    this.name = this.constructor.name
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.errors = errors

    Object.setPrototypeOf(this, new.target.prototype)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export class BadRequestError extends ApiError {
  constructor(
    message: string = 'Solicitud inválida',
    errors?: unknown[] | undefined
  ) {
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
  constructor(
    message: string = 'Error de validación',
    errors?: unknown[] | undefined
  ) {
    super(message, 422, true, errors)
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = 'Error interno del servidor') {
    super(message, 500, false)
  }
}
