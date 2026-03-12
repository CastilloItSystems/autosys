// backend/prisma/seeds/roles.seed.ts
import type { PrismaClient } from '../../src/generated/prisma/client.js'

const ALL_USERS = [
  'users.view',
  'users.create',
  'users.update',
  'users.delete',
  'users.approve',
] as const
const ALL_INVENTORY = [
  'inventory.view',
  'inventory.create',
  'inventory.update',
  'inventory.delete',
  'inventory.approve',
] as const
const ALL_ITEMS = [
  'items.view',
  'items.create',
  'items.update',
  'items.delete',
  'items.approve',
] as const
const ALL_WAREHOUSES = [
  'warehouses.view',
  'warehouses.create',
  'warehouses.update',
  'warehouses.delete',
  'warehouses.approve',
] as const
const ALL_STOCK = [
  'stock.view',
  'stock.adjust',
  'stock.transfer',
  'stock.approve',
] as const
const ALL_MOVEMENTS = [
  'movements.view',
  'movements.create',
  'movements.update',
  'movements.delete',
  'movements.approve',
] as const
const ALL_LOANS = [
  'loans.view',
  'loans.create',
  'loans.update',
  'loans.delete',
  'loans.approve',
] as const
const ALL_TRANSFERS = [
  'transfers.view',
  'transfers.create',
  'transfers.update',
  'transfers.delete',
  'transfers.approve',
] as const
const ALL_CUSTOMERS = [
  'customers.view',
  'customers.create',
  'customers.update',
  'customers.delete',
  'customers.approve',
] as const
const ALL_ORDERS = [
  'orders.view',
  'orders.create',
  'orders.update',
  'orders.delete',
  'orders.approve',
] as const
const ALL_INVOICES = [
  'invoices.view',
  'invoices.create',
  'invoices.update',
  'invoices.delete',
  'invoices.approve',
] as const
const ALL_QUOTES = [
  'quotes.view',
  'quotes.create',
  'quotes.update',
  'quotes.delete',
  'quotes.approve',
] as const
const ALL_PAYMENTS = [
  'payments.view',
  'payments.create',
  'payments.update',
  'payments.delete',
  'payments.approve',
] as const
const ALL_REPORTS = [
  'reports.view',
  'reports.export',
  'reports.approve',
] as const

const ROLE_DEFINITIONS = {
  OWNER: [
    ...ALL_USERS,
    ...ALL_INVENTORY,
    ...ALL_ITEMS,
    ...ALL_WAREHOUSES,
    ...ALL_STOCK,
    ...ALL_MOVEMENTS,
    ...ALL_LOANS,
    ...ALL_TRANSFERS,
    ...ALL_CUSTOMERS,
    ...ALL_ORDERS,
    ...ALL_INVOICES,
    ...ALL_QUOTES,
    ...ALL_PAYMENTS,
    ...ALL_REPORTS,
  ],
  ADMIN: [
    'users.view',
    'users.create',
    'users.update',
    'users.approve',
    ...ALL_INVENTORY,
    ...ALL_ITEMS,
    ...ALL_WAREHOUSES,
    ...ALL_STOCK,
    ...ALL_MOVEMENTS,
    ...ALL_LOANS,
    ...ALL_TRANSFERS,
    ...ALL_CUSTOMERS,
    ...ALL_ORDERS,
    ...ALL_INVOICES,
    ...ALL_QUOTES,
    ...ALL_PAYMENTS,
    ...ALL_REPORTS,
  ],
  GERENTE: [
    'users.view',
    ...ALL_INVENTORY,
    ...ALL_ITEMS,
    'warehouses.view',
    'warehouses.create',
    'warehouses.update',
    'warehouses.approve',
    ...ALL_STOCK,
    ...ALL_MOVEMENTS,
    ...ALL_LOANS,
    ...ALL_TRANSFERS,
    ...ALL_CUSTOMERS,
    ...ALL_ORDERS,
    ...ALL_INVOICES,
    ...ALL_QUOTES,
    ...ALL_PAYMENTS,
    ...ALL_REPORTS,
  ],
  ALMACENISTA: [
    'inventory.view',
    'inventory.create',
    'inventory.update',
    'inventory.approve',
    'items.view',
    'items.create',
    'items.update',
    'warehouses.view',
    'stock.view',
    'stock.adjust',
    'stock.transfer',
    'movements.view',
    'movements.create',
    'movements.update',
    'loans.view',
    'loans.create',
    'loans.update',
    'transfers.view',
    'transfers.create',
    'transfers.update',
  ],
  VENDEDOR: [
    'inventory.view',
    'items.view',
    'warehouses.view',
    'stock.view',
    ...ALL_CUSTOMERS,
    ...ALL_ORDERS,
    ...ALL_INVOICES,
    ...ALL_QUOTES,
    ...ALL_PAYMENTS,
    'reports.view',
  ],
  VIEWER: [
    'users.view',
    'inventory.view',
    'items.view',
    'warehouses.view',
    'stock.view',
    'movements.view',
    'loans.view',
    'transfers.view',
    'customers.view',
    'orders.view',
    'invoices.view',
    'quotes.view',
    'payments.view',
    'reports.view',
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
