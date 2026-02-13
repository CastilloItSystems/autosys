// backend/src/shared/middleware/validateRequest.middleware.ts

import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { ApiResponse } from '../utils/ApiResponse'

type ValidationSource = 'body' | 'query' | 'params'

// Extender Express Request para incluir datos validados
declare global {
  namespace Express {
    interface Request {
      validatedBody?: any
      validatedQuery?: any
      validatedParams?: any
    }
  }
}

export const validateRequest = (
  schema: Joi.ObjectSchema,
  source: ValidationSource = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }))

      ApiResponse.validationError(res, errors)
      return
    }

    // Almacenar valores validados sin reasignar las propiedades de solo lectura
    if (source === 'body') {
      req.validatedBody = value
    } else if (source === 'query') {
      req.validatedQuery = value
    } else if (source === 'params') {
      req.validatedParams = value
    }

    next()
  }
}

export const validateBody = (schema: Joi.ObjectSchema) =>
  validateRequest(schema, 'body')
export const validateQuery = (schema: Joi.ObjectSchema) =>
  validateRequest(schema, 'query')
export const validateParams = (schema: Joi.ObjectSchema) =>
  validateRequest(schema, 'params')
