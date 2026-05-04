import { createHash, randomBytes, randomUUID } from 'crypto'
import { Prisma, PrismaClient } from '../generated/prisma/client.js'
import prisma from './prisma.service.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 7)
const REFRESH_TOKEN_TTL_MS =
  (Number.isFinite(REFRESH_TOKEN_DAYS) && REFRESH_TOKEN_DAYS > 0
    ? REFRESH_TOKEN_DAYS
    : 7) *
  24 *
  60 *
  60 *
  1000

const createRawRefreshToken = (): string =>
  `rt_${randomBytes(48).toString('base64url')}`

const hashRefreshToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex')

const getRefreshTokenExpiresAt = (): Date =>
  new Date(Date.now() + REFRESH_TOKEN_TTL_MS)

const isActiveUser = (user: {
  eliminado?: boolean
  estado?: string
} | null): boolean => Boolean(user && !user.eliminado && user.estado === 'activo')

export interface IssuedRefreshToken {
  refreshToken: string
  refreshTokenExpiresAt: string
  refreshTokenId: string
  familyId: string
}

export interface RotatedRefreshToken extends IssuedRefreshToken {
  user: {
    id: string
    correo: string
  }
}

export type RotateRefreshTokenResult =
  | { ok: true; data: RotatedRefreshToken }
  | {
      ok: false
      reason: 'invalid' | 'expired' | 'revoked' | 'inactive_user'
    }

class RefreshTokenService {
  async issue(userId: string, db: PrismaClientType = prisma): Promise<IssuedRefreshToken> {
    const client = db as PrismaClient
    const refreshToken = createRawRefreshToken()
    const expiresAt = getRefreshTokenExpiresAt()

    const row = await client.refreshToken.create({
      data: {
        userId,
        tokenHash: hashRefreshToken(refreshToken),
        familyId: randomUUID(),
        expiresAt,
      },
    })

    return {
      refreshToken,
      refreshTokenExpiresAt: expiresAt.toISOString(),
      refreshTokenId: row.id,
      familyId: row.familyId,
    }
  }

  async rotate(refreshToken: string): Promise<RotateRefreshTokenResult> {
    const token = typeof refreshToken === 'string' ? refreshToken.trim() : ''
    if (!token) return { ok: false, reason: 'invalid' }

    const tokenHash = hashRefreshToken(token)
    const now = new Date()

    return prisma.$transaction(async (tx) => {
      const existing = await tx.refreshToken.findUnique({
        where: { tokenHash },
        include: {
          user: {
            select: {
              id: true,
              correo: true,
              estado: true,
              eliminado: true,
            },
          },
        },
      })

      if (!existing) return { ok: false as const, reason: 'invalid' as const }

      if (existing.revokedAt) {
        await this.revokeFamily(existing.familyId, tx)
        return { ok: false as const, reason: 'revoked' as const }
      }

      if (existing.expiresAt <= now) {
        await tx.refreshToken.update({
          where: { id: existing.id },
          data: { revokedAt: now },
        })
        return { ok: false as const, reason: 'expired' as const }
      }

      if (!isActiveUser(existing.user)) {
        await this.revokeFamily(existing.familyId, tx)
        return { ok: false as const, reason: 'inactive_user' as const }
      }

      const nextToken = createRawRefreshToken()
      const nextExpiresAt = getRefreshTokenExpiresAt()
      const next = await tx.refreshToken.create({
        data: {
          userId: existing.userId,
          tokenHash: hashRefreshToken(nextToken),
          familyId: existing.familyId,
          expiresAt: nextExpiresAt,
        },
      })

      await tx.refreshToken.update({
        where: { id: existing.id },
        data: {
          revokedAt: now,
          replacedByTokenId: next.id,
        },
      })

      return {
        ok: true as const,
        data: {
          refreshToken: nextToken,
          refreshTokenExpiresAt: nextExpiresAt.toISOString(),
          refreshTokenId: next.id,
          familyId: next.familyId,
          user: {
            id: existing.user.id,
            correo: existing.user.correo,
          },
        },
      }
    })
  }

  async revokeToken(refreshToken: string): Promise<{ revoked: number }> {
    const token = typeof refreshToken === 'string' ? refreshToken.trim() : ''
    if (!token) return { revoked: 0 }

    const result = await prisma.refreshToken.updateMany({
      where: {
        tokenHash: hashRefreshToken(token),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    })

    return { revoked: result.count }
  }

  async revokeActiveForUser(userId: string): Promise<{ revoked: number }> {
    const result = await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    })

    return { revoked: result.count }
  }

  private async revokeFamily(
    familyId: string,
    db: PrismaClientType
  ): Promise<{ revoked: number }> {
    const client = db as PrismaClient
    const result = await client.refreshToken.updateMany({
      where: {
        familyId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    })

    return { revoked: result.count }
  }
}

export default new RefreshTokenService()
