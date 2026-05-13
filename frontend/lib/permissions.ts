// Catálogo de permisos compartido — alineado con PERMISSIONS en backend

import { ROUTE_PERMISSION_CODES } from "@/lib/permissionGates";

export const PERMISSION_GROUPS: { label: string; icon: string; prefix: string }[] = [
  { label: "Usuarios", icon: "pi pi-users", prefix: "users" },
  { label: "Usuarios Plataforma", icon: "pi pi-shield", prefix: "platform_users" },
  { label: "Empresas", icon: "pi pi-building", prefix: "companies" },
  { label: "Roles de Empresa", icon: "pi pi-id-card", prefix: "company_roles" },
  { label: "Inventario", icon: "pi pi-box", prefix: "inventory" },
  { label: "Artículos", icon: "pi pi-tag", prefix: "items" },
  { label: "Almacenes", icon: "pi pi-database", prefix: "warehouses" },
  { label: "Stock", icon: "pi pi-chart-bar", prefix: "stock" },
  { label: "Movimientos", icon: "pi pi-arrows-h", prefix: "movements" },
  { label: "Préstamos", icon: "pi pi-share-alt", prefix: "loans" },
  { label: "Transferencias", icon: "pi pi-send", prefix: "transfers" },
  { label: "Clientes", icon: "pi pi-id-card", prefix: "customers" },
  { label: "Órdenes", icon: "pi pi-shopping-cart", prefix: "orders" },
  { label: "Facturas", icon: "pi pi-file", prefix: "invoices" },
  { label: "Cotizaciones", icon: "pi pi-file-edit", prefix: "quotes" },
  { label: "Pagos", icon: "pi pi-credit-card", prefix: "payments" },
  { label: "Reportes", icon: "pi pi-chart-line", prefix: "reports" },
  { label: "Auditoría", icon: "pi pi-history", prefix: "audit" },
  { label: "Notificaciones", icon: "pi pi-bell", prefix: "notifications" },
  {
    label: "Notif: Inventario",
    icon: "pi pi-bell",
    prefix: "inventory.notifications",
  },
  { label: "Notif: Ventas", icon: "pi pi-bell", prefix: "sales.notifications" },
  {
    label: "Notif: Compras",
    icon: "pi pi-bell",
    prefix: "purchases.notifications",
  },
  { label: "Compras: Órdenes", icon: "pi pi-shopping-bag", prefix: "purchases.orders" },
  { label: "Compras: Proveedores", icon: "pi pi-truck", prefix: "purchases.suppliers" },
  {
    label: "Notif: Taller",
    icon: "pi pi-bell",
    prefix: "workshop.notifications",
  },
  { label: "Notif: CRM", icon: "pi pi-bell", prefix: "crm.notifications" },
  {
    label: "Notif: Concesionario",
    icon: "pi pi-bell",
    prefix: "dealer.notifications",
  },
  {
    label: "Notif: Tasas",
    icon: "pi pi-bell",
    prefix: "exchange_rates.notifications",
  },
  {
    label: "Notif: Sistema",
    icon: "pi pi-bell",
    prefix: "system.notifications",
  },
  // CRM
  { label: "CRM: Clientes", icon: "pi pi-users", prefix: "crm.customers" },
  { label: "CRM: Vehículos", icon: "pi pi-car", prefix: "crm.vehicles" },
  { label: "CRM: Leads", icon: "pi pi-chart-line", prefix: "crm.leads" },
  { label: "CRM: Interacciones", icon: "pi pi-comments", prefix: "crm.interactions" },
  { label: "CRM: Actividades", icon: "pi pi-check-square", prefix: "crm.activities" },
  { label: "CRM: Cotizaciones", icon: "pi pi-file-edit", prefix: "crm.quotes" },
  { label: "CRM: Casos", icon: "pi pi-briefcase", prefix: "crm.cases" },
  { label: "CRM: Oportunidades", icon: "pi pi-sitemap", prefix: "crm.opportunities" },
  { label: "CRM: Campañas", icon: "pi pi-megaphone", prefix: "crm.campaigns" },
  { label: "CRM: Fidelización", icon: "pi pi-heart", prefix: "crm.loyalty" },
  { label: "CRM: Automatizaciones", icon: "pi pi-bolt", prefix: "crm.automations" },
  // Workshop (Taller)
  { label: "Taller", icon: "pi pi-wrench", prefix: "workshop" },
  // Concesionario
  { label: "Concesionario", icon: "pi pi-car", prefix: "dealer" },
  // Tasas de Cambio
  { label: "Tasas de Cambio", icon: "pi pi-sync", prefix: "exchange_rates" },
  // Finanzas
  { label: "Finanzas", icon: "pi pi-wallet", prefix: "finance" },
  { label: "Finanzas: Cuentas Bancarias", icon: "pi pi-building-columns", prefix: "finance.bank_accounts" },
  { label: "Finanzas: Facturas Proveedor", icon: "pi pi-file-edit", prefix: "finance.supplier_bills" },
  { label: "Finanzas: Pagos Proveedor", icon: "pi pi-dollar", prefix: "finance.supplier_payments" },
  { label: "Finanzas: Gastos", icon: "pi pi-receipt", prefix: "finance.expenses" },
  { label: "Finanzas: Gastos Recurrentes", icon: "pi pi-sync", prefix: "finance.recurring_rules" },
  { label: "Finanzas: Flujo de Caja", icon: "pi pi-chart-line", prefix: "finance.cash_flow" },
]

export const PERMISSION_LABELS: Record<string, string> = {
  // Usuarios
  "users.view": "Ver",
  "users.create": "Crear",
  "users.update": "Editar",
  "users.delete": "Eliminar",
  "users.approve": "Aprobar",
  // Usuarios globales SaaS
  "platform_users.view": "Ver",
  "platform_users.create": "Crear",
  "platform_users.update": "Editar",
  "platform_users.delete": "Eliminar",
  // Empresas
  "companies.view": "Ver",
  "companies.create": "Crear",
  "companies.update": "Editar",
  "companies.delete": "Eliminar",
  // Roles de Empresa
  "company_roles.view": "Ver",
  "company_roles.create": "Crear",
  "company_roles.update": "Editar",
  "company_roles.delete": "Eliminar",
  // Inventario
  "inventory.view": "Ver",
  "inventory.create": "Crear",
  "inventory.update": "Editar",
  "inventory.delete": "Eliminar",
  "inventory.approve": "Aprobar",
  // Compras: Órdenes
  "purchases.orders.view": "Ver",
  "purchases.orders.create": "Crear",
  "purchases.orders.update": "Editar",
  "purchases.orders.delete": "Eliminar",
  "purchases.orders.approve": "Aprobar",
  "purchases.orders.receive": "Recibir",
  // Compras: Proveedores
  "purchases.suppliers.view": "Ver",
  "purchases.suppliers.create": "Crear",
  "purchases.suppliers.update": "Editar",
  "purchases.suppliers.delete": "Eliminar",
  // Artículos
  "items.view": "Ver",
  "items.create": "Crear",
  "items.update": "Editar",
  "items.delete": "Eliminar",
  "items.approve": "Aprobar",
  // Almacenes
  "warehouses.view": "Ver",
  "warehouses.create": "Crear",
  "warehouses.update": "Editar",
  "warehouses.delete": "Eliminar",
  "warehouses.approve": "Aprobar",
  // Stock
  "stock.view": "Ver",
  "stock.adjust": "Ajustar",
  "stock.transfer": "Transferir",
  "stock.approve": "Aprobar",
  // Movimientos
  "movements.view": "Ver",
  "movements.create": "Crear",
  "movements.update": "Editar",
  "movements.delete": "Eliminar",
  "movements.approve": "Aprobar",
  // Préstamos
  "loans.view": "Ver",
  "loans.create": "Crear",
  "loans.update": "Editar",
  "loans.delete": "Eliminar",
  "loans.approve": "Aprobar",
  // Transferencias
  "transfers.view": "Ver",
  "transfers.create": "Crear",
  "transfers.update": "Editar",
  "transfers.delete": "Eliminar",
  "transfers.approve": "Aprobar",
  // Clientes
  "customers.view": "Ver",
  "customers.create": "Crear",
  "customers.update": "Editar",
  "customers.delete": "Eliminar",
  "customers.approve": "Aprobar",
  // Órdenes
  "orders.view": "Ver",
  "orders.create": "Crear",
  "orders.update": "Editar",
  "orders.delete": "Eliminar",
  "orders.approve": "Aprobar",
  // Facturas
  "invoices.view": "Ver",
  "invoices.create": "Crear",
  "invoices.update": "Editar",
  "invoices.delete": "Eliminar",
  "invoices.approve": "Aprobar",
  // Cotizaciones
  "quotes.view": "Ver",
  "quotes.create": "Crear",
  "quotes.update": "Editar",
  "quotes.delete": "Eliminar",
  "quotes.approve": "Aprobar",
  // Pagos
  "payments.view": "Ver",
  "payments.create": "Crear",
  "payments.update": "Editar",
  "payments.delete": "Eliminar",
  "payments.approve": "Aprobar",
  // Reportes
  "reports.view": "Ver",
  "reports.export": "Exportar",
  "reports.approve": "Aprobar",
  // Auditoría
  "audit.view": "Ver",
  // Notificaciones
  "notifications.view": "Ver",
  "notifications.manage_policy": "Gestionar políticas",
  "inventory.notifications.view": "Ver",
  "sales.notifications.view": "Ver",
  "purchases.notifications.view": "Ver",
  "workshop.notifications.view": "Ver",
  "crm.notifications.view": "Ver",
  "dealer.notifications.view": "Ver",
  "exchange_rates.notifications.view": "Ver",
  "system.notifications.view": "Ver",
  // CRM: Clientes
  "crm.customers.view": "Ver",
  "crm.customers.create": "Crear",
  "crm.customers.update": "Editar",
  "crm.customers.delete": "Eliminar",
  // CRM: Vehículos
  "crm.vehicles.view": "Ver",
  "crm.vehicles.create": "Crear",
  "crm.vehicles.update": "Editar",
  "crm.vehicles.delete": "Eliminar",
  // CRM: Leads
  "crm.leads.view": "Ver",
  "crm.leads.create": "Crear",
  "crm.leads.update": "Editar",
  "crm.leads.delete": "Eliminar",
  // CRM: Interacciones
  "crm.interactions.view": "Ver",
  "crm.interactions.create": "Crear",
  "crm.interactions.update": "Editar",
  "crm.interactions.delete": "Eliminar",
  // CRM: Actividades
  "crm.activities.view": "Ver",
  "crm.activities.create": "Crear",
  "crm.activities.update": "Editar",
  "crm.activities.delete": "Eliminar",
  // CRM: Cotizaciones
  "crm.quotes.view": "Ver",
  "crm.quotes.create": "Crear",
  "crm.quotes.update": "Editar",
  "crm.quotes.delete": "Eliminar",
  // CRM: Casos
  "crm.cases.view": "Ver",
  "crm.cases.create": "Crear",
  "crm.cases.update": "Editar",
  "crm.cases.delete": "Eliminar",
  // CRM: Oportunidades
  "crm.opportunities.view": "Ver",
  "crm.opportunities.create": "Crear",
  "crm.opportunities.update": "Editar",
  "crm.opportunities.delete": "Eliminar",
  // CRM: Campañas
  "crm.campaigns.view": "Ver",
  "crm.campaigns.create": "Crear",
  "crm.campaigns.update": "Editar",
  "crm.campaigns.delete": "Eliminar",
  // CRM: Fidelización
  "crm.loyalty.view": "Ver",
  "crm.loyalty.create": "Crear",
  "crm.loyalty.update": "Editar",
  "crm.loyalty.delete": "Eliminar",
  // CRM: Automatizaciones
  "crm.automations.view": "Ver",
  "crm.automations.run": "Ejecutar",
  // Taller
  "workshop.view": "Ver",
  "workshop.create": "Crear",
  "workshop.update": "Editar",
  "workshop.delete": "Eliminar",
  // Concesionario
  "dealer.view": "Ver",
  "dealer.create": "Crear",
  "dealer.update": "Editar",
  "dealer.delete": "Eliminar",
  "dealer.approve": "Aprobar",
  // Tasas de Cambio
  "exchange_rates.view": "Ver",
  "exchange_rates.create": "Crear",
  "exchange_rates.update": "Editar",
  "exchange_rates.delete": "Eliminar",
  // Finanzas
  "finance.view": "Ver",
  // Cuentas Bancarias
  "finance.bank_accounts.view": "Ver",
  "finance.bank_accounts.manage": "Gestionar",
  // Facturas Proveedor
  "finance.supplier_bills.view": "Ver",
  "finance.supplier_bills.manage": "Gestionar",
  // Pagos Proveedor
  "finance.supplier_payments.view": "Ver",
  "finance.supplier_payments.create": "Crear",
  "finance.supplier_payments.cancel": "Cancelar",
  // Gastos
  "finance.expenses.view": "Ver",
  "finance.expenses.manage": "Gestionar",
  // Gastos Recurrentes
  "finance.recurring_rules.manage": "Gestionar",
  // Flujo de Caja
  "finance.cash_flow.view": "Ver",
}

export const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS)

const MISSING_ROUTE_PERMISSION_LABELS = ROUTE_PERMISSION_CODES.filter(
  (permission) => !PERMISSION_LABELS[permission],
);

if (MISSING_ROUTE_PERMISSION_LABELS.length > 0) {
  throw new Error(
    `Faltan etiquetas frontend para permisos usados en rutas: ${MISSING_ROUTE_PERMISSION_LABELS.join(", ")}`,
  );
}
