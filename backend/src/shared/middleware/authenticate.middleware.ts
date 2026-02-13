// backend/src/shared/middleware/authenticate.middleware.ts

import { Request, Response, NextFunction } from 'express'
import { UnauthorizedError } from '../utils/ApiError'
import { asyncHandler } from './asyncHandler.middleware'
import { verifyToken, JWTPayload } from '../../services/jwt.service'
import prisma from '../../services/prisma.service'

// Extender Express Request para incluir usuario
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

export const authenticate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Obtener token del header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token no proporcionado')
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      throw new UnauthorizedError('Formato de token inválido')
    }

    // Verificar token
    const decoded = verifyToken(token)
    if (!decoded) {
      throw new UnauthorizedError('Token inválido o expirado')
    }

    // Verificar que el usuario existe, no está eliminado y está activo
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

    // Adjuntar usuario al request
    req.user = decoded

    next()
  }
)

export const optionalAuthenticate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next()
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      return next()
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      // Si el token es inválido, simplemente continuar sin usuario
      return next()
    }

    // Verificar que usuario existe y está activo
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
