import { Request, Response, NextFunction } from 'express'
import {
  verifyToken,
  extractTokenFromHeader,
  JWTPayload,
} from '../services/jwt.service.js'

// Extender el tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = extractTokenFromHeader(req.headers.authorization)

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(403).json({ error: 'Token inválido o expirado' })
  }

  req.user = decoded
  next()
}

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: 'No tienes permisos para acceder a este recurso' })
    }

    next()
  }
}

export const requireAccess = (allowedAccess: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    if (!allowedAccess.includes(req.user.access)) {
      return res
        .status(403)
        .json({ error: 'No tienes el nivel de acceso requerido' })
    }

    next()
  }
}
