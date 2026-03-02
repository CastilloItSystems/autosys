// backend/src/shared/constants/permissions.ts

export const PERMISSIONS = {
  // Inventory
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_CREATE: 'inventory:create',
  INVENTORY_UPDATE: 'inventory:update',
  INVENTORY_DELETE: 'inventory:delete',

  // Items
  ITEMS_VIEW: 'items:view',
  ITEMS_CREATE: 'items:create',
  ITEMS_UPDATE: 'items:update',
  ITEMS_DELETE: 'items:delete',

  // Warehouses
  WAREHOUSES_VIEW: 'warehouses:view',
  WAREHOUSES_CREATE: 'warehouses:create',
  WAREHOUSES_UPDATE: 'warehouses:update',
  WAREHOUSES_DELETE: 'warehouses:delete',

  // Movements
  MOVEMENTS_VIEW: 'movements:view',
  MOVEMENTS_CREATE: 'movements:create',
  MOVEMENTS_UPDATE: 'movements:update',
  MOVEMENTS_DELETE: 'movements:delete',

  // Stock
  STOCK_VIEW: 'stock:view',
  STOCK_ADJUST: 'stock:adjust',
  STOCK_TRANSFER: 'stock:transfer',

  // Purchase Orders
  PO_VIEW: 'purchase_orders:view',
  PO_CREATE: 'purchase_orders:create',
  PO_APPROVE: 'purchase_orders:approve',
  PO_RECEIVE: 'purchase_orders:receive',
  PO_CANCEL: 'purchase_orders:cancel',

  // Sales
  SALES_VIEW: 'sales:view',
  SALES_CREATE: 'sales:create',
  SALES_APPROVE: 'sales:approve',
  SALES_CANCEL: 'sales:cancel',

  // Exit Notes
  EXIT_NOTE_VIEW: 'exit_notes:view',
  EXIT_NOTE_CREATE: 'exit_notes:create',
  EXIT_NOTE_PREPARE: 'exit_notes:prepare',
  EXIT_NOTE_DELIVER: 'exit_notes:deliver',

  // Payments
  PAYMENT_VIEW: 'payments:view',
  PAYMENT_CREATE: 'payments:create',
  PAYMENT_CANCEL: 'payments:cancel',

  // Invoices
  INVOICE_VIEW: 'invoices:view',
  INVOICE_CREATE: 'invoices:create',
  INVOICE_CANCEL: 'invoices:cancel',

  // Loans
  LOAN_VIEW: 'loans:view',
  LOAN_CREATE: 'loans:create',
  LOAN_APPROVE: 'loans:approve',
  LOAN_ACTIVATE: 'loans:activate',
  LOAN_RETURN: 'loans:return',
  LOAN_CANCEL: 'loans:cancel',

  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',

  // Users
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',

  // Empresas
  EMPRESA_VIEW: 'empresa:view',
  EMPRESA_CREATE: 'empresa:create',
  EMPRESA_UPDATE: 'empresa:update',
  EMPRESA_DELETE: 'empresa:delete',

  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_UPDATE: 'settings:update',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'GERENTE'
  | 'VENDEDOR'
  | 'ALMACENISTA'
  | 'MECANICO'
  | 'CAJERO'
  | 'CONTADOR'
  | 'ASESOR'
  | 'VIEWER'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),

  ADMIN: [
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.ITEMS_VIEW,
    PERMISSIONS.ITEMS_CREATE,
    PERMISSIONS.ITEMS_UPDATE,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.STOCK_ADJUST,
    PERMISSIONS.STOCK_TRANSFER,
    PERMISSIONS.PO_VIEW,
    PERMISSIONS.PO_CREATE,
    PERMISSIONS.PO_APPROVE,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_APPROVE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.EMPRESA_VIEW,
    PERMISSIONS.EMPRESA_CREATE,
    PERMISSIONS.EMPRESA_UPDATE,
    PERMISSIONS.EMPRESA_DELETE,
  ],

  GERENTE: [
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.ITEMS_VIEW,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.PO_VIEW,
    PERMISSIONS.PO_APPROVE,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_APPROVE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
  ],

  VENDEDOR: [
    PERMISSIONS.ITEMS_VIEW,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
  ],

  ALMACENISTA: [
    PERMISSIONS.ITEMS_VIEW,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.STOCK_ADJUST,
    PERMISSIONS.PO_VIEW,
    PERMISSIONS.PO_RECEIVE,
    PERMISSIONS.EXIT_NOTE_VIEW,
    PERMISSIONS.EXIT_NOTE_PREPARE,
    PERMISSIONS.EXIT_NOTE_DELIVER,
  ],

  MECANICO: [
    PERMISSIONS.ITEMS_VIEW,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.EXIT_NOTE_VIEW,
  ],

  CAJERO: [
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.PAYMENT_VIEW,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_CREATE,
  ],

  CONTADOR: [
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.PAYMENT_VIEW,
  ],

  ASESOR: [
    PERMISSIONS.ITEMS_VIEW,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
  ],

  VIEWER: [
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.ITEMS_VIEW,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
}
