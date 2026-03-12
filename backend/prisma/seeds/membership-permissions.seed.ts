// backend/prisma/seeds/membership-permissions.seed.ts
import type { PrismaClient } from '../../src/generated/prisma/client.js'

export async function seedMembershipPermissions(
  prisma: PrismaClient,
  empresaId: string
) {
  const user = await prisma.user.findUnique({
    where: { correo: 'viewer@test.com' },
  })

  if (!user) return

  const membership = await prisma.membership.findUnique({
    where: {
      userId_empresaId: {
        userId: user.id,
        empresaId,
      },
    },
  })

  if (!membership) return

  const permission = await prisma.permission.findUnique({
    where: { code: 'reports.export' },
  })

  if (!permission) return

  await prisma.membershipPermission.upsert({
    where: {
      membershipId_permissionId: {
        membershipId: membership.id,
        permissionId: permission.id,
      },
    },
    update: {
      action: 'GRANT' as any,
      reason: 'Permiso extra para exportar reportes',
    },
    create: {
      membershipId: membership.id,
      permissionId: permission.id,
      action: 'GRANT' as any,
      reason: 'Permiso extra para exportar reportes',
    },
  })

  console.log('✅ Override de permiso creado para viewer@test.com')
}
