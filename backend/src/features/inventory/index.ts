// backend/src/features/inventory/index.ts

import { Router } from 'express'

// Importar rutas de submódulos
import itemsRouter from './items/index'
import catalogRoutes from './items/catalogs/index'
import warehouseRoutes from './warehouses/index'
import movementRoutes from './movements/index'
import stockRoutes from './stock/index'
import reservationRoutes from './reservations/index'
import supplierRoutes from './suppliers/index'
import purchaseOrderRoutes from './purchaseOrders/index'
import entryNoteRoutes from './entryNotes/index'
import adjustmentRoutes from './adjustments/index'
import cycleCountRoutes from './cycleCounts/index'
import reconciliationRoutes from './reconciliations/index'
import { batchesRouter } from './batches/index'
import { serialNumbersRouter } from './serialNumbers/index'
import { transfersRouter } from './transfers/index'
import { returnsRouter } from './returns/index'
import exitNotesRouter from './exitNotes/index'
import loanRoutes from './loans/loans.routes'
import reportRoutes from './reports/index'
import analyticsRoutes from './analytics/index'
import integrationsRoutes from './integrations/index'

const router = Router()

/**
 * Rutas de Inventory
 * Base: /api/inventory
 */

// Artículos/Items
// /api/inventory/items/*
router.use('/items', itemsRouter)

// Catálogos (brands, categories, units, models, model-compatibility)
// /api/inventory/catalogs/*
router.use('/catalogs', catalogRoutes)

// Almacenes
// /api/inventory/warehouses/*
router.use('/warehouses', warehouseRoutes)

// Movimientos
// /api/inventory/movements/*
router.use('/movements', movementRoutes)

// Stock
// /api/inventory/stock/*
router.use('/stock', stockRoutes)

// Reservas
// /api/inventory/reservations/*
router.use('/reservations', reservationRoutes)

// Proveedores
// /api/inventory/suppliers/*
router.use('/suppliers', supplierRoutes)

// Órdenes de Compra
// /api/inventory/purchase-orders/*
router.use('/purchase-orders', purchaseOrderRoutes)

// Notas de Entrada
// /api/inventory/entry-notes/*
router.use('/entry-notes', entryNoteRoutes)

// Ajustes
// /api/inventory/adjustments/*
router.use('/adjustments', adjustmentRoutes)

// Ciclos de Conteo
// /api/inventory/cycle-counts/*
router.use('/cycle-counts', cycleCountRoutes)

// Reconciliaciones
// /api/inventory/reconciliations/*
router.use('/reconciliations', reconciliationRoutes)

// Lotes
// /api/inventory/batches/*
router.use('/batches', batchesRouter)

// Números de Serie
// /api/inventory/serial-numbers/*
router.use('/serial-numbers', serialNumbersRouter)

// Transferencias
// /api/inventory/transfers/*
router.use('/transfers', transfersRouter)

// Préstamos
// /api/inventory/loans/*
router.use('/loans', loanRoutes)

// Devoluciones
// /api/inventory/returns/*
router.use('/returns', returnsRouter)

// Notas de Salida
// /api/inventory/exit-notes/*
router.use('/exit-notes', exitNotesRouter)

// Reportes
// /api/inventory/reports/*
router.use('/reports', reportRoutes)

// Analíticas
// /api/inventory/analytics/*
router.use('/analytics', analyticsRoutes)

// Integraciones
// /api/inventory/integrations/*
router.use('/integrations', integrationsRoutes)

export default router
