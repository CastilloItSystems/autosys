import { JWTPayload } from '@/services/jwt.service'
import { PrismaClient } from '@/generated/prisma/client'

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
      empresaId?: string
      prisma?: any // Prisma client extendido con contexto de tenant
    }
  }
}
