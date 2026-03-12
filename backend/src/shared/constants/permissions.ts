// backend/src/shared/constants/permissions.ts

export const PERMISSIONS = {
  EMPRESAS_READ: 'empresas.read',
  EMPRESAS_CREATE: 'empresas.create',
  EMPRESAS_UPDATE: 'empresas.update',
  EMPRESAS_DELETE: 'empresas.delete',
  EMPRESAS_APPROVE: 'empresas.approve',

  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_APPROVE: 'users.approve',

  ROLES_READ: 'roles.read',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  ROLES_APPROVE: 'roles.approve',

  INVENTORY_READ: 'inventory.read',
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_UPDATE: 'inventory.update',
  INVENTORY_DELETE: 'inventory.delete',
  INVENTORY_APPROVE: 'inventory.approve',

  CUSTOMERS_READ: 'customers.read',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_UPDATE: 'customers.update',
  CUSTOMERS_DELETE: 'customers.delete',
  CUSTOMERS_APPROVE: 'customers.approve',

  SUPPLIERS_READ: 'suppliers.read',
  SUPPLIERS_CREATE: 'suppliers.create',
  SUPPLIERS_UPDATE: 'suppliers.update',
  SUPPLIERS_DELETE: 'suppliers.delete',
  SUPPLIERS_APPROVE: 'suppliers.approve',

  ORDERS_READ: 'orders.read',
  ORDERS_CREATE: 'orders.create',
  ORDERS_UPDATE: 'orders.update',
  ORDERS_DELETE: 'orders.delete',
  ORDERS_APPROVE: 'orders.approve',

  INVOICES_READ: 'invoices.read',
  INVOICES_CREATE: 'invoices.create',
  INVOICES_UPDATE: 'invoices.update',
  INVOICES_DELETE: 'invoices.delete',
  INVOICES_APPROVE: 'invoices.approve',

  REPORTS_READ: 'reports.read',
  REPORTS_EXPORT: 'reports.export',
  REPORTS_APPROVE: 'reports.approve',

  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update',
  SETTINGS_APPROVE: 'settings.approve',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
