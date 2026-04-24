import { PrismaClient, Prisma } from '../../generated/prisma/client.js'
import { resolveMembershipPermissions } from '../../shared/utils/resolvePermissions.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

export interface CachedMembership {
  membershipId: string
  userId: string
  permissions: Set<string>
}

interface CacheEntry {
  memberships: CachedMembership[]
  expiresAt: number
}

const TTL_MS = 60_000
const cache = new Map<string, CacheEntry>()

export async function getActiveMembershipsWithPermissions(
  empresaId: string,
  db: PrismaClientType
): Promise<CachedMembership[]> {
  const now = Date.now()
  const cached = cache.get(empresaId)
  if (cached && cached.expiresAt > now) return cached.memberships

  const client = db as PrismaClient
  const rows = await client.membership.findMany({
    where: {
      empresaId,
      status: 'active',
      user: { eliminado: false, estado: 'activo' },
    },
    include: {
      role: {
        include: {
          permissions: { include: { permission: { select: { code: true } } } },
        },
      },
      permissions: { include: { permission: { select: { code: true } } } },
    },
  })

  const memberships: CachedMembership[] = rows.map((m) => ({
    membershipId: m.id,
    userId: m.userId,
    permissions: new Set(
      resolveMembershipPermissions(m.role.permissions, m.permissions)
    ),
  }))

  cache.set(empresaId, { memberships, expiresAt: now + TTL_MS })
  return memberships
}

export function invalidateMembershipsCache(empresaId?: string): void {
  if (empresaId) cache.delete(empresaId)
  else cache.clear()
}
