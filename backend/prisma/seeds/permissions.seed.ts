import type { PrismaClient } from '../../src/generated/prisma/client.js'

export const PERMISSIONS = [
  { code: 'users.read', description: 'Ver usuarios' },
  { code: 'users.create', description: 'Crear usuarios' },
  { code: 'users.update', description: 'Actualizar usuarios' },
  { code: 'users.delete', description: 'Eliminar usuarios' },
  { code: 'users.approve', description: 'Aprobar usuarios' },

  { code: 'roles.read', description: 'Ver roles' },
  { code: 'roles.create', description: 'Crear roles' },
  { code: 'roles.update', description: 'Actualizar roles' },
  { code: 'roles.delete', description: 'Eliminar roles' },
  { code: 'roles.approve', description: 'Aprobar roles' },

  { code: 'inventory.read', description: 'Ver inventario' },
  { code: 'inventory.create', description: 'Crear inventario' },
  { code: 'inventory.update', description: 'Actualizar inventario' },
  { code: 'inventory.delete', description: 'Eliminar inventario' },
  { code: 'inventory.approve', description: 'Aprobar inventario' },

  { code: 'customers.read', description: 'Ver clientes' },
  { code: 'customers.create', description: 'Crear clientes' },
  { code: 'customers.update', description: 'Actualizar clientes' },
  { code: 'customers.delete', description: 'Eliminar clientes' },
  { code: 'customers.approve', description: 'Aprobar clientes' },

  { code: 'suppliers.read', description: 'Ver proveedores' },
  { code: 'suppliers.create', description: 'Crear proveedores' },
  { code: 'suppliers.update', description: 'Actualizar proveedores' },
  { code: 'suppliers.delete', description: 'Eliminar proveedores' },
  { code: 'suppliers.approve', description: 'Aprobar proveedores' },

  { code: 'orders.read', description: 'Ver pedidos' },
  { code: 'orders.create', description: 'Crear pedidos' },
  { code: 'orders.update', description: 'Actualizar pedidos' },
  { code: 'orders.delete', description: 'Eliminar pedidos' },
  { code: 'orders.approve', description: 'Aprobar pedidos' },

  { code: 'invoices.read', description: 'Ver facturas' },
  { code: 'invoices.create', description: 'Crear facturas' },
  { code: 'invoices.update', description: 'Actualizar facturas' },
  { code: 'invoices.delete', description: 'Eliminar facturas' },
  { code: 'invoices.approve', description: 'Aprobar facturas' },

  { code: 'reports.read', description: 'Ver reportes' },
  { code: 'reports.export', description: 'Exportar reportes' },
  { code: 'reports.approve', description: 'Aprobar reportes' },

  { code: 'settings.read', description: 'Ver configuración' },
  { code: 'settings.update', description: 'Actualizar configuración' },
  { code: 'settings.approve', description: 'Aprobar configuración' },
]

export default async function seedPermissions(prisma: PrismaClient) {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        description: permission.description,
      },
      create: {
        code: permission.code,
        description: permission.description,
      },
    })
  }

  console.log(`✅ ${PERMISSIONS.length} permisos sembrados`)
}
