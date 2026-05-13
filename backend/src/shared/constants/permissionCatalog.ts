export const PERMISSION_CATALOG = [
  // Usuarios
  { code: 'users.view', description: 'Ver usuarios' },
  { code: 'users.create', description: 'Crear usuarios' },
  { code: 'users.update', description: 'Actualizar usuarios' },
  { code: 'users.delete', description: 'Eliminar usuarios' },
  { code: 'users.approve', description: 'Aprobar acciones de usuarios' },

  // Usuarios globales SaaS
  { code: 'platform_users.view', description: 'Ver usuarios globales SaaS' },
  { code: 'platform_users.create', description: 'Crear usuarios globales SaaS' },
  { code: 'platform_users.update', description: 'Actualizar usuarios globales SaaS' },
  { code: 'platform_users.delete', description: 'Eliminar usuarios globales SaaS' },

  // Empresas
  { code: 'companies.view', description: 'Ver empresas' },
  { code: 'companies.create', description: 'Crear empresas' },
  { code: 'companies.update', description: 'Actualizar empresas' },
  { code: 'companies.delete', description: 'Eliminar empresas' },

  // Roles dinámicos de empresa
  { code: 'company_roles.view', description: 'Ver roles de empresa' },
  { code: 'company_roles.create', description: 'Crear roles de empresa' },
  { code: 'company_roles.update', description: 'Actualizar roles de empresa' },
  { code: 'company_roles.delete', description: 'Eliminar roles de empresa' },

  // Inventario (catálogos, notas entrada/salida, ajustes, conteos cíclicos)
  { code: 'inventory.view', description: 'Ver inventario' },
  { code: 'inventory.create', description: 'Crear registros de inventario' },
  { code: 'inventory.update', description: 'Actualizar inventario' },
  { code: 'inventory.delete', description: 'Eliminar registros de inventario' },
  {
    code: 'inventory.approve',
    description: 'Aprobar movimientos de inventario',
  },

  // Compras: ordenes y proveedores
  { code: 'purchases.orders.view', description: 'Ver ordenes de compra' },
  { code: 'purchases.orders.create', description: 'Crear ordenes de compra' },
  { code: 'purchases.orders.update', description: 'Actualizar ordenes de compra' },
  { code: 'purchases.orders.delete', description: 'Eliminar ordenes de compra' },
  { code: 'purchases.orders.approve', description: 'Aprobar/rechazar ordenes de compra' },
  { code: 'purchases.orders.receive', description: 'Recibir ordenes de compra' },
  { code: 'purchases.suppliers.view', description: 'Ver proveedores de compras' },
  { code: 'purchases.suppliers.create', description: 'Crear proveedores de compras' },
  { code: 'purchases.suppliers.update', description: 'Actualizar proveedores de compras' },
  { code: 'purchases.suppliers.delete', description: 'Eliminar proveedores de compras' },

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

  // Auditoría
  { code: 'audit.view', description: 'Ver auditoría global por empresa' },

  // Notificaciones
  { code: 'notifications.view', description: 'Ver centro de notificaciones' },
  {
    code: 'notifications.manage_policy',
    description: 'Gestionar políticas de notificación por empresa',
  },
  {
    code: 'inventory.notifications.view',
    description: 'Ver notificaciones del módulo de inventario',
  },
  {
    code: 'sales.notifications.view',
    description: 'Ver notificaciones del módulo de ventas',
  },
  {
    code: 'purchases.notifications.view',
    description: 'Ver notificaciones del módulo de compras',
  },
  {
    code: 'workshop.notifications.view',
    description: 'Ver notificaciones del módulo de taller',
  },
  {
    code: 'crm.notifications.view',
    description: 'Ver notificaciones del módulo de CRM',
  },
  {
    code: 'dealer.notifications.view',
    description: 'Ver notificaciones del módulo de concesionario',
  },
  {
    code: 'exchange_rates.notifications.view',
    description: 'Ver notificaciones del módulo de tasas de cambio',
  },
  {
    code: 'system.notifications.view',
    description: 'Ver notificaciones del módulo de sistema',
  },

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

  // CRM: Oportunidades
  { code: 'crm.opportunities.view', description: 'Ver oportunidades CRM' },
  { code: 'crm.opportunities.create', description: 'Crear oportunidades CRM' },
  { code: 'crm.opportunities.update', description: 'Actualizar oportunidades CRM' },
  { code: 'crm.opportunities.delete', description: 'Eliminar oportunidades CRM' },

  // CRM: Campañas
  { code: 'crm.campaigns.view', description: 'Ver campañas CRM' },
  { code: 'crm.campaigns.create', description: 'Crear campañas CRM' },
  { code: 'crm.campaigns.update', description: 'Actualizar campañas CRM' },
  { code: 'crm.campaigns.delete', description: 'Eliminar campañas CRM' },

  // CRM: Fidelización
  { code: 'crm.loyalty.view', description: 'Ver fidelización CRM' },
  { code: 'crm.loyalty.create', description: 'Crear registros de fidelización CRM' },
  { code: 'crm.loyalty.update', description: 'Actualizar registros de fidelización CRM' },
  { code: 'crm.loyalty.delete', description: 'Eliminar registros de fidelización CRM' },

  // CRM: Automatizaciones
  { code: 'crm.automations.view', description: 'Ver alertas de automatizaciones CRM' },
  { code: 'crm.automations.run', description: 'Ejecutar reglas de automatizaciones CRM' },

  // Taller
  { code: 'workshop.view', description: 'Ver órdenes de taller' },
  { code: 'workshop.create', description: 'Crear órdenes de taller' },
  { code: 'workshop.update', description: 'Actualizar órdenes de taller' },
  { code: 'workshop.delete', description: 'Eliminar órdenes de taller' },

  // Concesionario
  { code: 'dealer.view', description: 'Ver módulo de concesionario' },
  { code: 'dealer.create', description: 'Crear registros en concesionario' },
  { code: 'dealer.update', description: 'Actualizar registros en concesionario' },
  { code: 'dealer.delete', description: 'Eliminar registros en concesionario' },
  { code: 'dealer.approve', description: 'Aprobar acciones de concesionario' },

  // Tasas de Cambio
  { code: 'exchange_rates.view', description: 'Ver tasas de cambio' },
  { code: 'exchange_rates.create', description: 'Crear tasas de cambio manuales' },
  { code: 'exchange_rates.update', description: 'Actualizar tasas de cambio' },
  { code: 'exchange_rates.delete', description: 'Eliminar tasas de cambio' },

  // Finanzas
  { code: 'finance.view', description: 'Ver módulo de finanzas' },
  { code: 'finance.bank_accounts.view', description: 'Ver cuentas bancarias' },
  { code: 'finance.bank_accounts.manage', description: 'Gestionar cuentas bancarias' },
  { code: 'finance.supplier_bills.view', description: 'Ver facturas de proveedores' },
  { code: 'finance.supplier_bills.manage', description: 'Gestionar facturas de proveedores' },
  { code: 'finance.supplier_payments.view', description: 'Ver pagos a proveedores' },
  { code: 'finance.supplier_payments.create', description: 'Registrar pagos a proveedores' },
  { code: 'finance.supplier_payments.cancel', description: 'Cancelar pagos a proveedores' },
  { code: 'finance.expenses.view', description: 'Ver gastos operativos' },
  { code: 'finance.expenses.manage', description: 'Gestionar gastos operativos' },
  { code: 'finance.recurring_rules.manage', description: 'Gestionar reglas de gastos recurrentes' },
  { code: 'finance.cash_flow.view', description: 'Ver flujo de caja' },
] as const
