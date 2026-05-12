// backend/src/features/sales/shared/userNameResolver.ts
// Uses base prisma directly — users are global (no empresaId), tenant client not needed.

import prisma from '../../../services/prisma.service.js'

export async function resolveUserNames(
  _db: unknown,
  userIds: (string | null | undefined)[]
): Promise<Map<string, string>> {
  const ids = [...new Set(userIds.filter((id): id is string => Boolean(id)))]
  if (ids.length === 0) return new Map()

  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, nombre: true, correo: true },
  })

  const map = new Map<string, string>()
  for (const u of users) {
    map.set(u.id, u.nombre || u.correo)
  }
  return map
}
