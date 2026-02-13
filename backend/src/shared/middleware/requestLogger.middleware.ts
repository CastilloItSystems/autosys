// backend/src/shared/middleware/requestLogger.middleware.ts

import { Request, Response, NextFunction } from 'express'
import morgan from 'morgan'
import { logger, morganStream } from '../utils/logger'

// Formato personalizado de Morgan
morgan.token('body', (req: Request) => {
  return JSON.stringify(req.body)
})

morgan.token('user', (req: Request) => {
  return req.user?.userId || 'anonymous'
})

const format =
  process.env.NODE_ENV === 'production'
    ? ':method :url :status :response-time ms - :user'
    : ':method :url :status :response-time ms - :user - :body'

export const requestLogger = morgan(format, {
  stream: morganStream,
  skip: (req: Request) => {
    // Saltar rutas de health check
    return req.url === '/health' || req.url === '/api/health'
  },
})

export const logRequestDetails = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.userId,
  })

  next()
}
