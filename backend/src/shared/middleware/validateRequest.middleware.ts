// backend/src/shared/middleware/validateRequest.middleware.ts

import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { ApiResponse } from '../utils/apiResponse.js'

type ValidationSource = 'body' | 'query' | 'params'

const spanishJoiMessages = {
  'string.base': '"{#label}" debe ser un texto',
  'string.empty': '"{#label}" no puede estar vacío',
  'string.min': '"{#label}" debe tener al menos {#limit} caracteres',
  'string.max': '"{#label}" no puede exceder los {#limit} caracteres',
  'string.email': '"{#label}" debe ser un correo válido',
  'string.guid': '"{#label}" debe ser un UUID válido',
  'any.required': '"{#label}" es un campo requerido',
  'any.only': '"{#label}" debe ser uno de los valores permitidos',
  'number.base': '"{#label}" debe ser un número',
  'number.integer': '"{#label}" debe ser un número entero',
  'number.min': '"{#label}" debe ser mayor o igual a {#limit}',
  'number.max': '"{#label}" debe ser menor o igual a {#limit}',
  'number.positive': '"{#label}" debe ser un número positivo',
  'date.base': '"{#label}" debe ser una fecha válida',
  'date.iso': '"{#label}" debe tener un formato de fecha ISO',
  'boolean.base': '"{#label}" debe ser un valor booleano (verdadero/falso)',
}

// Reemplaza strings vacíos por null para que Joi no rechace campos opcionales que permitan null.
const cleanEmptyStrings = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(cleanEmptyStrings)
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      acc[key] = obj[key] === '' ? null : cleanEmptyStrings(obj[key])
      return acc
    }, {} as any)
  }
  return obj
}

export const validateRequest = (
  schema: Joi.ObjectSchema,
  source: ValidationSource = 'body'
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Limpiamos los strings vacíos antes de validar
      const input = source === 'body' ? cleanEmptyStrings(req[source]) : req[source]

      const value = await schema.validateAsync(input, {
        abortEarly: false,
        stripUnknown: true,
        messages: spanishJoiMessages,
      })

      if (source === 'body') req.validatedBody = value
      if (source === 'query') req.validatedQuery = value
      if (source === 'params') req.validatedParams = value

      next()
    } catch (err: unknown) {
      if (Joi.isError(err)) {
        const errors = err.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }))
        ApiResponse.validationError(res, errors)
        return
      }

      if (err instanceof Error) {
        ApiResponse.validationError(res, [
          { field: 'value', message: err.message },
        ])
        return
      }

      next(err)
    }
  }
}

export const validateBody = (schema: Joi.ObjectSchema) =>
  validateRequest(schema, 'body')
export const validateQuery = (schema: Joi.ObjectSchema) =>
  validateRequest(schema, 'query')
export const validateParams = (schema: Joi.ObjectSchema) =>
  validateRequest(schema, 'params')
