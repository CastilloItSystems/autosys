// backend/src/shared/middleware/rateLimiter.middleware.ts

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit'
import { Request, Response } from 'express'
import { ApiResponse } from '../utils/apiResponse.js'

export const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000, // 15 minutos
  max: number = 100,
  message: string = 'Demasiadas solicitudes, por favor intenta de nuevo más tarde'
): RateLimitRequestHandler => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // RateLimit-* headers
    legacyHeaders: false, // X-RateLimit-* off
    skip: (req: Request) =>
      req.path === '/health' || req.path === '/api/health',
    handler: (req: Request, res: Response) => {
      // logger.warn('Rate limit exceeded', { path: req.path, ip: req.ip })
      return ApiResponse.error(res, message, 429)
    },
  })
}
// Rate limiters predefinidos
export const generalLimiter = createRateLimiter(
  15 * 60 * 1000,
  300,
  'Demasiadas solicitudes. Intenta nuevamente en unos minutos.'
)

export const authLimiter = createRateLimiter(
  15 * 60 * 1000,
  5,
  'Demasiados intentos de autenticación. Intenta nuevamente más tarde.'
)

export const apiLimiter = createRateLimiter(
  60 * 1000,
  60,
  'Has excedido el límite por minuto para esta ruta.'
)
