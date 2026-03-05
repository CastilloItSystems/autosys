// backend/src/shared/middleware/rateLimiter.middleware.ts

import rateLimit from 'express-rate-limit'
import { ApiResponse } from '../utils/ApiResponse'
import { Request, Response } from 'express'

export const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000, // 15 minutos
  max: number = 100,
  message: string = 'Demasiadas solicitudes, por favor intenta de nuevo más tarde'
) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      ApiResponse.error(res, message, 429)
    },
  })
}
// Rate limiters predefinidos
export const generalLimiter = createRateLimiter(
  15 * 60 * 1000,
  10000,
  '🔴 BLOQUEADO POR: generalLimiter'
)
export const authLimiter = createRateLimiter(
  15 * 60 * 1000,
  5,
  '🔴 BLOQUEADO POR: authLimiter'
)
export const apiLimiter = createRateLimiter(
  1 * 60 * 1000,
  30,
  '🔴 BLOQUEADO POR: apiLimiter'
)
