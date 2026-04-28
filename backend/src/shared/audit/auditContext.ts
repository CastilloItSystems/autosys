import { AsyncLocalStorage } from 'node:async_hooks'
import { Request, Response, NextFunction } from 'express'

export interface AuditRequestContext {
  userId?: string
  empresaId?: string
  ip?: string
  userAgent?: string
  method?: string
  path?: string
}

const auditStorage = new AsyncLocalStorage<AuditRequestContext>()

export function auditContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const forwardedFor = req.headers['x-forwarded-for']
  const ip =
    (typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0]?.trim()
      : Array.isArray(forwardedFor)
        ? forwardedFor[0]?.split(',')[0]?.trim()
        : undefined) ||
    req.ip ||
    req.socket.remoteAddress ||
    'unknown'

  auditStorage.run(
    {
      ip,
      userAgent: req.get('user-agent') || 'unknown',
      method: req.method,
      path: req.originalUrl || req.url,
    },
    next
  )
}

export function getAuditContext(): AuditRequestContext | undefined {
  return auditStorage.getStore()
}

export function setAuditContext(values: Partial<AuditRequestContext>): void {
  const store = auditStorage.getStore()
  if (store) Object.assign(store, values)
}
