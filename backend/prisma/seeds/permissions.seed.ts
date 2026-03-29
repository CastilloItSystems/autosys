import type { PrismaClient } from '../../src/generated/prisma/client.js'

export const PERMISSIONS = [
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

  // Taller
  { code: 'workshop.view', description: 'Ver órdenes de taller' },
  { code: 'workshop.create', description: 'Crear órdenes de taller' },
  { code: 'workshop.update', description: 'Actualizar órdenes de taller' },
  { code: 'workshop.delete', description: 'Eliminar órdenes de taller' },
]

export default async function seedPermissions(prisma: PrismaClient) {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: { description: permission.description },
      create: permission,
    })
  }

  console.log(`✅ ${PERMISSIONS.length} permisos sembrados`)
}
