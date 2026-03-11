// backend/src/features/inventory/index.ts

import { Router } from 'express'

// Importar rutas de submódulos
import itemsRouter from './items/index.js'
import catalogRoutes from './items/catalogs/index.js'
import warehouseRoutes from './warehouses/index.js'
import movementRoutes from './movements/index.js'
import stockRoutes from './stock/index.js'
import reservationRoutes from './reservations/index.js'
import supplierRoutes from './suppliers/index.js'
import purchaseOrderRoutes from './purchaseOrders/index.js'
import entryNoteRoutes from './entryNotes/index.js'
import adjustmentRoutes from './adjustments/index.js'
import cycleCountRoutes from './cycleCounts/index.js'
import reconciliationRoutes from './reconciliations/index.js'
import { batchesRouter } from './batches/index.js'
import { serialNumbersRouter } from './serialNumbers/index.js'
import { transfersRouter } from './transfers/index.js'
import { returnsRouter } from './returns/index.js'
import exitNotesRouter from './exitNotes/index.js'
import loanRoutes from './loans/loans.routes.js'
import reportRoutes from './reports/index.js'
import analyticsRoutes from './analytics/index.js'
import integrationsRoutes from './integrations/index.js'

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
