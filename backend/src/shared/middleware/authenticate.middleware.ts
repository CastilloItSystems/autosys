// backend/src/shared/middleware/authenticate.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { UnauthorizedError } from '../utils/apiError.js'
import { asyncHandler } from './asyncHandler.middleware.js'
import { verifyToken } from '../../services/jwt.service.js'
import prisma from '../../services/prisma.service.js'

export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token no proporcionado')
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      throw new UnauthorizedError('Formato de token inválido')
    }

    let decoded
    try {
      decoded = verifyToken(token)
    } catch {
      throw new UnauthorizedError('Token inválido o expirado')
    }

    if (!decoded) {
      throw new UnauthorizedError('Token inválido o expirado')
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        correo: true,
        rol: true,
        acceso: true,
        estado: true,
        eliminado: true,
      },
    })

    if (!user || user.eliminado || user.estado !== 'activo') {
      throw new UnauthorizedError('Usuario no autorizado o inactivo')
    }

    req.user = decoded
    next()
  }
)

export const optionalAuthenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next()
    }

    const token = authHeader.split(' ')[1]
    if (!token) return next()

    let decoded
    try {
      decoded = verifyToken(token)
    } catch {
      return next()
    }

    if (!decoded) return next()

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        eliminado: true,
        estado: true,
      },
    })

    if (user && !user.eliminado && user.estado === 'activo') {
      req.user = decoded
    }

    next()
  }
)
