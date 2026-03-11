// backend/src/shared/middleware/requestLogger.middleware.ts
import { Request, Response, NextFunction } from 'express'
import morgan from 'morgan'
import { logger, morganStream } from '../utils/logger.js'

const SENSITIVE_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'secret',
  'apiKey',
  'clientSecret',
  'cookie',
]

const maskSensitive = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(maskSensitive)
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const masked: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(obj)) {
      if (
        SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))
      ) {
        masked[key] = '***'
      } else {
        masked[key] = maskSensitive(val)
      }
    }
    return masked
  }
  return value
}

// Formato personalizado de Morgan
morgan.token('body', (req: Request) => {
  if (req.method === 'GET' || req.method === 'DELETE') return '-'
  if (!req.body || Object.keys(req.body).length === 0) return '-'
  try {
    return JSON.stringify(maskSensitive(req.body))
  } catch {
    return '[unserializable body]'
  }
})

morgan.token('user', (req: Request) => req.user?.userId || 'anonymous')

const format =
  process.env.NODE_ENV === 'production'
    ? ':method :url :status :response-time ms - :user'
    : ':method :url :status :response-time ms - :user - :body'

export const requestLogger = morgan(format, {
  stream: morganStream,
  skip: (req) => req.url === '/health' || req.url === '/api/health',
})

export const logRequestDetails = (
  req: Request,
  _res: Response,
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
