import { JWTPayload } from '@/services/jwt.service'
import { PrismaClient } from '@/generated/prisma/client'

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
      empresaId?: string
      prisma?: PrismaClient
      validatedBody?: unknown
      validatedQuery?: unknown
      validatedParams?: unknown
    }
  }
}

export {}
