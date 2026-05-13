import type { PrismaClient } from '../../src/generated/prisma/client.js'
import { PERMISSION_CATALOG } from '../../src/shared/constants/permissionCatalog.js'

export const PERMISSIONS = PERMISSION_CATALOG

export default async function seedPermissions(prisma: PrismaClient) {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: { description: permission.description },
      create: permission,
    })
  }

  console.log(`✅ ${PERMISSIONS.length} permisos sembrados`)
}
