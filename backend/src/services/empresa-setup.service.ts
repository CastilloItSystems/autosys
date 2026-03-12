/**
 * empresa-setup.service.ts
 *
 * Initializes the global Permission catalog and creates default system roles
 * for a newly created (or existing) Empresa. Called on app startup and on
 * empresa creation so the system never ends up in an inconsistent state.
 */

import prisma from './prisma.service.js'

// ── Global permission catalog ──────────────────────────────────────────────

export const PERMISSION_CATALOG = [
  // Usuarios
  { code: 'users.view', description: 'Ver usuarios' },
  { code: 'users.create', description: 'Crear usuarios' },
  { code: 'users.update', description: 'Actualizar usuarios' },
  { code: 'users.delete', description: 'Eliminar usuarios' },
  { code: 'users.approve', description: 'Aprobar acciones de usuarios' },

  // Inventario (catálogos, notas entrada/salida, ajustes, conteos cíclicos)
  { code: 'inventory.view', description: 'Ver inventario' },
  { code: 'inventory.create', description: 'Crear registros de inventario' },
  { code: 'inventory.update', description: 'Actualizar inventario' },
  { code: 'inventory.delete', description: 'Eliminar registros de inventario' },
  {
    code: 'inventory.approve',
    description: 'Aprobar movimientos de inventario',
  },

  // Artículos
  { code: 'items.view', description: 'Ver artículos' },
  { code: 'items.create', description: 'Crear artículos' },
  { code: 'items.update', description: 'Actualizar artículos' },
  { code: 'items.delete', description: 'Eliminar artículos' },
  { code: 'items.approve', description: 'Aprobar cambios en artículos' },

  // Almacenes
  { code: 'warehouses.view', description: 'Ver almacenes' },
  { code: 'warehouses.create', description: 'Crear almacenes' },
  { code: 'warehouses.update', description: 'Actualizar almacenes' },
  { code: 'warehouses.delete', description: 'Eliminar almacenes' },
  { code: 'warehouses.approve', description: 'Aprobar cambios en almacenes' },

  // Stock
  { code: 'stock.view', description: 'Ver stock' },
  { code: 'stock.adjust', description: 'Ajustar stock manualmente' },
  { code: 'stock.transfer', description: 'Transferir stock entre almacenes' },
  { code: 'stock.approve', description: 'Aprobar ajustes de stock' },

  // Movimientos
  { code: 'movements.view', description: 'Ver movimientos' },
  { code: 'movements.create', description: 'Registrar movimientos' },
  { code: 'movements.update', description: 'Corregir movimientos' },
  { code: 'movements.delete', description: 'Eliminar movimientos' },
  { code: 'movements.approve', description: 'Aprobar movimientos' },

  // Préstamos
  { code: 'loans.view', description: 'Ver préstamos de inventario' },
  { code: 'loans.create', description: 'Crear préstamos' },
  { code: 'loans.update', description: 'Actualizar préstamos' },
  { code: 'loans.delete', description: 'Eliminar préstamos' },
  { code: 'loans.approve', description: 'Aprobar/rechazar préstamos' },

  // Transferencias
  { code: 'transfers.view', description: 'Ver transferencias de stock' },
  { code: 'transfers.create', description: 'Crear transferencias' },
  { code: 'transfers.update', description: 'Actualizar transferencias' },
  { code: 'transfers.delete', description: 'Eliminar transferencias' },
  { code: 'transfers.approve', description: 'Aprobar/rechazar transferencias' },

  // Clientes
  { code: 'customers.view', description: 'Ver clientes' },
  { code: 'customers.create', description: 'Crear clientes' },
  { code: 'customers.update', description: 'Actualizar clientes' },
  { code: 'customers.delete', description: 'Eliminar clientes' },
  { code: 'customers.approve', description: 'Aprobar cambios en clientes' },

  // Órdenes de venta
  { code: 'orders.view', description: 'Ver órdenes' },
  { code: 'orders.create', description: 'Crear órdenes' },
  { code: 'orders.update', description: 'Actualizar órdenes' },
  { code: 'orders.delete', description: 'Eliminar órdenes' },
  { code: 'orders.approve', description: 'Aprobar/rechazar órdenes' },

  // Facturas
  { code: 'invoices.view', description: 'Ver facturas' },
  { code: 'invoices.create', description: 'Crear facturas' },
  { code: 'invoices.update', description: 'Actualizar facturas' },
  { code: 'invoices.delete', description: 'Eliminar facturas' },
  { code: 'invoices.approve', description: 'Aprobar/rechazar facturas' },

  // Cotizaciones
  { code: 'quotes.view', description: 'Ver cotizaciones' },
  { code: 'quotes.create', description: 'Crear cotizaciones' },
  { code: 'quotes.update', description: 'Actualizar cotizaciones' },
  { code: 'quotes.delete', description: 'Eliminar cotizaciones' },
  { code: 'quotes.approve', description: 'Aprobar cotizaciones' },

  // Pagos
  { code: 'payments.view', description: 'Ver pagos' },
  { code: 'payments.create', description: 'Registrar pagos' },
  { code: 'payments.update', description: 'Actualizar pagos' },
  { code: 'payments.delete', description: 'Eliminar pagos' },
  { code: 'payments.approve', description: 'Aprobar pagos' },

  // Reportes
  { code: 'reports.view', description: 'Ver reportes' },
  { code: 'reports.export', description: 'Exportar reportes' },
  { code: 'reports.approve', description: 'Aprobar publicación de reportes' },
]

// ── Default system roles per empresa ──────────────────────────────────────

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: [
    'users.view',
    'users.create',
    'users.update',
    'users.delete',
    'users.approve',
    'inventory.view',
    'inventory.create',
    'inventory.update',
    'inventory.delete',
    'inventory.approve',
    'items.view',
    'items.create',
    'items.update',
    'items.delete',
    'items.approve',
    'warehouses.view',
    'warehouses.create',
    'warehouses.update',
    'warehouses.delete',
    'warehouses.approve',
    'stock.view',
    'stock.adjust',
    'stock.transfer',
    'stock.approve',
    'movements.view',
    'movements.create',
    'movements.update',
    'movements.delete',
    'movements.approve',
    'loans.view',
    'loans.create',
    'loans.update',
    'loans.delete',
    'loans.approve',
    'transfers.view',
    'transfers.create',
    'transfers.update',
    'transfers.delete',
    'transfers.approve',
    'customers.view',
    'customers.create',
    'customers.update',
    'customers.delete',
    'customers.approve',
    'orders.view',
    'orders.create',
    'orders.update',
    'orders.delete',
    'orders.approve',
    'invoices.view',
    'invoices.create',
    'invoices.update',
    'invoices.delete',
    'invoices.approve',
    'quotes.view',
    'quotes.create',
    'quotes.update',
    'quotes.delete',
    'quotes.approve',
    'payments.view',
    'payments.create',
    'payments.update',
    'payments.delete',
    'payments.approve',
    'reports.view',
    'reports.export',
    'reports.approve',
  ],
  ADMIN: [
    'users.view',
    'users.create',
    'users.update',
    'users.approve',
    'inventory.view',
    'inventory.create',
    'inventory.update',
    'inventory.delete',
    'inventory.approve',
    'items.view',
    'items.create',
    'items.update',
    'items.delete',
    'items.approve',
    'warehouses.view',
    'warehouses.create',
    'warehouses.update',
    'warehouses.delete',
    'warehouses.approve',
    'stock.view',
    'stock.adjust',
    'stock.transfer',
    'stock.approve',
    'movements.view',
    'movements.create',
    'movements.update',
    'movements.delete',
    'movements.approve',
    'loans.view',
    'loans.create',
    'loans.update',
    'loans.delete',
    'loans.approve',
    'transfers.view',
    'transfers.create',
    'transfers.update',
    'transfers.delete',
    'transfers.approve',
    'customers.view',
    'customers.create',
    'customers.update',
    'customers.delete',
    'customers.approve',
    'orders.view',
    'orders.create',
    'orders.update',
    'orders.delete',
    'orders.approve',
    'invoices.view',
    'invoices.create',
    'invoices.update',
    'invoices.delete',
    'invoices.approve',
    'quotes.view',
    'quotes.create',
    'quotes.update',
    'quotes.delete',
    'quotes.approve',
    'payments.view',
    'payments.create',
    'payments.update',
    'payments.delete',
    'payments.approve',
    'reports.view',
    'reports.export',
    'reports.approve',
  ],
  GERENTE: [
    'users.view',
    'inventory.view',
    'inventory.create',
    'inventory.update',
    'inventory.delete',
    'inventory.approve',
    'items.view',
    'items.create',
    'items.update',
    'items.delete',
    'items.approve',
    'warehouses.view',
    'warehouses.create',
    'warehouses.update',
    'warehouses.approve',
    'stock.view',
    'stock.adjust',
    'stock.transfer',
    'stock.approve',
    'movements.view',
    'movements.create',
    'movements.update',
    'movements.delete',
    'movements.approve',
    'loans.view',
    'loans.create',
    'loans.update',
    'loans.delete',
    'loans.approve',
    'transfers.view',
    'transfers.create',
    'transfers.update',
    'transfers.delete',
    'transfers.approve',
    'customers.view',
    'customers.create',
    'customers.update',
    'customers.delete',
    'customers.approve',
    'orders.view',
    'orders.create',
    'orders.update',
    'orders.delete',
    'orders.approve',
    'invoices.view',
    'invoices.create',
    'invoices.update',
    'invoices.delete',
    'invoices.approve',
    'quotes.view',
    'quotes.create',
    'quotes.update',
    'quotes.delete',
    'quotes.approve',
    'payments.view',
    'payments.create',
    'payments.update',
    'payments.delete',
    'payments.approve',
    'reports.view',
    'reports.export',
    'reports.approve',
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
    'customers.view',
    'customers.create',
    'customers.update',
    'customers.delete',
    'customers.approve',
    'orders.view',
    'orders.create',
    'orders.update',
    'orders.delete',
    'orders.approve',
    'invoices.view',
    'invoices.create',
    'invoices.update',
    'invoices.delete',
    'invoices.approve',
    'quotes.view',
    'quotes.create',
    'quotes.update',
    'quotes.delete',
    'quotes.approve',
    'payments.view',
    'payments.create',
    'payments.update',
    'payments.delete',
    'payments.approve',
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
}

// ── Public helpers ─────────────────────────────────────────────────────────

/**
 * Ensures the global Permission catalog is present in the database.
 * Safe to call multiple times — uses upsert (idempotent).
 */
export async function ensurePermissionCatalog(): Promise<void> {
  for (const perm of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { description: perm.description },
      create: perm,
    })
  }
}

/**
 * Creates (or re-syncs) the default system roles for an empresa.
 * Requires the Permission catalog to already exist — call
 * `ensurePermissionCatalog()` first if unsure.
 *
 * Safe to call on existing empresas: roles are upserted and their
 * permissions are fully replaced each time (re-sync).
 */
export async function seedDefaultRolesForEmpresa(
  empresaId: string
): Promise<void> {
  // Fetch all permission records once for efficiency
  const allPermissions = await prisma.permission.findMany({
    select: { id: true, code: true },
  })
  const permByCode = new Map(allPermissions.map((p) => [p.code, p.id]))

  for (const [roleName, permissionCodes] of Object.entries(
    DEFAULT_ROLE_PERMISSIONS
  )) {
    const role = await prisma.companyRole.upsert({
      where: { name_empresaId: { name: roleName, empresaId } },
      update: { description: `Rol ${roleName}`, isSystem: true },
      create: {
        name: roleName,
        description: `Rol ${roleName}`,
        empresaId,
        isSystem: true,
      },
    })

    // Re-sync permissions (delete all, recreate)
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })

    const permissionData = permissionCodes
      .filter((code) => permByCode.has(code))
      .map((code) => ({ roleId: role.id, permissionId: permByCode.get(code)! }))

    if (permissionData.length > 0) {
      await prisma.rolePermission.createMany({ data: permissionData })
    }
  }
}
