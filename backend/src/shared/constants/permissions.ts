// backend/src/shared/constants/permissions.ts
// Catálogo completo de permisos del sistema.
// Todos los módulos siguen el patrón: view · create · update · delete · approve
// Las acciones especiales (adjust, transfer, export) se añaden donde aplica.

export const PERMISSIONS = {
  // ── Usuarios ────────────────────────────────────────────────────────────
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_APPROVE: 'users.approve',

  // ── Inventario general (catálogos, notas entrada/salida, ajustes, conteos)
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_UPDATE: 'inventory.update',
  INVENTORY_DELETE: 'inventory.delete',
  INVENTORY_APPROVE: 'inventory.approve',

  // ── Artículos (items CRUD, imágenes, bulk) ───────────────────────────────
  ITEMS_VIEW: 'items.view',
  ITEMS_CREATE: 'items.create',
  ITEMS_UPDATE: 'items.update',
  ITEMS_DELETE: 'items.delete',
  ITEMS_APPROVE: 'items.approve',

  // ── Almacenes ────────────────────────────────────────────────────────────
  WAREHOUSES_VIEW: 'warehouses.view',
  WAREHOUSES_CREATE: 'warehouses.create',
  WAREHOUSES_UPDATE: 'warehouses.update',
  WAREHOUSES_DELETE: 'warehouses.delete',
  WAREHOUSES_APPROVE: 'warehouses.approve',

  // ── Stock ────────────────────────────────────────────────────────────────
  STOCK_VIEW: 'stock.view',
  STOCK_ADJUST: 'stock.adjust',
  STOCK_TRANSFER: 'stock.transfer',
  STOCK_APPROVE: 'stock.approve',

  // ── Movimientos ──────────────────────────────────────────────────────────
  MOVEMENTS_VIEW: 'movements.view',
  MOVEMENTS_CREATE: 'movements.create',
  MOVEMENTS_UPDATE: 'movements.update',
  MOVEMENTS_DELETE: 'movements.delete',
  MOVEMENTS_APPROVE: 'movements.approve',

  // ── Préstamos ────────────────────────────────────────────────────────────
  LOANS_VIEW: 'loans.view',
  LOANS_CREATE: 'loans.create',
  LOANS_UPDATE: 'loans.update',
  LOANS_DELETE: 'loans.delete',
  LOANS_APPROVE: 'loans.approve',

  // ── Transferencias ───────────────────────────────────────────────────────
  TRANSFERS_VIEW: 'transfers.view',
  TRANSFERS_CREATE: 'transfers.create',
  TRANSFERS_UPDATE: 'transfers.update',
  TRANSFERS_DELETE: 'transfers.delete',
  TRANSFERS_APPROVE: 'transfers.approve',

  // ── Clientes ─────────────────────────────────────────────────────────────
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_UPDATE: 'customers.update',
  CUSTOMERS_DELETE: 'customers.delete',
  CUSTOMERS_APPROVE: 'customers.approve',

  // ── Órdenes de venta ────────────────────────────────────────────────────
  ORDERS_VIEW: 'orders.view',
  ORDERS_CREATE: 'orders.create',
  ORDERS_UPDATE: 'orders.update',
  ORDERS_DELETE: 'orders.delete',
  ORDERS_APPROVE: 'orders.approve',

  // ── Facturas ─────────────────────────────────────────────────────────────
  INVOICES_VIEW: 'invoices.view',
  INVOICES_CREATE: 'invoices.create',
  INVOICES_UPDATE: 'invoices.update',
  INVOICES_DELETE: 'invoices.delete',
  INVOICES_APPROVE: 'invoices.approve',

  // ── Cotizaciones ─────────────────────────────────────────────────────────
  QUOTES_VIEW: 'quotes.view',
  QUOTES_CREATE: 'quotes.create',
  QUOTES_UPDATE: 'quotes.update',
  QUOTES_DELETE: 'quotes.delete',
  QUOTES_APPROVE: 'quotes.approve',

  // ── Pagos ────────────────────────────────────────────────────────────────
  PAYMENTS_VIEW: 'payments.view',
  PAYMENTS_CREATE: 'payments.create',
  PAYMENTS_UPDATE: 'payments.update',
  PAYMENTS_DELETE: 'payments.delete',
  PAYMENTS_APPROVE: 'payments.approve',

  // ── Reportes ─────────────────────────────────────────────────────────────
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  REPORTS_APPROVE: 'reports.approve',

  // ── CRM: Clientes ─────────────────────────────────────────────────────────
  CRM_CUSTOMERS_VIEW: 'crm.customers.view',
  CRM_CUSTOMERS_CREATE: 'crm.customers.create',
  CRM_CUSTOMERS_UPDATE: 'crm.customers.update',
  CRM_CUSTOMERS_DELETE: 'crm.customers.delete',

  // ── CRM: Vehículos del cliente ────────────────────────────────────────────
  CRM_VEHICLES_VIEW: 'crm.vehicles.view',
  CRM_VEHICLES_CREATE: 'crm.vehicles.create',
  CRM_VEHICLES_UPDATE: 'crm.vehicles.update',
  CRM_VEHICLES_DELETE: 'crm.vehicles.delete',

  // ── CRM: Leads / Oportunidades ────────────────────────────────────────────
  CRM_LEADS_VIEW: 'crm.leads.view',
  CRM_LEADS_CREATE: 'crm.leads.create',
  CRM_LEADS_UPDATE: 'crm.leads.update',
  CRM_LEADS_DELETE: 'crm.leads.delete',

  // ── CRM: Interacciones ────────────────────────────────────────────────────
  CRM_INTERACTIONS_VIEW: 'crm.interactions.view',
  CRM_INTERACTIONS_CREATE: 'crm.interactions.create',
  CRM_INTERACTIONS_UPDATE: 'crm.interactions.update',
  CRM_INTERACTIONS_DELETE: 'crm.interactions.delete',

  // ── CRM: Actividades / Seguimientos ──────────────────────────────────────
  CRM_ACTIVITIES_VIEW: 'crm.activities.view',
  CRM_ACTIVITIES_CREATE: 'crm.activities.create',
  CRM_ACTIVITIES_UPDATE: 'crm.activities.update',
  CRM_ACTIVITIES_DELETE: 'crm.activities.delete',

  // ── CRM: Cotizaciones ─────────────────────────────────────────────────────
  CRM_QUOTES_VIEW: 'crm.quotes.view',
  CRM_QUOTES_CREATE: 'crm.quotes.create',
  CRM_QUOTES_UPDATE: 'crm.quotes.update',
  CRM_QUOTES_DELETE: 'crm.quotes.delete',

  // ── CRM: Casos / Reclamos ────────────────────────────────────────────────
  CRM_CASES_VIEW: 'crm.cases.view',
  CRM_CASES_CREATE: 'crm.cases.create',
  CRM_CASES_UPDATE: 'crm.cases.update',
  CRM_CASES_DELETE: 'crm.cases.delete',

  // ── Taller ────────────────────────────────────────────────────────────────
  WORKSHOP_VIEW: 'workshop.view',
  WORKSHOP_CREATE: 'workshop.create',
  WORKSHOP_UPDATE: 'workshop.update',
  WORKSHOP_DELETE: 'workshop.delete',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
