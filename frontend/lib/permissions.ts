// Catálogo de permisos compartido — alineado con PERMISSIONS en backend

export const PERMISSION_GROUPS: { label: string; icon: string; prefix: string }[] = [
  { label: "Usuarios", icon: "pi pi-users", prefix: "users" },
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
  // CRM
  { label: "CRM: Clientes", icon: "pi pi-users", prefix: "crm.customers" },
  { label: "CRM: Vehículos", icon: "pi pi-car", prefix: "crm.vehicles" },
  { label: "CRM: Leads", icon: "pi pi-chart-line", prefix: "crm.leads" },
  { label: "CRM: Interacciones", icon: "pi pi-comments", prefix: "crm.interactions" },
  { label: "CRM: Actividades", icon: "pi pi-check-square", prefix: "crm.activities" },
  // Workshop (Taller)
  { label: "Taller", icon: "pi pi-wrench", prefix: "workshop" },
]

export const PERMISSION_LABELS: Record<string, string> = {
  // Usuarios
  "users.view": "Ver",
  "users.create": "Crear",
  "users.update": "Editar",
  "users.delete": "Eliminar",
  "users.approve": "Aprobar",
  // Inventario
  "inventory.view": "Ver",
  "inventory.create": "Crear",
  "inventory.update": "Editar",
  "inventory.delete": "Eliminar",
  "inventory.approve": "Aprobar",
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
  // Taller
  "workshop.view": "Ver",
  "workshop.create": "Crear",
  "workshop.update": "Editar",
  "workshop.delete": "Eliminar",
}

export const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS)
