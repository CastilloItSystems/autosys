import type { PrismaClient } from '../../src/generated/prisma/client.js'
import { DEFAULT_SYSTEM_PERMISSIONS_BY_ROLE } from '../../src/shared/constants/defaultCompanyRoles.js'

export default async function seedCompanyRoles(
  prisma: PrismaClient,
  empresaId: string
) {
  try {
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
        select: { id: true, code: true },
      })

      const foundCodes = new Set(permissions.map((permission) => permission.code))
      const missingCodes = permissionCodes.filter((code) => !foundCodes.has(code))

      if (missingCodes.length > 0) {
        console.warn(
          `⚠️ Missing permissions for role ${roleName}: ${missingCodes.join(', ')}`
        )
      }

      if (permissions.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: role.id,
            permissionId: permission.id,
          })),
        })
      }

      console.log(`✅ Company role synced: ${roleName}`)
    }

    console.log('✅ Company roles seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding company roles:', error)
    throw error
  }
}
