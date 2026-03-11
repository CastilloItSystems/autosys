// backend/src/shared/middleware/validateRequest.middleware.ts

import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { ApiResponse } from '../utils/apiResponse.js'

type ValidationSource = 'body' | 'query' | 'params'

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
      const value = await schema.validateAsync(req[source], {
        abortEarly: false,
        stripUnknown: true,
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
