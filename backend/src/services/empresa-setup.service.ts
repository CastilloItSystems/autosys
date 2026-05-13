/**
 * empresa-setup.service.ts
 *
 * Initializes the global Permission catalog and creates default system roles
 * for a newly created (or existing) Empresa. Called on app startup and on
 * empresa creation so the system never ends up in an inconsistent state.
 */

import prisma from './prisma.service.js'
import {
  DEFAULT_SYSTEM_PERMISSIONS_BY_ROLE as SHARED_DEFAULT_SYSTEM_PERMISSIONS_BY_ROLE,
} from '../shared/constants/defaultCompanyRoles.js'
import { PERMISSION_CATALOG } from '../shared/constants/permissionCatalog.js'

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
  'crm.opportunities.view',
  'crm.opportunities.create',
  'crm.opportunities.update',
  'crm.opportunities.delete',
  'crm.campaigns.view',
  'crm.campaigns.create',
  'crm.campaigns.update',
  'crm.campaigns.delete',
  'crm.loyalty.view',
  'crm.loyalty.create',
  'crm.loyalty.update',
  'crm.loyalty.delete',
  'crm.automations.view',
]

const VIEW_CRM = [
  'crm.customers.view',
  'crm.vehicles.view',
  'crm.leads.view',
  'crm.interactions.view',
  'crm.activities.view',
  'crm.quotes.view',
  'crm.cases.view',
  'crm.opportunities.view',
  'crm.campaigns.view',
  'crm.loyalty.view',
  'crm.automations.view',
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

const ALL_DEALER = [
  'dealer.view',
  'dealer.create',
  'dealer.update',
  'dealer.delete',
  'dealer.approve',
]

const ALL_EXCHANGE_RATES = [
  'exchange_rates.view',
  'exchange_rates.create',
  'exchange_rates.update',
  'exchange_rates.delete',
]

const ALL_FINANCE = [
  'finance.view',
  'finance.bank_accounts.view',
  'finance.bank_accounts.manage',
  'finance.supplier_bills.view',
  'finance.supplier_bills.manage',
  'finance.supplier_payments.view',
  'finance.supplier_payments.create',
  'finance.supplier_payments.cancel',
  'finance.expenses.view',
  'finance.expenses.manage',
  'finance.recurring_rules.manage',
  'finance.cash_flow.view',
]

const ALL_COMPANIES = [
  'companies.view',
  'companies.create',
  'companies.update',
  'companies.delete',
]

const ALL_PLATFORM_USERS = [
  'platform_users.view',
  'platform_users.create',
  'platform_users.update',
  'platform_users.delete',
]

const ALL_COMPANY_ROLES = [
  'company_roles.view',
  'company_roles.create',
  'company_roles.update',
  'company_roles.delete',
]

const VIEW_FINANCE = [
  'finance.view',
  'finance.supplier_bills.view',
  'finance.supplier_payments.view',
  'finance.expenses.view',
  'finance.cash_flow.view',
]

const NOTIFICATIONS_VIEW = ['notifications.view']
const NOTIFICATIONS_MODULES_ALL = [
  'inventory.notifications.view',
  'sales.notifications.view',
  'purchases.notifications.view',
  'workshop.notifications.view',
  'crm.notifications.view',
  'dealer.notifications.view',
  'exchange_rates.notifications.view',
  'system.notifications.view',
]
const NOTIFICATIONS_MODULES_NO_SYSTEM = [
  'inventory.notifications.view',
  'sales.notifications.view',
  'purchases.notifications.view',
  'workshop.notifications.view',
  'crm.notifications.view',
  'dealer.notifications.view',
  'exchange_rates.notifications.view',
]
const NOTIFICATIONS_MODULES_VENDEDOR = [
  'sales.notifications.view',
  'crm.notifications.view',
  'inventory.notifications.view',
  'dealer.notifications.view',
]
const NOTIFICATIONS_MODULES_ALMACENISTA = [
  'inventory.notifications.view',
  'purchases.notifications.view',
]
const NOTIFICATIONS_MANAGE = [
  'notifications.view',
  'notifications.manage_policy',
  ...NOTIFICATIONS_MODULES_ALL,
]

// Snapshot historico; los roles activos se sincronizan desde defaultCompanyRoles.ts.
const DEPRECATED_LOCAL_DEFAULT_SYSTEM_PERMISSIONS_BY_ROLE: Record<string, string[]> = {
  OWNER: [
    'users.view',
    'users.create',
    'users.update',
    'users.delete',
    'users.approve',
    ...ALL_PLATFORM_USERS,
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
    'audit.view',
    ...ALL_COMPANIES,
    ...ALL_COMPANY_ROLES,
    ...NOTIFICATIONS_MANAGE,
    ...ALL_CRM,
    'crm.automations.run',
    ...ALL_WORKSHOP,
    ...ALL_DEALER,
    ...ALL_EXCHANGE_RATES,
    ...ALL_FINANCE,
  ],
  ADMIN: [
    'users.view',
    'users.create',
    'users.update',
    'users.approve',
    ...ALL_PLATFORM_USERS,
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
    'audit.view',
    ...ALL_COMPANIES,
    ...ALL_COMPANY_ROLES,
    ...NOTIFICATIONS_MANAGE,
    ...ALL_CRM,
    'crm.automations.run',
    ...ALL_WORKSHOP,
    ...ALL_DEALER,
    ...ALL_EXCHANGE_RATES,
    ...ALL_FINANCE,
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
    'audit.view',
    ...NOTIFICATIONS_MANAGE,
    ...ALL_CRM,
    'crm.automations.run',
    ...ALL_WORKSHOP,
    ...ALL_DEALER,
    ...ALL_EXCHANGE_RATES,
    ...ALL_FINANCE,
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
    'dealer.view',
    'exchange_rates.view',
    ...NOTIFICATIONS_VIEW,
    ...NOTIFICATIONS_MODULES_ALMACENISTA,
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
    'dealer.view',
    'dealer.create',
    'dealer.update',
    'exchange_rates.view',
    ...NOTIFICATIONS_VIEW,
    ...NOTIFICATIONS_MODULES_VENDEDOR,
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
    'dealer.view',
    'exchange_rates.view',
    ...NOTIFICATIONS_VIEW,
    ...NOTIFICATIONS_MODULES_NO_SYSTEM,
    ...VIEW_FINANCE,
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
/**
 * Creates default notification policies for an empresa from the catalog.
 * Uses skipDuplicates so existing customized policies are never overwritten.
 * Safe to call on startup or when a new empresa is created.
 */
export async function seedDefaultNotificationPoliciesForEmpresa(
  empresaId: string
): Promise<void> {
  const { getNotificationCatalog } = await import(
    '../features/notifications/notifications.catalog.js'
  )
  const catalog = getNotificationCatalog()

  const data = catalog.map((item) => ({
    empresaId,
    eventCode: item.eventCode,
    enabled: item.defaultEnabled,
    mandatory: item.defaultMandatory,
    requiredPermissionsAny: item.requiredPermissionsAny,
    dedupWindowSec: item.defaultDedupWindowSec,
    updatedBy: 'SYSTEM',
    updatedByName: 'Sistema',
  }))

  await prisma.notificationCompanyPolicy.createMany({
    data,
    skipDuplicates: true,
  })
}

export async function seedDefaultBankAccountForEmpresa(
  empresaId: string
): Promise<void> {
  await prisma.bankAccount.upsert({
    where: { empresaId_name: { empresaId, name: 'Caja Principal' } },
    update: {},
    create: {
      name: 'Caja Principal',
      type: 'CASH',
      currency: 'USD',
      initialBalance: 0,
      currentBalance: 0,
      isActive: true,
      empresaId,
    },
  })
}

export async function seedDefaultRolesForEmpresa(
  empresaId: string
): Promise<void> {
  // Fetch all permission records once for efficiency
  const allPermissions = await prisma.permission.findMany({
    select: { id: true, code: true },
  })
  const permByCode = new Map(allPermissions.map((p) => [p.code, p.id]))

  for (const [roleName, permissionCodes] of Object.entries(
    SHARED_DEFAULT_SYSTEM_PERMISSIONS_BY_ROLE
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
