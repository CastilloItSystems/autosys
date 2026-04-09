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

  // CRM: Clientes
  { code: 'crm.customers.view', description: 'Ver clientes CRM' },
  { code: 'crm.customers.create', description: 'Crear clientes CRM' },
  { code: 'crm.customers.update', description: 'Actualizar clientes CRM' },
  { code: 'crm.customers.delete', description: 'Eliminar clientes CRM' },

  // CRM: Vehículos del cliente
  { code: 'crm.vehicles.view', description: 'Ver vehículos de clientes' },
  { code: 'crm.vehicles.create', description: 'Registrar vehículos de clientes' },
  { code: 'crm.vehicles.update', description: 'Actualizar vehículos de clientes' },
  { code: 'crm.vehicles.delete', description: 'Eliminar vehículos de clientes' },

  // CRM: Leads / Oportunidades
  { code: 'crm.leads.view', description: 'Ver leads y oportunidades' },
  { code: 'crm.leads.create', description: 'Crear leads y oportunidades' },
  { code: 'crm.leads.update', description: 'Actualizar leads y oportunidades' },
  { code: 'crm.leads.delete', description: 'Eliminar leads y oportunidades' },

  // CRM: Interacciones
  { code: 'crm.interactions.view', description: 'Ver interacciones con clientes' },
  { code: 'crm.interactions.create', description: 'Registrar interacciones con clientes' },
  { code: 'crm.interactions.update', description: 'Actualizar interacciones con clientes' },
  { code: 'crm.interactions.delete', description: 'Eliminar interacciones con clientes' },

  // CRM: Actividades / Seguimientos
  { code: 'crm.activities.view', description: 'Ver actividades CRM' },
  { code: 'crm.activities.create', description: 'Crear actividades CRM' },
  { code: 'crm.activities.update', description: 'Actualizar actividades CRM' },
  { code: 'crm.activities.delete', description: 'Eliminar actividades CRM' },

  // CRM: Cotizaciones
  { code: 'crm.quotes.view', description: 'Ver cotizaciones CRM' },
  { code: 'crm.quotes.create', description: 'Crear cotizaciones CRM' },
  { code: 'crm.quotes.update', description: 'Actualizar cotizaciones CRM' },
  { code: 'crm.quotes.delete', description: 'Eliminar cotizaciones CRM' },

  // CRM: Casos / Reclamos
  { code: 'crm.cases.view', description: 'Ver casos y reclamos CRM' },
  { code: 'crm.cases.create', description: 'Crear casos y reclamos CRM' },
  { code: 'crm.cases.update', description: 'Actualizar casos y reclamos CRM' },
  { code: 'crm.cases.delete', description: 'Eliminar casos y reclamos CRM' },

  // Taller
  { code: 'workshop.view', description: 'Ver órdenes de taller' },
  { code: 'workshop.create', description: 'Crear órdenes de taller' },
  { code: 'workshop.update', description: 'Actualizar órdenes de taller' },
  { code: 'workshop.delete', description: 'Eliminar órdenes de taller' },
]

// ── Default system roles per empresa ──────────────────────────────────────

const ALL_CRM = [
  'crm.customers.view',
  'crm.customers.create',
  'crm.customers.update',
  'crm.customers.delete',
  'crm.vehicles.view',
  'crm.vehicles.create',
  'crm.vehicles.update',
  'crm.vehicles.delete',
  'crm.leads.view',
  'crm.leads.create',
  'crm.leads.update',
  'crm.leads.delete',
  'crm.interactions.view',
  'crm.interactions.create',
  'crm.interactions.update',
  'crm.interactions.delete',
  'crm.activities.view',
  'crm.activities.create',
  'crm.activities.update',
  'crm.activities.delete',
  'crm.quotes.view',
  'crm.quotes.create',
  'crm.quotes.update',
  'crm.quotes.delete',
  'crm.cases.view',
  'crm.cases.create',
  'crm.cases.update',
  'crm.cases.delete',
]

const VIEW_CRM = [
  'crm.customers.view',
  'crm.vehicles.view',
  'crm.leads.view',
  'crm.interactions.view',
  'crm.activities.view',
  'crm.quotes.view',
  'crm.cases.view',
]

const CRM_QUOTES_VENDEDOR = [
  'crm.quotes.view',
  'crm.quotes.create',
  'crm.quotes.update',
]

const CRM_CASES_VENDEDOR = [
  'crm.cases.view',
  'crm.cases.create',
  'crm.cases.update',
]

const ALL_WORKSHOP = [
  'workshop.view',
  'workshop.create',
  'workshop.update',
  'workshop.delete',
]

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
    ...ALL_CRM,
    ...ALL_WORKSHOP,
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
    ...ALL_CRM,
    ...ALL_WORKSHOP,
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
    ...ALL_CRM,
    ...ALL_WORKSHOP,
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
    // Taller: técnicos operan órdenes
    'workshop.view',
    'workshop.create',
    'workshop.update',
    // CRM Cotizaciones
    ...CRM_QUOTES_VENDEDOR,
    // CRM Casos
    ...CRM_CASES_VENDEDOR,
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
    ...ALL_CRM,
    'workshop.view',
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
    ...VIEW_CRM,
    'workshop.view',
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
