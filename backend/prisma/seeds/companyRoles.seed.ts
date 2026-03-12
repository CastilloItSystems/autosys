import type { PrismaClient } from '../../src/generated/prisma/client.js'

const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: [
    'empresas.read',
    'empresas.create',
    'empresas.update',
    'empresas.delete',
    'empresas.approve',

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
    'empresas.read',
    'empresas.create',
    'empresas.update',
    'empresas.approve',

    'users.read',
    'users.create',
    'users.update',
    'users.approve',

    'roles.read',
    'roles.create',
    'roles.update',

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
    'invoices.update',
  ],

  ALMACENISTA: [
    'inventory.read',
    'inventory.create',
    'inventory.update',
    'inventory.approve',

    'suppliers.read',
    'suppliers.create',
    'suppliers.update',
  ],

  VIEWER: [
    'users.read',
    'roles.read',
    'inventory.read',
    'customers.read',
    'suppliers.read',
    'orders.read',
    'invoices.read',
    'reports.read',
    'settings.read',
  ],
}

export default async function seedCompanyRoles(
  prisma: PrismaClient,
  empresaId: string
) {
  try {
    for (const [roleName, permissionCodes] of Object.entries(
      ROLE_PERMISSIONS
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

      for (const code of permissionCodes) {
        const permission = await prisma.permission.findUnique({
          where: { code },
        })

        if (!permission) {
          console.warn(`⚠️ Permission not found: ${code}`)
          continue
        }

        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
          },
        })
      }

      console.log(`✅ Role created: ${role.name}`)
    }

    console.log('✅ Company roles seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding company roles:', error)
    throw error
  }
}
