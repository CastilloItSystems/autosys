// backend/prisma/seeds/roles.seed.ts
import type { PrismaClient } from '../../src/generated/prisma/client.js'

const ROLE_DEFINITIONS = {
  OWNER: [
    'users.read',
    'users.create',
    'users.update',
    'users.delete',
    'users.approve',
    'roles.read',
    'roles.create',
    'roles.update',
    'roles.delete',
    'roles.approve',
    'inventory.read',
    'inventory.create',
    'inventory.update',
    'inventory.delete',
    'inventory.approve',
    'customers.read',
    'customers.create',
    'customers.update',
    'customers.delete',
    'customers.approve',
    'suppliers.read',
    'suppliers.create',
    'suppliers.update',
    'suppliers.delete',
    'suppliers.approve',
    'orders.read',
    'orders.create',
    'orders.update',
    'orders.delete',
    'orders.approve',
    'invoices.read',
    'invoices.create',
    'invoices.update',
    'invoices.delete',
    'invoices.approve',
    'reports.read',
    'reports.export',
    'reports.approve',
    'settings.read',
    'settings.update',
    'settings.approve',
  ],
  ADMIN: [
    'users.read',
    'users.create',
    'users.update',
    'users.approve',
    'roles.read',
    'inventory.read',
    'inventory.create',
    'inventory.update',
    'inventory.delete',
    'inventory.approve',
    'customers.read',
    'customers.create',
    'customers.update',
    'customers.delete',
    'customers.approve',
    'suppliers.read',
    'suppliers.create',
    'suppliers.update',
    'suppliers.delete',
    'suppliers.approve',
    'orders.read',
    'orders.create',
    'orders.update',
    'orders.delete',
    'orders.approve',
    'invoices.read',
    'invoices.create',
    'invoices.update',
    'invoices.delete',
    'invoices.approve',
    'reports.read',
    'reports.export',
    'reports.approve',
    'settings.read',
  ],
  GERENTE: [
    'users.read',
    'inventory.read',
    'inventory.create',
    'inventory.update',
    'inventory.approve',
    'customers.read',
    'customers.create',
    'customers.update',
    'customers.approve',
    'suppliers.read',
    'suppliers.create',
    'suppliers.update',
    'suppliers.approve',
    'orders.read',
    'orders.create',
    'orders.update',
    'orders.approve',
    'invoices.read',
    'invoices.create',
    'invoices.update',
    'invoices.approve',
    'reports.read',
    'reports.export',
    'reports.approve',
  ],
  VENDEDOR: [
    'inventory.read',
    'customers.read',
    'customers.create',
    'customers.update',
    'orders.read',
    'orders.create',
    'orders.update',
    'invoices.read',
    'invoices.create',
  ],
  ALMACENISTA: [
    'inventory.read',
    'inventory.create',
    'inventory.update',
    'suppliers.read',
    'suppliers.create',
    'suppliers.update',
  ],
  VIEWER: [
    'inventory.read',
    'customers.read',
    'suppliers.read',
    'orders.read',
    'invoices.read',
    'reports.read',
    'settings.read',
  ],
} as const

export async function seedRoles(prisma: PrismaClient, empresaId: string) {
  for (const [roleName, permissionCodes] of Object.entries(ROLE_DEFINITIONS)) {
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

    // borrar permisos previos del rol para resincronizar
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    })

    for (const code of permissionCodes) {
      const permission = await prisma.permission.findUnique({
        where: { code },
      })

      if (!permission) continue

      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
        },
      })
    }

    console.log(
      `✅ Rol ${roleName} sembrado con ${permissionCodes.length} permisos`
    )
  }
}
