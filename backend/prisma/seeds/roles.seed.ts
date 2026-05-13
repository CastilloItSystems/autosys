// backend/prisma/seeds/roles.seed.ts
import type { PrismaClient } from '../../src/generated/prisma/client.js'
import { DEFAULT_SYSTEM_PERMISSIONS_BY_ROLE } from '../../src/shared/constants/defaultCompanyRoles.js'

export async function seedRoles(prisma: PrismaClient, empresaId: string) {
  for (const [roleName, permissionCodes] of Object.entries(
    DEFAULT_SYSTEM_PERMISSIONS_BY_ROLE
  )) {
    const role = await prisma.companyRole.upsert({
      where: {
        name_empresaId: {
          name: roleName,
          empresaId,
        },
      },
      update: {
        description: `Rol ${roleName}`,
        isSystem: true,
      },
      create: {
        name: roleName,
        description: `Rol ${roleName}`,
        empresaId,
        isSystem: true,
      },
    })

    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    })

    const permissions = await prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
      select: { id: true },
    })

    if (permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId: role.id,
          permissionId: permission.id,
        })),
      })
    }
  }
}
