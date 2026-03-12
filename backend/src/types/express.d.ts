import {
  PrismaClient,
  Membership,
  CompanyRole,
} from '@/generated/prisma/client'

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        correo?: string
        acceso?: string
      }
      empresaId?: string
      prisma?: PrismaClient
      membership?: Membership & {
        role?: CompanyRole
      }
      validatedBody?: unknown
      validatedQuery?: unknown
      validatedParams?: unknown
    }
  }
}

export {}
